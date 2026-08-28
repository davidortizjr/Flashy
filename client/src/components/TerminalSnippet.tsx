interface Line {
  text: string
  tone?: 'prompt' | 'output' | 'success'
}

const lines: Line[] = [
  { text: '$ flashy import notes/biology-ch4.jpg', tone: 'prompt' },
  { text: '> reading page ................. done', tone: 'output' },
  { text: '> found 3 topics, 18 terms', tone: 'output' },
  { text: '> building deck ................ done', tone: 'success' },
  { text: '$ flashy study biology-ch4', tone: 'prompt' },
  { text: '> 18 cards ready. good luck.', tone: 'success' },
]

export default function TerminalSnippet() {
  return (
    <div className="border border-ghost rounded-card bg-carbon overflow-hidden">
      <div className="flex items-center gap-[8px] border-b border-ash px-[18px] py-[12px]">
        <span className="w-[10px] h-[10px] rounded-full border border-ghost/40" />
        <span className="w-[10px] h-[10px] rounded-full border border-ghost/40" />
        <span className="w-[10px] h-[10px] rounded-full border border-ghost/40" />
        <span className="ml-[10px] font-mono text-[10px] uppercase tracking-label text-ghost/40">
          deck-builder
        </span>
      </div>
      <div className="px-[24px] py-[24px] flex flex-col gap-[10px]">
        {lines.map((line, i) => (
          <p
            key={i}
            className={`font-mono text-[12px] md:text-[14px] leading-[1.6] ${
              line.tone === 'prompt'
                ? 'text-ghost'
                : line.tone === 'success'
                  ? 'text-kippo-pink'
                  : 'text-ghost/50'
            }`}
          >
            {line.text}
          </p>
        ))}
      </div>
    </div>
  )
}
