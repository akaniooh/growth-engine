'use client'

import { TrendingUp, TrendingDown, Users, Activity, DollarSign, Droplets } from 'lucide-react'
import clsx from 'clsx'

interface TokenStatsProps {
  holders:    number
  price:      string
  priceUp:    boolean
  priceChange: string
  volume:     string
  volumeUp:   boolean
  volumeChange: string
  marketCap:  number
  liquidity?: number
  symbol:     string
}

function fmtMC(n: number): string {
  if (!n || n === 0) return '—'
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export function HolderBreakdown({ holders, price, priceUp, priceChange, volume, volumeUp, volumeChange, marketCap, symbol }: TokenStatsProps) {
  const stats = [
    {
      label: 'Token Price',
      value: price,
      change: priceChange,
      up: priceUp,
      icon: DollarSign,
      show: price !== '$0.00',
    },
    {
      label: '24h Volume',
      value: volume,
      change: volumeChange,
      up: volumeUp,
      icon: Activity,
      show: volume !== '$0.00',
    },
    {
      label: 'Market Cap',
      value: fmtMC(marketCap),
      change: null,
      up: true,
      icon: TrendingUp,
      show: marketCap > 0,
    },
    {
      label: 'Total Holders',
      value: holders > 0 ? holders.toLocaleString() : '—',
      change: null,
      up: true,
      icon: Users,
      show: true,
    },
  ]

  return (
    <div className="card flex flex-col">
      <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
        <span className="label">Token Stats</span>
        <span className="font-mono text-[10px] text-ink-tertiary">${symbol}</span>
      </div>

      <div className="flex flex-1 flex-col divide-y divide-surface-border">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-surface-border bg-surface-overlay">
                  <Icon className="h-3.5 w-3.5 text-ink-tertiary" strokeWidth={1.5} />
                </div>
                <span className="text-xs text-ink-secondary">{s.label}</span>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-semibold text-ink">
                  {s.show ? s.value : '—'}
                </div>
                {s.change && s.show && (
                  <div className={clsx(
                    'flex items-center justify-end gap-0.5 font-mono text-[10px]',
                    s.up ? 'text-positive' : 'text-negative'
                  )}>
                    {s.up
                      ? <TrendingUp className="h-2.5 w-2.5" strokeWidth={2} />
                      : <TrendingDown className="h-2.5 w-2.5" strokeWidth={2} />
                    }
                    {s.change}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-1.5 border-t border-surface-border px-5 py-3">
        <div className="h-1.5 w-1.5 rounded-full bg-positive animate-pulse" />
        <span className="font-mono text-[10px] text-ink-tertiary">Live via Birdeye</span>
      </div>
    </div>
  )
}
