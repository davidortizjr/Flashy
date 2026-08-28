import Logo from './Logo'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-ash">
      <div className="mx-auto max-w-[1200px] px-6 py-[40px] flex flex-col md:flex-row items-center justify-between gap-[20px]">
        <Logo />
        <nav className="flex items-center gap-[30px]">
          <a
            href="#features"
            className="font-mono text-[10px] uppercase tracking-label text-ghost/50 hover:text-ghost"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="font-mono text-[10px] uppercase tracking-label text-ghost/50 hover:text-ghost"
          >
            How it works
          </a>
          <Link
            to="/login"
            className="font-mono text-[10px] uppercase tracking-label text-ghost/50 hover:text-ghost"
          >
            Log in
          </Link>
        </nav>
        <p className="font-mono text-[10px] text-ghost/30">
          &copy; {new Date().getFullYear()} Flashy. Built for students who'd rather study than
          transcribe.
        </p>
      </div>
    </footer>
  )
}
