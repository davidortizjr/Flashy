import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Card from '../components/Card'
import Button from '../components/Button'
import LinkCheckoutModal from '../components/LinkCheckoutModal'
import { useAuth } from '../context/useAuth'
import type { PayablePlanId } from '../lib/api'

interface Tier {
  id: 'free' | PayablePlanId
  name: string
  price: string
  cadence: string
  blurb: string
  features: string[]
  cta: string
}

const tiers: Tier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '₱0',
    cadence: 'forever',
    blurb: 'Enough to try Flashy on a chapter or two.',
    features: ['50 cards per month', 'Photo & file import', 'Study mode'],
    cta: 'Current plan',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '₱100',
    cadence: 'one-time · 30 days',
    blurb: 'For one heavy study push — a midterm, a finals week.',
    features: ['100 cards for 30 days', 'Photo & file import', 'Study mode'],
    cta: 'Get Basic',
  },
  {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    price: '₱250',
    cadence: 'per month',
    blurb: 'Unlimited cards for as long as the semester runs.',
    features: ['Unlimited cards', 'Photo & file import', 'Study mode'],
    cta: 'Go Pro Monthly',
  },
  {
    id: 'pro_yearly',
    name: 'Pro Yearly',
    price: '₱700',
    cadence: 'per year',
    blurb: "Best value if you're sticking around all year.",
    features: ['Unlimited cards', 'Photo & file import', 'Study mode', 'Save vs monthly'],
    cta: 'Go Pro Yearly',
  },
]

export default function PricingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [checkoutPlan, setCheckoutPlan] = useState<Tier | null>(null)

  const handlePick = (tier: Tier) => {
    if (tier.id === 'free') return
    if (!user) {
      navigate('/login', { state: { from: '/pricing' } })
      return
    }
    setCheckoutPlan(tier)
  }

  return (
    <div className="min-h-screen bg-void">
      <Navbar />

      <main className="mx-auto max-w-[1200px] px-6 py-[80px]">
        <p className="font-mono text-[10px] font-bold uppercase tracking-label text-kippo-pink text-center">
          &gt;&gt; PRICING
        </p>
        <h1 className="mt-[10px] font-mono font-bold uppercase text-[28px] md:text-[36px] tracking-display leading-[1.19] text-ghost text-center">
          STUDY MORE. <span className="text-kippo-pink">TYPE LESS.</span>
        </h1>
        <p className="mt-[15px] max-w-[480px] mx-auto font-mono text-[14px] leading-[1.7] text-ghost/60 text-center">
          Pay with GCash, Maya, cards, or QR Ph — one secure checkout link.
        </p>

        <div className="mt-[50px] grid sm:grid-cols-2 lg:grid-cols-4 gap-[15px]">
          {tiers.map((tier) => (
            <Card
              key={tier.id}
              fill={tier.id === 'pro_monthly' ? 'carbon' : 'void'}
              className="flex flex-col"
            >
              <span className="font-mono text-[10px] font-bold uppercase tracking-label text-kippo-pink">
                {tier.name}
              </span>
              <div className="mt-[15px] flex items-baseline gap-[6px]">
                <span className="font-mono text-[28px] font-bold text-ghost">{tier.price}</span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-label text-ghost/40">
                {tier.cadence}
              </span>
              <p className="mt-[15px] font-mono text-[12px] leading-[1.6] text-ghost/60">
                {tier.blurb}
              </p>

              <ul className="mt-[20px] flex flex-col gap-[8px] flex-1">
                {tier.features.map((f) => (
                  <li
                    key={f}
                    className="font-mono text-[11px] text-ghost/70 flex items-start gap-[8px]"
                  >
                    <span className="text-kippo-pink">&gt;</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                variant={tier.id === 'free' ? 'ghost' : 'primary'}
                className="mt-[24px] w-full"
                disabled={tier.id === 'free'}
                onClick={() => handlePick(tier)}
              >
                {tier.cta}
              </Button>
            </Card>
          ))}
        </div>
      </main>

      <Footer />

      {checkoutPlan && checkoutPlan.id !== 'free' && (
        <LinkCheckoutModal
          plan={checkoutPlan.id}
          planLabel={checkoutPlan.name}
          onClose={() => setCheckoutPlan(null)}
          onSuccess={() => {
            setCheckoutPlan(null)
            navigate('/dashboard')
          }}
        />
      )}
    </div>
  )
}
