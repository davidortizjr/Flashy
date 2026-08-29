import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Logo from '../components/Logo'
import Button from '../components/Button'
import Card from '../components/Card'
import { deleteDeck, fetchDeck, type Deck, type FlashyCard } from '../lib/api'

export default function DeckPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [deck, setDeck] = useState<Deck | null>(null)
  const [cards, setCards] = useState<FlashyCard[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetchDeck(id)
      .then((data) => {
        setDeck(data.deck)
        setCards(data.cards)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load that deck.'))
  }, [id])

  const goTo = (next: number) => {
    setFlipped(false)
    setIndex((next + cards.length) % cards.length)
  }

  const handleDelete = async () => {
    if (!id || !confirm('Delete this deck?')) return
    await deleteDeck(id)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-void">
      <header className="px-6 h-[72px] flex items-center justify-between border-b border-ash">
        <Logo />
        <Link to="/dashboard" className="font-mono text-[12px] uppercase tracking-label text-ghost/50 hover:text-kippo-pink">
          &larr; Dashboard
        </Link>
      </header>

      <main className="mx-auto max-w-[700px] px-6 py-[60px]">
        {error && (
          <p role="alert" className="font-mono text-[12px] text-kippo-pink">
            {error}
          </p>
        )}

        {deck && (
          <>
            <p className="font-mono text-[10px] font-bold uppercase tracking-label text-kippo-pink">
              &gt;&gt; DECK
            </p>
            <div className="mt-[10px] flex items-center justify-between">
              <h1 className="font-mono text-[24px] md:text-[32px] font-bold uppercase tracking-display leading-[1.19] text-ghost">
                {deck.title}
              </h1>
              <button
                onClick={handleDelete}
                className="font-mono text-[10px] uppercase tracking-label text-ghost/40 hover:text-kippo-pink"
              >
                Delete
              </button>
            </div>

            {cards.length === 0 ? (
              <p className="mt-[20px] font-mono text-[12px] text-ghost/60">This deck has no cards.</p>
            ) : (
              <div className="mt-[40px]">
                <p className="font-mono text-[10px] uppercase tracking-label text-ghost/40">
                  Card {index + 1} / {cards.length}
                </p>

                <Card
                  fill="carbon"
                  className="mt-[10px] min-h-[220px] flex items-center justify-center text-center cursor-pointer select-none"
                  onClick={() => setFlipped((f) => !f)}
                >
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-label text-ghost/40">
                      {flipped ? 'Back' : 'Front'}
                    </p>
                    <p className="mt-[15px] font-mono text-[18px] text-ghost">
                      {flipped ? cards[index].back : cards[index].front}
                    </p>
                    <p className="mt-[20px] font-mono text-[10px] uppercase tracking-label text-ghost/30">
                      Tap to flip
                    </p>
                  </div>
                </Card>

                <div className="mt-[20px] flex gap-[10px]">
                  <Button variant="ghost" className="flex-1" onClick={() => goTo(index - 1)}>
                    Prev
                  </Button>
                  <Button variant="primary" className="flex-1" onClick={() => goTo(index + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
