import { TrendingUp, Layers, Zap } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-4 text-center sm:min-h-[480px]">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-surface-border bg-surface-raised sm:mb-8 sm:h-14 sm:w-14">
        <TrendingUp className="h-5 w-5 text-ink-tertiary sm:h-6 sm:w-6" strokeWidth={1.5} />
      </div>

      <h1 className="mb-2 text-lg font-semibold tracking-tight text-ink sm:text-xl">
        Creator Growth Engine
      </h1>
      <p className="mb-8 max-w-sm text-sm leading-relaxed text-ink-secondary sm:mb-12 sm:max-w-md">
        Enter a Solana token address or symbol to analyse your holder base,
        classify wallet segments, and get AI-powered growth actions.
      </p>

      <div className="grid w-full max-w-sm gap-3 text-left sm:max-w-lg sm:grid-cols-3">
        {[
          {
            icon: Layers,
            title: 'Wallet clustering',
            desc: 'Whales, active traders, new buyers, dormant holders',
          },
          {
            icon: TrendingUp,
            title: 'Growth signals',
            desc: 'Volume trends, timing patterns, retention risks',
          },
          {
            icon: Zap,
            title: 'Actionable output',
            desc: 'Campaigns, post timing, and content ideas',
          },
        ].map((f) => {
          const Icon = f.icon
          return (
            <div key={f.title} className="card-sm p-4">
              <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-md border border-surface-border bg-surface-overlay">
                <Icon className="h-3.5 w-3.5 text-ink-tertiary" strokeWidth={1.5} />
              </div>
              <div className="mb-1 text-xs font-semibold text-ink">{f.title}</div>
              <div className="text-[11px] leading-relaxed text-ink-tertiary">{f.desc}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
