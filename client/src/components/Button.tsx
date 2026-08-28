import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const base =
  'inline-flex items-center justify-center whitespace-nowrap px-[15px] py-[10px] rounded-button font-mono text-[12px] font-bold uppercase tracking-label transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed'

const variants: Record<Variant, string> = {
  primary: 'bg-kippo-pink text-ghost hover:bg-[#ff3d7d] active:bg-[#c9184f]',
  ghost: 'bg-transparent text-ghost border border-ghost hover:border-kippo-pink hover:text-kippo-pink',
}

export default function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
