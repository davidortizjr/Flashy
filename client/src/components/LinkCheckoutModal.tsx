import { useEffect, useRef, useState } from 'react'
import Button from './Button'
import { getPaymentStatus, startCheckout, type PayablePlanId } from '../lib/api'

interface LinkCheckoutModalProps {
  plan: PayablePlanId
  planLabel: string
  onClose: () => void
  onSuccess: () => void
}

type Stage = 'loading' | 'ready' | 'polling' | 'paid' | 'failed' | 'error'

const POLL_INTERVAL_MS = 3000

export default function LinkCheckoutModal({ plan, planLabel, onClose, onSuccess }: LinkCheckoutModalProps) {
  const [stage, setStage] = useState<Stage>('loading')
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [amount, setAmount] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const pollErrorCount = useRef(0)
  const [attempt, setAttempt] = useState(0)
  const linkId = useRef<string | null>(null)
  const openedTab = useRef<Window | null>(null)

  useEffect(() => {
    linkId.current = null
    startCheckout(plan)
      .then((res) => {
        linkId.current = res.linkId
        setCheckoutUrl(res.checkoutUrl)
        setAmount(res.amount)
        setStage('ready')
        // Try to open the hosted checkout automatically. Popup blockers can
        // stop this silently, so we also always show a manual link/button.
        openedTab.current = window.open(res.checkoutUrl, '_blank', 'noopener,noreferrer')
      })
      .catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : 'Could not start checkout.')
        setStage('error')
      })
  }, [plan, attempt])

  const retry = () => {
    setStage('loading')
    setErrorMessage(null)
    pollErrorCount.current = 0
    setAttempt((n) => n + 1)
  }

  // Poll for payment status once the link exists.
  useEffect(() => {
    if (stage !== 'ready' && stage !== 'polling') return
    if (!linkId.current) return

    let cancelled = false
    const poll = async () => {
      try {
        const res = await getPaymentStatus(linkId.current!)
        if (cancelled) return
        pollErrorCount.current = 0
        if (res.status === 'paid') {
          setStage('paid')
        } else if (res.status === 'failed') {
          setErrorMessage('Payment failed. You can try again.')
          setStage('failed')
        } else {
          setStage('polling')
        }
      } catch {
        if (cancelled) return
        // Don't fail silently: after a few consecutive misses, surface it
        // instead of polling forever with nothing visible to the user.
        pollErrorCount.current += 1
        if (pollErrorCount.current >= 4) {
          setErrorMessage("Having trouble checking your payment status. If you've already paid, this can take a minute — or try again below.")
        }
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

  const openCheckout = () => {
    if (!checkoutUrl) return
    openedTab.current = window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
  }

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
            &#8369;{amount.toFixed(2)} &mdash; pay with GCash, Maya, cards, or QR Ph
          </p>
        )}

        <div className="mt-[24px] flex items-center justify-center">
          {stage === 'loading' && (
            <div className="w-full h-[140px] flex items-center justify-center border border-ash rounded-card">
              <span className="font-mono text-[11px] uppercase tracking-label text-ghost/40">
                Opening checkout&hellip;
              </span>
            </div>
          )}

          {(stage === 'ready' || stage === 'polling') && (
            <div className="w-full flex flex-col items-center gap-[15px] py-[20px]">
              <span className="font-mono text-[12px] text-ghost/70 leading-[1.6]">
                We opened PayMongo's secure checkout in a new tab. Complete your payment there —
                this window will update automatically.
              </span>
              <Button variant="ghost" onClick={openCheckout}>
                Didn't open? Click here
              </Button>
              {stage === 'polling' && (
                <span className="font-mono text-[11px] text-kippo-pink uppercase tracking-label">
                  Waiting for payment&hellip;
                </span>
              )}
              {errorMessage && (
                <span className="font-mono text-[11px] text-ghost/50">{errorMessage}</span>
              )}
            </div>
          )}

          {stage === 'paid' && (
            <div className="w-full h-[140px] flex flex-col items-center justify-center gap-[10px] border border-kippo-pink rounded-card">
              <span className="font-mono text-[32px] text-kippo-pink">&#10003;</span>
              <span className="font-mono text-[12px] uppercase tracking-label text-ghost">
                Payment received
              </span>
            </div>
          )}

          {(stage === 'failed' || stage === 'error') && (
            <div className="w-full flex flex-col items-center justify-center gap-[10px] border border-ash rounded-card px-[20px] py-[30px]">
              <span className="font-mono text-[12px] uppercase tracking-label text-ghost/60 text-center">
                {errorMessage || 'Something went wrong'}
              </span>
            </div>
          )}
        </div>

        <div className="mt-[24px] flex justify-center gap-[10px]">
          {(stage === 'failed' || stage === 'error') && (
            <Button variant="primary" onClick={retry}>
              Try again
            </Button>
          )}
          {stage !== 'paid' && (
            <Button variant="ghost" onClick={onClose}>
              {stage === 'failed' || stage === 'error' ? 'Close' : 'Cancel'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
