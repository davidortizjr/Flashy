import { Link } from 'react-router-dom'

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link
      to="/"
      className={`font-mono font-bold uppercase tracking-[0.15em] text-[16px] text-ghost ${className}`}
    >
      FLASH<span className="text-kippo-pink">Y</span>
    </Link>
  )
}
