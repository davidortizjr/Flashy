import { useEffect, useState } from 'react'
import Logo from '../components/Logo'
import Button from '../components/Button'
import Card from '../components/Card'
import { useAuth } from '../context/useAuth'
import { Link, useNavigate } from 'react-router-dom'
import { listDecks, type Deck } from '../lib/api'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [decks, setDecks] = useState<Deck[]>([])

  useEffect(() => {
    listDecks()
      .then((data) => setDecks(data.decks))
      .catch(() => setDecks([]))
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-void">
      <header className="px-6 h-[72px] flex items-center justify-between border-b border-ash">
        <Logo />
        <div className="flex items-center gap-[15px]">
          <span className="hidden sm:inline font-mono text-[12px] uppercase tracking-label text-ghost/50">
            {user?.name}
          </span>
          <Button variant="ghost" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 py-[60px]">
        <p className="font-mono text-[10px] font-bold uppercase tracking-label text-kippo-pink">
          &gt;&gt; DASHBOARD
        </p>
        <h1 className="mt-[10px] font-mono text-[24px] md:text-[32px] font-bold uppercase tracking-display leading-[1.19] text-ghost">
          WELCOME BACK, <span className="text-kippo-pink">{user?.name?.split(' ')[0]}</span>.
        </h1>

        <div className="mt-[60px] grid md:grid-cols-2 gap-[15px]">
          <Card className="flex flex-col items-start">
            <span className="font-mono text-[10px] font-bold text-kippo-pink tracking-label">
              GET STARTED
            </span>
            <h2 className="mt-[15px] font-mono text-[16px] font-bold uppercase tracking-label text-ghost">
              Import your first notes
            </h2>
            <p className="mt-[10px] font-mono text-[12px] leading-[1.67] text-ghost/60">
              Snap a photo or upload a file to generate your first deck.
            </p>
            <Button variant="primary" className="mt-[20px]" onClick={() => navigate('/import')}>
              Import notes
            </Button>
          </Card>

          <Card fill="carbon" className="flex flex-col items-start">
            <span className="font-mono text-[10px] font-bold uppercase tracking-label text-ghost/40">
              MY DECKS
            </span>
            {decks.length === 0 ? (
              <p className="mt-[15px] font-mono text-[12px] leading-[1.67] text-ghost/50">
                No decks yet. Once notes are imported, they'll show up here.
              </p>
            ) : (
              <div className="mt-[15px] w-full flex flex-col gap-[10px]">
                {decks.map((deck) => (
                  <Link
                    key={deck.id}
                    to={`/decks/${deck.id}`}
                    className="flex items-center justify-between border border-ash rounded-button px-[15px] py-[10px] hover:border-kippo-pink transition-colors duration-150"
                  >
                    <span className="font-mono text-[12px] text-ghost">{deck.title}</span>
                    <span className="font-mono text-[10px] uppercase tracking-label text-ghost/40">
                      {deck.cardCount} card{deck.cardCount === 1 ? '' : 's'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
