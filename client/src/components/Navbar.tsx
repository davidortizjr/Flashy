import { Link } from 'react-router-dom'
import Logo from './Logo'
import Button from './Button'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
]

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-void/90 backdrop-blur border-b border-ash">
      <div className="mx-auto max-w-[1200px] px-6 h-[72px] flex items-center justify-between">
        <Logo />

        <nav className="hidden md:flex items-center gap-[30px]">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-mono text-[12px] font-bold uppercase tracking-label text-ghost border-b border-transparent hover:border-kippo-pink transition-colors duration-150 pb-[2px]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-[15px]">
          <Link to="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link to="/signup">
            <Button variant="primary">Sign up</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
