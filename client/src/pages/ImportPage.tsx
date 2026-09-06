import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import Button from '../components/Button'
import Card from '../components/Card'
import { importDeck, renameDeck, ApiError, type FlashyCard, type Deck } from '../lib/api'
import { compressImages } from '../lib/imageCompression'

const LOW_CARD_WARNING_THRESHOLD = 3
const MAX_FILES = 8

interface PickedFile {
  file: File
  previewUrl: string | null
}

export default function ImportPage() {
  const navigate = useNavigate()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<PickedFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quotaExceeded, setQuotaExceeded] = useState(false)
  const [result, setResult] = useState<
    { deck: Deck; cards: FlashyCard[]; requestedCount: number; truncated: boolean } | null
  >(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [savingTitle, setSavingTitle] = useState(false)

  const nonImageCount = files.filter((f) => !f.file.type.startsWith('image/')).length
  const mixedTypeError =
    files.length > 1 && nonImageCount > 0
      ? 'Multiple files must all be photos — import a PDF or text file on its own.'
      : null

  const addFiles = (picked: File[]) => {
    setError(null)
    setQuotaExceeded(false)
    setResult(null)
    setFiles((current) => {
      const combined = [...current, ...picked.map((file) => ({ file, previewUrl: null as string | null }))]
      const trimmed = combined.slice(0, MAX_FILES)
      return trimmed.map((f) => ({
        ...f,
        previewUrl: f.previewUrl ?? (f.file.type.startsWith('image/') ? URL.createObjectURL(f.file) : null),
      }))
    })
  }

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    if (picked.length) addFiles(picked)
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setFiles((current) => {
      const removed = current[index]
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl)
      return current.filter((_, i) => i !== index)
    })
  }

  const clearFiles = () => {
    setFiles((current) => {
      current.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl))
      return []
    })
  }

  const handleSubmit = async () => {
    if (files.length === 0 || mixedTypeError) return
    setError(null)
    setQuotaExceeded(false)
    setIsSubmitting(true)
    try {
      const rawFiles = files.map((f) => f.file)
      const uploadFiles = rawFiles.every((f) => f.type.startsWith('image/'))
        ? await compressImages(rawFiles)
        : rawFiles
      const data = await importDeck(uploadFiles)
      setResult(data)
      clearFiles()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'quota_exceeded') {
        setError(err.message)
        setQuotaExceeded(true)
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEditTitle = () => {
    if (!result) return
    setTitleDraft(result.deck.title)
    setEditingTitle(true)
  }

  const saveTitle = async () => {
    if (!result || !titleDraft.trim()) return
    setSavingTitle(true)
    try {
      const { deck: updated } = await renameDeck(result.deck.id, titleDraft.trim())
      setResult((r) => (r ? { ...r, deck: { ...r.deck, title: updated.title } } : r))
      setEditingTitle(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not rename this deck.')
    } finally {
      setSavingTitle(false)
    }
  }

  const reset = () => {
    clearFiles()
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

              {editingTitle ? (
                <div className="mt-[10px] flex items-center gap-[10px]">
                  <input
                    autoFocus
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                    className="flex-1 bg-transparent border border-ash focus:border-ghost rounded-button px-[12px] py-[8px] font-mono text-[14px] font-bold uppercase text-ghost outline-none"
                  />
                  <Button variant="primary" onClick={saveTitle} disabled={savingTitle}>
                    Save
                  </Button>
                  <Button variant="ghost" onClick={() => setEditingTitle(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <h2
                  onClick={startEditTitle}
                  title="Click to rename"
                  className="mt-[10px] font-mono text-[16px] font-bold uppercase tracking-label text-ghost cursor-text hover:text-kippo-pink transition-colors"
                >
                  {result.deck.title}
                </h2>
              )}

              <p className="mt-[10px] font-mono text-[12px] text-ghost/60">
                {result.cards.length} card{result.cards.length === 1 ? '' : 's'} generated.
              </p>

              {result.truncated && (
                <p className="mt-[10px] font-mono text-[12px] text-kippo-pink">
                  Flashy found {result.requestedCount} cards but could only save{' '}
                  {result.cards.length} — you're out of room on your current plan.
                </p>
              )}

              {!result.truncated && result.cards.length < LOW_CARD_WARNING_THRESHOLD && (
                <p className="mt-[10px] font-mono text-[12px] text-ghost/50">
                  Flashy only found {result.cards.length} card{result.cards.length === 1 ? '' : 's'} worth
                  making — a clearer file with more study material usually finds more.
                </p>
              )}

              <div className="mt-[20px] flex gap-[10px]">
                <Button variant="primary" onClick={() => navigate(`/decks/${result.deck.id}`)}>
                  View deck
                </Button>
                <Button variant="ghost" onClick={reset}>
                  Import another
                </Button>
                {result.truncated && (
                  <Link to="/pricing">
                    <Button variant="ghost">View pricing</Button>
                  </Link>
                )}
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
              Snap one or more photos of your notes, or upload a PDF or text file. Photos can be
              added one at a time or several at once — Flashy reads them as one set of notes.
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
              accept="image/*,.pdf,application/pdf,.txt,text/plain"
              multiple
              className="hidden"
              onChange={handlePick}
            />

            <div className="mt-[20px] flex flex-wrap gap-[10px]">
              <Button
                variant="primary"
                onClick={() => cameraInputRef.current?.click()}
                disabled={files.length >= MAX_FILES}
              >
                Take a photo
              </Button>
              <Button
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={files.length >= MAX_FILES}
              >
                Upload files
              </Button>
            </div>

            {files.length > 0 && (
              <div className="mt-[25px] w-full">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-label text-ghost/40">
                    Selected ({files.length}/{MAX_FILES})
                  </span>
                  <button
                    onClick={clearFiles}
                    className="font-mono text-[10px] uppercase tracking-label text-ghost/40 hover:text-kippo-pink"
                  >
                    Clear all
                  </button>
                </div>

                <div className="mt-[10px] grid grid-cols-3 sm:grid-cols-4 gap-[10px]">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="relative aspect-square border border-ash rounded-button overflow-hidden bg-carbon"
                    >
                      {f.previewUrl ? (
                        <img src={f.previewUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center px-[6px]">
                          <span className="font-mono text-[9px] text-ghost/60 text-center break-all">
                            {f.file.name}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(i)}
                        className="absolute top-[4px] right-[4px] w-[20px] h-[20px] rounded-full bg-void/80 border border-ghost/40 text-ghost text-[12px] leading-none flex items-center justify-center hover:border-kippo-pink hover:text-kippo-pink"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>

                {mixedTypeError && (
                  <p className="mt-[10px] font-mono text-[12px] text-kippo-pink">{mixedTypeError}</p>
                )}

                <Button
                  variant="primary"
                  className="mt-[20px] w-full"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !!mixedTypeError}
                >
                  {isSubmitting ? 'Reading your notes…' : 'Generate flashcards'}
                </Button>
              </div>
            )}

            {error && (
              <div className="mt-[15px] flex flex-col items-start gap-[10px]">
                <p role="alert" className="font-mono text-[12px] text-kippo-pink">
                  {error}
                </p>
                {quotaExceeded && (
                  <Link to="/pricing">
                    <Button variant="ghost">View pricing</Button>
                  </Link>
                )}
              </div>
            )}
          </Card>
        )}
      </main>
    </div>
  )
}
