import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Logo from '../components/Logo'
import Button from '../components/Button'
import Card from '../components/Card'
import TextField from '../components/TextField'
import {
  deleteCard,
  deleteDeck,
  fetchDeck,
  renameDeck,
  updateCard,
  type Deck,
  type FlashyCard,
} from '../lib/api'

type LoadState = 'loading' | 'ready' | 'not-found' | 'error'

export default function DeckPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [state, setState] = useState<LoadState>('loading')
  const [deck, setDeck] = useState<Deck | null>(null)
  const [cards, setCards] = useState<FlashyCard[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [savingTitle, setSavingTitle] = useState(false)

  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [frontDraft, setFrontDraft] = useState('')
  const [backDraft, setBackDraft] = useState('')
  const [savingCard, setSavingCard] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchDeck(id)
      .then((data) => {
        setDeck(data.deck)
        setCards(data.cards)
        setIndex(0)
        setFlipped(false)
        setState('ready')
      })
      .catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : 'Could not load that deck.')
        setState(err?.status === 404 ? 'not-found' : 'error')
      })
  }, [id, reloadToken])

  const retry = () => {
    setState('loading')
    setReloadToken((n) => n + 1)
  }

  const goTo = (next: number) => {
    setFlipped(false)
    setIndex((next + cards.length) % cards.length)
  }

  const handleDeleteDeck = async () => {
    if (!id || !confirm('Delete this deck? This removes all its cards too.')) return
    await deleteDeck(id)
    navigate('/dashboard', { replace: true })
  }

  const startEditTitle = () => {
    setTitleDraft(deck?.title ?? '')
    setEditingTitle(true)
  }

  const saveTitle = async () => {
    if (!id || !titleDraft.trim()) return
    setSavingTitle(true)
    try {
      const { deck: updated } = await renameDeck(id, titleDraft.trim())
      setDeck((d) => (d ? { ...d, title: updated.title } : d))
      setEditingTitle(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not rename this deck.')
    } finally {
      setSavingTitle(false)
    }
  }

  const startEditCard = (card: FlashyCard) => {
    setEditingCardId(card.id)
    setFrontDraft(card.front)
    setBackDraft(card.back)
  }

  const saveCard = async () => {
    if (!id || !editingCardId) return
    if (!frontDraft.trim() || !backDraft.trim()) return
    setSavingCard(true)
    try {
      const { card: updated } = await updateCard(id, editingCardId, {
        front: frontDraft.trim(),
        back: backDraft.trim(),
      })
      setCards((cs) => cs.map((c) => (c.id === updated.id ? updated : c)))
      setEditingCardId(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not save that card.')
    } finally {
      setSavingCard(false)
    }
  }

  const removeCard = async (cardId: string) => {
    if (!id || !confirm('Delete this card?')) return
    try {
      await deleteCard(id, cardId)
      setCards((cs) => {
        const next = cs.filter((c) => c.id !== cardId)
        setIndex((i) => Math.min(i, Math.max(0, next.length - 1)))
        return next
      })
      setFlipped(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete that card.')
    }
  }

  return (
    <div className="min-h-screen bg-void">
      <header className="px-6 h-[72px] flex items-center justify-between border-b border-ash">
        <Logo />
        <Link
          to="/dashboard"
          className="font-mono text-[12px] uppercase tracking-label text-ghost/50 hover:text-kippo-pink"
        >
          &larr; Dashboard
        </Link>
      </header>

      <main className="mx-auto max-w-[700px] px-6 py-[60px]">
        {state === 'loading' && (
          <div className="flex flex-col items-center gap-[15px] py-[80px]">
            <div className="w-[28px] h-[28px] border-2 border-ash border-t-kippo-pink rounded-full animate-spin" />
            <span className="font-mono text-[11px] uppercase tracking-label text-ghost/40">
              Loading deck&hellip;
            </span>
          </div>
        )}

        {state === 'not-found' && (
          <Card fill="carbon" className="text-center py-[50px]">
            <p className="font-mono text-[14px] text-ghost/70">
              This deck doesn't exist, or isn't yours.
            </p>
            <Button variant="primary" className="mt-[20px]" onClick={() => navigate('/dashboard')}>
              Back to dashboard
            </Button>
          </Card>
        )}

        {state === 'error' && (
          <Card fill="carbon" className="text-center py-[50px]">
            <p className="font-mono text-[14px] text-kippo-pink">{errorMessage}</p>
            <Button variant="primary" className="mt-[20px]" onClick={retry}>
              Try again
            </Button>
          </Card>
        )}

        {state === 'ready' && deck && (
          <>
            <p className="font-mono text-[10px] font-bold uppercase tracking-label text-kippo-pink">
              &gt;&gt; DECK
            </p>

            <div className="mt-[10px] flex items-start justify-between gap-[15px]">
              {editingTitle ? (
                <div className="flex-1 flex items-center gap-[10px]">
                  <input
                    autoFocus
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                    className="flex-1 bg-transparent border border-ash focus:border-ghost rounded-button px-[12px] py-[8px] font-mono text-[20px] font-bold uppercase text-ghost outline-none"
                  />
                  <Button variant="primary" onClick={saveTitle} disabled={savingTitle}>
                    Save
                  </Button>
                  <Button variant="ghost" onClick={() => setEditingTitle(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <h1
                  onClick={startEditTitle}
                  title="Click to rename"
                  className="font-mono text-[24px] md:text-[32px] font-bold uppercase tracking-display leading-[1.19] text-ghost cursor-text hover:text-kippo-pink transition-colors"
                >
                  {deck.title}
                </h1>
              )}
              <button
                onClick={handleDeleteDeck}
                className="shrink-0 font-mono text-[10px] uppercase tracking-label text-ghost/40 hover:text-kippo-pink"
              >
                Delete deck
              </button>
            </div>

            {cards.length === 0 ? (
              <Card fill="carbon" className="mt-[30px] text-center py-[50px]">
                <p className="font-mono text-[13px] text-ghost/60">
                  This deck has no cards left.
                </p>
                <Link to="/import">
                  <Button variant="primary" className="mt-[20px]">
                    Import more notes
                  </Button>
                </Link>
              </Card>
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

                <div className="mt-[10px] flex justify-center gap-[15px]">
                  <button
                    onClick={() => startEditCard(cards[index])}
                    className="font-mono text-[10px] uppercase tracking-label text-ghost/40 hover:text-kippo-pink"
                  >
                    Edit card
                  </button>
                  <button
                    onClick={() => removeCard(cards[index].id)}
                    className="font-mono text-[10px] uppercase tracking-label text-ghost/40 hover:text-kippo-pink"
                  >
                    Delete card
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {editingCardId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 px-6">
          <Card fill="carbon" className="w-full max-w-[420px]">
            <p className="font-mono text-[10px] font-bold uppercase tracking-label text-kippo-pink">
              &gt;&gt; EDIT CARD
            </p>
            <div className="mt-[20px] flex flex-col gap-[15px]">
              <TextField
                label="Front"
                value={frontDraft}
                onChange={(e) => setFrontDraft(e.target.value)}
              />
              <TextField label="Back" value={backDraft} onChange={(e) => setBackDraft(e.target.value)} />
            </div>
            <div className="mt-[20px] flex gap-[10px]">
              <Button variant="primary" className="flex-1" onClick={saveCard} disabled={savingCard}>
                {savingCard ? 'Saving…' : 'Save'}
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => setEditingCardId(null)}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
