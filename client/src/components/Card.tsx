import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  fill?: 'void' | 'carbon'
  children: ReactNode
}

export default function Card({ fill = 'void', className = '', children, ...props }: CardProps) {
  const bg = fill === 'carbon' ? 'bg-carbon' : 'bg-void'
  return (
    <div className={`${bg} border border-ghost rounded-card p-[30px] ${className}`} {...props}>
      {children}
    </div>
  )
}
