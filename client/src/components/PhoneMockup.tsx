const deck = [
  { subject: 'BIO — CH.4', rotate: '-rotate-6', offset: 'translate-y-[18px]' },
  { subject: 'CALC — LIMITS', rotate: 'rotate-2', offset: 'translate-y-[9px]' },
  { subject: 'HISTORY — WWI', rotate: 'rotate-0', offset: 'translate-y-0' },
]

export default function PhoneMockup() {
  return (
    <div className="relative flex items-center justify-center py-[60px]">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 rounded-card bg-sunset-gradient opacity-90 blur-[2px]"
      />

      <div className="relative w-[260px] h-[540px] rounded-[40px] border border-ghost bg-void p-[10px] shadow-none">
        <div className="w-full h-full rounded-[30px] border border-ash bg-void overflow-hidden flex flex-col">
          {/* status bar */}
          <div className="flex items-center justify-between px-[18px] pt-[14px] pb-[6px]">
            <span className="font-mono text-[10px] font-bold text-ghost">9:41</span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-label text-kippo-pink">
              Flashy
            </span>
          </div>

          {/* header */}
          <div className="px-[18px] pt-[10px]">
            <p className="font-mono text-[10px] uppercase tracking-label text-ghost/50">My decks</p>
            <div className="flex items-baseline gap-[8px] mt-[4px]">
              <span className="font-mono text-[16px] font-bold text-ghost">18 new</span>
              <span className="font-mono text-[10px] text-kippo-pink uppercase tracking-label">
                ready
              </span>
            </div>
          </div>

          {/* card stack */}
          <div className="relative flex-1 px-[24px] pt-[28px]">
            {deck.map((card) => (
              <div
                key={card.subject}
                className={`absolute left-[24px] right-[24px] ${card.offset} ${card.rotate} border border-ghost bg-carbon rounded-card px-[14px] py-[16px]`}
              >
                <p className="font-mono text-[10px] font-bold uppercase tracking-label text-ghost/60">
                  {card.subject}
                </p>
                <div className="mt-[10px] h-[6px] w-3/4 rounded-full bg-ghost/15" />
                <div className="mt-[6px] h-[6px] w-1/2 rounded-full bg-ghost/15" />
              </div>
            ))}
          </div>

          {/* tab bar */}
          <div className="flex items-center justify-around border-t border-ash px-[18px] py-[14px]">
            <div className="w-[32px] h-[32px] rounded-icon border border-ghost/30" />
            <div className="w-[36px] h-[36px] rounded-icon bg-kippo-pink flex items-center justify-center">
              <div className="w-[14px] h-[10px] rounded-[2px] border border-ghost" />
            </div>
            <div className="w-[32px] h-[32px] rounded-icon border border-ghost/30" />
          </div>
        </div>
      </div>
    </div>
  )
}
