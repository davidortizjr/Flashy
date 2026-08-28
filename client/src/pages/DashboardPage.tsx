import Logo from '../components/Logo'
import Button from '../components/Button'
import Card from '../components/Card'
import { useAuth } from '../context/useAuth'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
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
              Snap a photo or upload a file to generate your first deck. Import isn't wired up
              yet — this is the frontend shell, ready for the backend to plug into.
            </p>
            <Button variant="primary" className="mt-[20px]" disabled>
              Import notes
            </Button>
          </Card>

          <Card fill="carbon" className="flex flex-col items-start justify-center">
            <span className="font-mono text-[10px] font-bold uppercase tracking-label text-ghost/40">
              MY DECKS
            </span>
            <p className="mt-[15px] font-mono text-[12px] leading-[1.67] text-ghost/50">
              No decks yet. Once notes are imported, they'll show up here.
            </p>
          </Card>
        </div>
      </main>
    </div>
  )
}
