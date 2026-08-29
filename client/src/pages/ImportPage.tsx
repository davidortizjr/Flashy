import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import Button from '../components/Button'
import Card from '../components/Card'
import { importDeck, type FlashyCard, type Deck } from '../lib/api'

export default function ImportPage() {
  const navigate = useNavigate()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ deck: Deck; cards: FlashyCard[] } | null>(null)

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null
    setError(null)
    setResult(null)
    setFile(picked)
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old)
      return picked && picked.type.startsWith('image/') ? URL.createObjectURL(picked) : null
    })
    e.target.value = ''
  }

  const handleSubmit = async () => {
    if (!file) return
    setError(null)
    setIsSubmitting(true)
    try {
      const data = await importDeck(file)
      setResult(data)
      setFile(null)
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old)
        return null
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old)
      return null
    })
    setResult(null)
    setError(null)
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
        <p className="font-mono text-[10px] font-bold uppercase tracking-label text-kippo-pink">
          &gt;&gt; IMPORT
        </p>
        <h1 className="mt-[10px] font-mono text-[24px] md:text-[32px] font-bold uppercase tracking-display leading-[1.19] text-ghost">
          NOTES IN, <span className="text-kippo-pink">FLASHCARDS</span> OUT.
        </h1>

        {result ? (
          <div className="mt-[40px] flex flex-col gap-[15px]">
            <Card>
              <span className="font-mono text-[10px] font-bold text-kippo-pink tracking-label">
                DECK CREATED
              </span>
              <h2 className="mt-[10px] font-mono text-[16px] font-bold uppercase tracking-label text-ghost">
                {result.deck.title}
              </h2>
              <p className="mt-[10px] font-mono text-[12px] text-ghost/60">
                {result.cards.length} card{result.cards.length === 1 ? '' : 's'} generated.
              </p>
              <div className="mt-[20px] flex gap-[10px]">
                <Button variant="primary" onClick={() => navigate(`/decks/${result.deck.id}`)}>
                  View deck
                </Button>
                <Button variant="ghost" onClick={reset}>
                  Import another
                </Button>
              </div>
            </Card>

            <div className="flex flex-col gap-[10px]">
              {result.cards.map((card) => (
                <Card key={card.id} fill="carbon">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-label text-ghost/40">
                    Front
                  </p>
                  <p className="mt-[6px] font-mono text-[14px] text-ghost">{card.front}</p>
                  <p className="mt-[15px] font-mono text-[10px] font-bold uppercase tracking-label text-ghost/40">
                    Back
                  </p>
                  <p className="mt-[6px] font-mono text-[14px] text-ghost/70">{card.back}</p>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card className="mt-[40px] flex flex-col items-start">
            <span className="font-mono text-[10px] font-bold text-kippo-pink tracking-label">
              GET STARTED
            </span>
            <p className="mt-[10px] font-mono text-[12px] leading-[1.67] text-ghost/60">
              Snap a photo of a notebook page, textbook, or slide, or upload a text file. Flashy
              reads it and builds a deck of flashcards.
            </p>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePick}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.txt,text/plain"
              className="hidden"
              onChange={handlePick}
            />

            <div className="mt-[20px] flex flex-wrap gap-[10px]">
              <Button variant="primary" onClick={() => cameraInputRef.current?.click()}>
                Take a photo
              </Button>
              <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
                Upload a file
              </Button>
            </div>

            {file && (
              <div className="mt-[25px] w-full">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-label text-ghost/40">
                    Selected
                  </span>
                  <button
                    onClick={reset}
                    className="font-mono text-[10px] uppercase tracking-label text-ghost/40 hover:text-kippo-pink"
                  >
                    Clear
                  </button>
                </div>

                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Selected notes"
                    className="mt-[10px] w-full max-h-[320px] object-contain rounded-button border border-ash"
                  />
                ) : (
                  <p className="mt-[10px] font-mono text-[12px] text-ghost/70">{file.name}</p>
                )}

                <Button
                  variant="primary"
                  className="mt-[20px] w-full"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Reading your notes…' : 'Generate flashcards'}
                </Button>
              </div>
            )}

            {error && (
              <p role="alert" className="mt-[15px] font-mono text-[12px] text-kippo-pink">
                {error}
              </p>
            )}
          </Card>
        )}
      </main>
    </div>
  )
}
