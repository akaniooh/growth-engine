import { Users, BarChart2, DollarSign, Activity } from 'lucide-react'
import { TokenData } from '@/lib/data'
import clsx from 'clsx'

interface MetricCardsProps {
  data: TokenData
}

export function MetricCards({ data }: MetricCardsProps) {
  const metrics = [
    {
      label: 'Total Holders',
      value: data.holders.toLocaleString(),
      change: data.holdersChange,
      up: data.holdersUp,
      icon: Users,
      suffix: '24h',
    },
    {
      label: '24h Volume',
      value: data.volume,
      change: data.volumeChange,
      up: data.volumeUp,
      icon: BarChart2,
      suffix: 'vs yesterday',
    },
    {
      label: 'Token Price',
      value: data.price,
      change: data.priceChange,
      up: data.priceUp,
      icon: DollarSign,
      suffix: '24h',
    },
    {
      label: 'Active Traders',
      value: data.activeTraders.toLocaleString(),
      change: data.activeTradersChange,
      up: data.activeTradersUp,
      icon: Activity,
      suffix: '24h',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      {metrics.map((m) => {
        const Icon = m.icon
        return (
          <div key={m.label} className="card p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="label text-[9px] sm:text-[10px]">{m.label}</span>
              <div className="flex h-6 w-6 items-center justify-center rounded border border-surface-border bg-surface-overlay">
                <Icon className="h-3 w-3 text-ink-tertiary" strokeWidth={1.5} />
              </div>
            </div>
            <div className="mb-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              {m.value}
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={clsx(
                  'text-[11px] font-mono font-medium',
                  m.up ? 'text-positive' : 'text-negative'
                )}
              >
                {m.change}
              </span>
              <span className="hidden text-[10px] font-mono text-ink-tertiary sm:inline">
                {m.suffix}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
