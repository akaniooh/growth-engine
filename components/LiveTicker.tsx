'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { TokenData } from '@/lib/data'
import { RefreshCw } from 'lucide-react'
import clsx from 'clsx'

interface LiveTickerProps {
  mint: string        // full token address — used for API calls
  symbol: string      // display only
  onUpdate: (data: TokenData) => void
}

const INTERVAL_MS = 60_000 // 60 seconds (reduce noise)

export function LiveTicker({ mint, symbol, onUpdate }: LiveTickerProps) {
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [polling, setPolling]         = useState(false)
  const [secondsAgo, setSecondsAgo]   = useState(0)
  const [flashKey, setFlashKey]       = useState(0)
  const mintRef = useRef(mint)
  mintRef.current = mint  // always up to date without re-creating the callback

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setPolling(true)
    try {
      const res = await fetch('/api/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query: mintRef.current }),  // use mint, not symbol
      })
      if (!res.ok) return
      const json = await res.json()
      if (json.data) {
        onUpdate(json.data)
        setLastUpdated(new Date())
        setSecondsAgo(0)
        setFlashKey((k) => k + 1)
      }
    } catch { /* silent */ }
    finally { if (!silent) setPolling(false) }
  }, [onUpdate])  // stable — mintRef.current handles changes

  // Auto-poll
  useEffect(() => {
    const id = setInterval(() => refresh(true), INTERVAL_MS)
    return () => clearInterval(id)
  }, [refresh])

  // Seconds counter
  useEffect(() => {
    setSecondsAgo(0)
    const id = setInterval(() => setSecondsAgo((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [lastUpdated])

  const timeLabel = secondsAgo < 5   ? 'just now'
    : secondsAgo < 60  ? `${secondsAgo}s ago`
    : `${Math.floor(secondsAgo / 60)}m ago`

  return (
    <div className="flex items-center gap-3">
      <div key={flashKey} className="flex items-center gap-1.5">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-positive" />
        <span className="font-mono text-[11px] text-ink-tertiary">
          Updated {timeLabel}
        </span>
      </div>
      <button
        onClick={() => refresh(false)}
        disabled={polling}
        title="Refresh stats"
        className="flex items-center gap-1.5 rounded border border-surface-border bg-surface-overlay px-2.5 py-1 font-mono text-[11px] text-ink-secondary transition-colors hover:border-surface-muted hover:text-ink disabled:opacity-50"
      >
        <RefreshCw className={clsx('h-3 w-3', polling && 'animate-spin')} strokeWidth={1.5} />
        <span className="hidden sm:inline">{polling ? 'Updating…' : 'Refresh'}</span>
      </button>
    </div>
  )
}
