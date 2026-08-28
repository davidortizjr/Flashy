import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Button from '../components/Button'
import FeatureCard from '../components/FeatureCard'
import PhoneMockup from '../components/PhoneMockup'
import TerminalSnippet from '../components/TerminalSnippet'

const features = [
  {
    index: '01',
    title: 'Capture',
    description:
      'Snap a photo of a notebook page, textbook, or slide. Flashy reads the page like a scanner reads a boarding pass.',
  },
  {
    index: '02',
    title: 'Generate',
    description:
      'Each page becomes a stack of question-and-answer cards, sorted by topic, ready in seconds.',
  },
  {
    index: '03',
    title: 'Study',
    description:
      'Swipe through your deck, flag the ones you missed, and Flashy resurfaces them until they stick.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-void">
      <Navbar />

      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-6 pt-[80px] pb-[100px] grid md:grid-cols-2 gap-[60px] items-center">
        <div>
          <h1 className="font-mono font-bold uppercase text-[32px] md:text-[42px] leading-[1.19] tracking-display text-ghost">
            NOTES IN.
            <br />
            <span className="text-kippo-pink text-glow">FLASHCARDS</span> OUT.
          </h1>
          <p className="mt-[30px] max-w-[420px] font-mono text-[16px] leading-[1.88] text-ghost/60">
            Snap a photo of your notes or import a file. Flashy turns it into a deck you can study
            anywhere — no typing required.
          </p>
          <div className="mt-[30px] flex flex-wrap items-center gap-[15px]">
            <Link to="/signup">
              <Button variant="primary">Start a deck</Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="ghost">See how it works</Button>
            </a>
          </div>
        </div>

        <PhoneMockup />
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-[1200px] px-6 pb-[100px]">
        <h2 className="font-mono font-bold uppercase text-[24px] md:text-[32px] tracking-display leading-[1.19] text-ghost">
          <span className="text-kippo-pink">THREE STEPS.</span> ZERO RE-TYPING.
        </h2>
        <div className="mt-[40px] flex flex-col md:flex-row gap-[15px]">
          {features.map((feature) => (
            <FeatureCard key={feature.index} {...feature} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-[1200px] px-6 pb-[100px]">
        <div className="grid md:grid-cols-2 gap-[60px] items-center">
          <div>
            <h2 className="font-mono font-bold uppercase text-[24px] md:text-[32px] tracking-display leading-[1.19] text-ghost">
              READS LIKE A <span className="text-kippo-pink">TERMINAL.</span>
            </h2>
            <p className="mt-[20px] max-w-[420px] font-mono text-[16px] leading-[1.88] text-ghost/60">
              Behind the camera icon is a simple pipeline: import a page, Flashy finds the terms
              and questions, and a deck lands in your library — every time.
            </p>
          </div>
          <TerminalSnippet />
        </div>
      </section>

      {/* CTA band */}
      <section className="border-t border-ash">
        <div className="mx-auto max-w-[1200px] px-6 py-[100px] text-center">
          <h2 className="font-mono font-bold uppercase text-[24px] md:text-[32px] tracking-display leading-[1.19] text-ghost">
            <span className="text-kippo-pink">STOP</span> REWRITING NOTES.
          </h2>
          <div className="mt-[30px] flex justify-center">
            <Link to="/signup">
              <Button variant="primary">Create your first deck</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
