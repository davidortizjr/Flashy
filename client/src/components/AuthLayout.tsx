import type { ReactNode } from 'react'
import Logo from './Logo'
import Card from './Card'

interface AuthLayoutProps {
  eyebrow: string
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export default function AuthLayout({ eyebrow, title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-void flex flex-col">
      <header className="px-6 h-[72px] flex items-center border-b border-ash">
        <Logo />
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-[60px]">
        <Card fill="carbon" className="w-full max-w-[400px]">
          <p className="font-mono text-[10px] font-bold uppercase tracking-label text-kippo-pink">
            {eyebrow}
          </p>
          <h1 className="mt-[10px] font-mono text-[24px] font-bold uppercase tracking-[0.15em] leading-[1.19] text-ghost">
            {title}
          </h1>
          <p className="mt-[10px] font-mono text-[12px] leading-[1.67] text-ghost/50">{subtitle}</p>

          <div className="mt-[30px] flex flex-col gap-[20px]">{children}</div>

          <div className="mt-[30px] pt-[20px] border-t border-ash text-center">{footer}</div>
        </Card>
      </main>
    </div>
  )
}
