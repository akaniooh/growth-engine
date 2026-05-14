import { Insight } from '@/lib/data'
import { AlertTriangle, TrendingUp, Info } from 'lucide-react'
import { MemoryContextBanner } from './MemoryContextBanner'
import clsx from 'clsx'

interface InsightsProps {
  insights: (Insight & { memoryContext?: string })[]
}

const SENTIMENT_CONFIG = {
  positive: { icon: TrendingUp,    iconClass: 'text-positive', tagClass: 'text-positive', valClass: 'text-positive' },
  negative: { icon: AlertTriangle, iconClass: 'text-negative', tagClass: 'text-negative', valClass: 'text-negative' },
  warning:  { icon: AlertTriangle, iconClass: 'text-warn',     tagClass: 'text-warn',     valClass: 'text-warn'     },
  neutral:  { icon: Info,          iconClass: 'text-ink-tertiary', tagClass: 'text-ink-secondary', valClass: 'text-ink' },
}

export function AIInsights({ insights }: InsightsProps) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-ink">AI Insights</h2>
        <p className="mt-0.5 text-xs text-ink-secondary">
          Generated from on-chain wallet patterns and volume data
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {insights.map((ins, i) => {
          const cfg = SENTIMENT_CONFIG[ins.sentiment]
          const Icon = cfg.icon
          return (
            <div key={i} className="card p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <Icon className={clsx('h-3.5 w-3.5 flex-shrink-0', cfg.iconClass)} strokeWidth={1.5} />
                <span className={clsx('text-[10px] font-mono uppercase tracking-wider', cfg.tagClass)}>
                  {ins.tag}
                </span>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-ink-secondary">{ins.text}</p>
              {ins.memoryContext && (
                <MemoryContextBanner context={ins.memoryContext} />
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-surface-border pt-3 mt-3">
                <span className="font-mono text-[10px] text-ink-tertiary">{ins.metric}</span>
                <span className={clsx('font-mono text-[11px] font-medium', cfg.valClass)}>{ins.val}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
