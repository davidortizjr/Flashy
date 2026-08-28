import Card from './Card'

interface FeatureCardProps {
  index: string
  title: string
  description: string
}

export default function FeatureCard({ index, title, description }: FeatureCardProps) {
  return (
    <Card className="flex-1 min-w-[240px]">
      <span className="font-mono text-[10px] font-bold text-kippo-pink tracking-label">
        {index}
      </span>
      <h3 className="mt-[15px] font-mono text-[16px] font-bold uppercase tracking-label text-ghost">
        {title}
      </h3>
      <p className="mt-[10px] font-mono text-[12px] leading-[1.67] text-ghost/60">
        {description}
      </p>
    </Card>
  )
}
