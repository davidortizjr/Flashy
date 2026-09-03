import { useEffect, useRef, useState } from 'react'
import Button from './Button'
import { getPaymentStatus, startCheckout, type PayablePlanId } from '../lib/api'

interface QrCheckoutModalProps {
  plan: PayablePlanId
  planLabel: string
  onClose: () => void
  onSuccess: () => void
}

type Stage = 'loading' | 'ready' | 'polling' | 'paid' | 'expired' | 'error'

const POLL_INTERVAL_MS = 3000

export default function QrCheckoutModal({ plan, planLabel, onClose, onSuccess }: QrCheckoutModalProps) {
  const [stage, setStage] = useState<Stage>('loading')
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [amount, setAmount] = useState<number | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(600)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const paymentIntentId = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    startCheckout(plan)
      .then((res) => {
        if (cancelled) return
        paymentIntentId.current = res.paymentIntentId
        setQrImage(res.qrImage)
        setAmount(res.amount)
        setSecondsLeft(res.expiresInSeconds)
        setStage('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setErrorMessage(err instanceof Error ? err.message : 'Could not start checkout.')
        setStage('error')
      })

    return () => {
      cancelled = true
    }
  }, [plan])

  // Countdown
  useEffect(() => {
    if (stage !== 'ready' && stage !== 'polling') return
    if (secondsLeft <= 0) return
    const t = setTimeout(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setStage('expired')
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearTimeout(t)
  }, [stage, secondsLeft])

  // Poll for payment status
  useEffect(() => {
    if (stage !== 'ready' && stage !== 'polling') return
    if (!paymentIntentId.current) return

    let cancelled = false
    const poll = async () => {
      try {
        const res = await getPaymentStatus(paymentIntentId.current!)
        if (cancelled) return
        if (res.status === 'paid') {
          setStage('paid')
        } else if (res.status === 'failed') {
          setErrorMessage('Payment failed. You can try again.')
          setStage('error')
        } else {
          setStage('polling')
        }
      } catch {

      }
    }

    const interval = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [stage])

  useEffect(() => {
    if (stage === 'paid') {
      const t = setTimeout(onSuccess, 1200)
      return () => clearTimeout(t)
    }
  }, [stage, onSuccess])

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 px-6">
      <div className="w-full max-w-[380px] bg-carbon border border-ghost rounded-card p-[30px] text-center">
        <p className="font-mono text-[10px] font-bold uppercase tracking-label text-kippo-pink">
          &gt;&gt; CHECKOUT
        </p>
        <h2 className="mt-[10px] font-mono text-[18px] font-bold uppercase tracking-[0.1em] text-ghost">
          {planLabel}
        </h2>
        {amount !== null && (
          <p className="mt-[6px] font-mono text-[12px] text-ghost/50">
            &#8369;{amount.toFixed(2)} &mdash; scan with GCash, Maya, or any QR Ph app
          </p>
        )}

        <div className="mt-[24px] flex items-center justify-center">
          {stage === 'loading' && (
            <div className="w-[220px] h-[220px] flex items-center justify-center border border-ash rounded-card">
              <span className="font-mono text-[11px] uppercase tracking-label text-ghost/40">
                Generating QR&hellip;
              </span>
            </div>
          )}

          {(stage === 'ready' || stage === 'polling') && qrImage && (
            <img
              src={qrImage}
              alt="Scan to pay with QR Ph"
              className="w-[220px] h-[220px] rounded-card bg-ghost p-[10px]"
            />
          )}

          {stage === 'paid' && (
            <div className="w-[220px] h-[220px] flex flex-col items-center justify-center gap-[10px] border border-kippo-pink rounded-card">
              <span className="font-mono text-[32px] text-kippo-pink">&#10003;</span>
              <span className="font-mono text-[12px] uppercase tracking-label text-ghost">
                Payment received
              </span>
            </div>
          )}

          {(stage === 'expired' || stage === 'error') && (
            <div className="w-[220px] h-[220px] flex flex-col items-center justify-center gap-[10px] border border-ash rounded-card px-[20px]">
              <span className="font-mono text-[12px] uppercase tracking-label text-ghost/60 text-center">
                {stage === 'expired' ? 'QR code expired' : errorMessage || 'Something went wrong'}
              </span>
            </div>
          )}
        </div>

        {(stage === 'ready' || stage === 'polling') && (
          <p className="mt-[16px] font-mono text-[11px] text-ghost/40">
            Expires in {mm}:{ss}
          </p>
        )}

        {stage === 'polling' && (
          <p className="mt-[6px] font-mono text-[11px] text-kippo-pink uppercase tracking-label">
            Waiting for payment&hellip;
          </p>
        )}

        <div className="mt-[24px] flex justify-center gap-[10px]">
          {(stage === 'expired' || stage === 'error') && (
            <Button variant="primary" onClick={() => window.location.reload()}>
              Try again
            </Button>
          )}
          {stage !== 'paid' && (
            <Button variant="ghost" onClick={onClose}>
              {stage === 'expired' || stage === 'error' ? 'Close' : 'Cancel'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
