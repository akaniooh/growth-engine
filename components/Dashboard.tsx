'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { TokenData } from '@/lib/data'
import { MetricCards } from './MetricCards'
import { MarketCapChart } from './MarketCapChart'
import { WalletTable } from './WalletTable'
import { AIInsights } from './AIInsights'
import { ActionEngine } from './ActionEngine'
import { ContentGenerator } from './ContentGenerator'
import { FounderMemory } from './FounderMemory'
import { RefreshCw } from 'lucide-react'
import clsx from 'clsx'

interface DashboardProps {
  data: TokenData
  seed: number
}

export function Dashboard({ data: initialData, seed }: DashboardProps) {
  const [data, setData]           = useState<TokenData>(initialData)
  const [polling, setPolling]     = useState(false)
  const [realPcts, setRealPcts]   = useState<{ whale: number; active: number; new: number; dormant: number } | null>(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [secondsAgo, setSecondsAgo]   = useState(0)
  const mintRef    = useRef(initialData.mint)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sync whenever parent provides a new analysis result.
  // `seed` increments on every search, even if mint is unchanged.
  useEffect(() => {
    mintRef.current = initialData.mint
    setData(initialData)
    setLastUpdated(new Date())
    setSecondsAgo(0)
  }, [initialData, seed])

  // Seconds-ago counter
  useEffect(() => {
    setSecondsAgo(0)
    const id = setInterval(() => setSecondsAgo((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [lastUpdated])

  // Called when WalletTable loads real holder segment data
  // Re-fetch insights from server with real segment percentages
  const handleSegmentsLoaded = useCallback(async (pcts: { whale: number; active: number; new: number; dormant: number }) => {
    setRealPcts(pcts)
    const currentMint = mintRef.current
    try {
      const res  = await fetch('/api/insights', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mint: currentMint, pcts, enriched: true }),
      })
      if (!res.ok) return
      const json = await res.json()
      if (json.insights && json.actions && mintRef.current === currentMint) {
        setData((prev) => ({
          ...prev,
          distribution: [
            { label: 'Whales',  pct: pcts.whale,   color: '#4f6ef7' },
            { label: 'Active',  pct: pcts.active,  color: '#f0f0f4' },
            { label: 'New',     pct: pcts.new,     color: '#8a8a9a' },
            { label: 'Dormant', pct: pcts.dormant, color: '#2a2a30' },
          ],
          insights: json.insights,
          actions:  json.actions,
        }))
      }
    } catch { /* silent */ }
  }, [])

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
      // Only apply if it's still the same token
      if (json.data && json.data.mint === mintRef.current) {
        const fresh = json.data as TokenData
        setData((prev) => ({
          ...fresh,
          // Keep holder-derived segments and AI outputs when available
          distribution: prev.distribution.some((d) => d.pct > 0)
            ? prev.distribution
            : fresh.distribution,
          insights: realPcts ? prev.insights : fresh.insights,
          actions: realPcts ? prev.actions : fresh.actions,
          tweets: realPcts ? prev.tweets : fresh.tweets,
        }))
        setLastUpdated(new Date())
        setSecondsAgo(0)

        if (realPcts) {
          handleSegmentsLoaded(realPcts)
        }
      }
    } catch { /* silent fail */ }
    finally { if (!silent) setPolling(false) }
  }, [handleSegmentsLoaded, realPcts])

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
        onSegmentsLoaded={handleSegmentsLoaded}
      />

      <div className="border-t border-surface-border" />

      <AIInsights insights={data.insights} />
      <ActionEngine actions={data.actions} />
      <ContentGenerator tweets={data.tweets} symbol={data.symbol} />

      <div className="border-t border-surface-border" />

      <FounderMemory mint={data.mint} symbol={data.symbol} />
    </div>
  )
}
