'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { TokenData } from '@/lib/data'
import { MetricCards } from './MetricCards'
import { MarketCapChart } from './MarketCapChart'
import { WalletTable } from './WalletTable'
import { ActivityHeatmap } from './ActivityHeatmap'
import { AIInsights } from './AIInsights'
import { ActionEngine } from './ActionEngine'
import { ContentGenerator } from './ContentGenerator'
import { RefreshCw } from 'lucide-react'
import clsx from 'clsx'

interface DashboardProps {
  data: TokenData
  seed: number
}

export function Dashboard({ data: initialData, seed }: DashboardProps) {
  const [data, setData]         = useState<TokenData>(initialData)
  const [polling, setPolling]   = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [secondsAgo, setSecondsAgo]   = useState(0)
  const mintRef    = useRef(initialData.mint)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sync when a completely new token is searched
  useEffect(() => {
    if (initialData.mint !== mintRef.current) {
      mintRef.current = initialData.mint
      setData(initialData)
      setLastUpdated(new Date())
      setSecondsAgo(0)
    }
  }, [initialData.mint]) // eslint-disable-line

  // Seconds-ago counter
  useEffect(() => {
    setSecondsAgo(0)
    const id = setInterval(() => setSecondsAgo((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [lastUpdated])

  const refresh = useCallback(async (silent = false) => {
    const currentMint = mintRef.current
    if (!silent) setPolling(true)
    try {
      const res = await fetch('/api/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query: currentMint }),
      })
      if (!res.ok) return
      const json = await res.json()
      // Only apply if it's still the same token and has real data
      if (json.data && json.data.mint === mintRef.current) {
        const fresh = json.data as TokenData
        // Only update if we're getting real non-zero data
        const hasRealData = fresh.holders > 0 || fresh.price !== '$0.00' || fresh.volume !== '$0.00'
        if (hasRealData) {
          setData((prev) => ({
            ...fresh,
            // Keep distribution from WalletTable (holders route) if we have it
            distribution: prev.distribution.some((d) => d.pct > 0)
              ? prev.distribution
              : fresh.distribution,
          }))
          setLastUpdated(new Date())
          setSecondsAgo(0)
        }
      }
    } catch { /* silent fail */ }
    finally { if (!silent) setPolling(false) }
  }, [])

  // Auto-refresh every 90 seconds — but only if we have real data
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      // Don't auto-refresh if data is already zero — avoid overwriting good cached data
      refresh(true)
    }, 90_000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [refresh])

  const timeLabel = secondsAgo < 5  ? 'just now'
    : secondsAgo < 60 ? `${secondsAgo}s ago`
    : `${Math.floor(secondsAgo / 60)}m ago`

  return (
    <div className="space-y-6">
      {/* Token header + live ticker */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {data.name}
          </h1>
          <span className="font-mono text-sm text-ink-tertiary">${data.symbol}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-positive" />
            <span className="font-mono text-[11px] text-ink-tertiary">
              Updated {timeLabel}
            </span>
          </div>
          <button
            onClick={() => refresh(false)}
            disabled={polling}
            className="flex items-center gap-1.5 rounded border border-surface-border bg-surface-overlay px-2.5 py-1.5 font-mono text-[11px] text-ink-secondary transition-colors hover:border-surface-muted hover:text-ink disabled:opacity-50"
          >
            <RefreshCw className={clsx('h-3 w-3', polling && 'animate-spin')} strokeWidth={1.5} />
            <span className="hidden sm:inline">{polling ? 'Updating…' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      <MetricCards data={data} />

      <MarketCapChart
        data={data.marketCap7d ?? []}
        current={data.marketCap ?? 0}
        symbol={data.symbol}
      />

      <WalletTable
        key={data.mint}
        mint={data.mint}
        symbol={data.symbol}
        totalHolders={data.holders}
      />

      <ActivityHeatmap seed={seed} peak={data.heatPeak} />

      <div className="border-t border-surface-border" />

      <AIInsights insights={data.insights} />
      <ActionEngine actions={data.actions} />
      <ContentGenerator tweets={data.tweets} symbol={data.symbol} />
    </div>
  )
}
