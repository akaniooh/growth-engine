'use client'

import { useState } from 'react'
import { Search, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import { TokenData } from '@/lib/data'

interface SearchBarProps {
  onResult: (data: TokenData) => void
}

const DEMOS = ['BONK', 'WIF', 'POPCAT']

interface ApiError { error: string; setup?: string }

export function SearchBar({ onResult }: SearchBarProps) {
  const [query, setQuery]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [loadMsg, setLoadMsg]   = useState('')
  const [apiError, setApiError] = useState<ApiError | null>(null)

  const analyze = async (q?: string) => {
    const input = (q ?? query).trim()
    if (!input) return
    setLoading(true)
    setApiError(null)
    setLoadMsg('Fetching token data…')

    const timers = [
      setTimeout(() => setLoadMsg('Loading market data from Birdeye…'), 1500),
      setTimeout(() => setLoadMsg('Almost ready…'), 4000),
    ]

    try {
      // First attempt
      let res  = await fetch('/api/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query: input }),
      })
      let json = await res.json()

      if (!res.ok || json.error) {
        setApiError({ error: json.error, setup: json.setup })
        return
      }

      const d = json.data as TokenData

      // If Birdeye returned zeros, wait 2s and retry once — Birdeye can be slow on first hit
      const hasZeroData = d.holders === 0 || (d.price === '$0.00' && d.volume === '$0.00')
      if (hasZeroData) {
        setLoadMsg('Waiting for market data…')
        await new Promise((r) => setTimeout(r, 2500))
        const res2  = await fetch('/api/analyze', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ query: input }),
        })
        const json2 = await res2.json()
        if (res2.ok && json2.data) {
          json = json2
        }
      }

      onResult(json.data)
    } catch {
      setApiError({ error: 'Network error — check your connection and try again.' })
    } finally {
      timers.forEach(clearTimeout)
      setLoading(false)
      setLoadMsg('')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" strokeWidth={1.5} />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setApiError(null) }}
            onKeyDown={(e) => e.key === 'Enter' && analyze()}
            placeholder="Solana token address or symbol"
            className="w-full rounded-lg border border-surface-border bg-surface-overlay py-3 pl-10 pr-4 text-sm text-ink placeholder-ink-tertiary outline-none transition-colors focus:border-brand"
          />
        </div>
        <button
          onClick={() => analyze()}
          disabled={loading || !query.trim()}
          className="flex items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>

      {/* Loading progress */}
      {loading && loadMsg && (
        <p className="flex items-center gap-2 font-mono text-[11px] text-ink-tertiary">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
          {loadMsg}
        </p>
      )}

      {/* Demo chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono text-ink-tertiary">Demo:</span>
        {DEMOS.map((d) => (
          <button
            key={d}
            onClick={() => { setQuery(d); analyze(d) }}
            disabled={loading}
            className="rounded border border-surface-border bg-surface-overlay px-3 py-1 text-[11px] font-mono text-ink-secondary transition-colors hover:border-surface-muted hover:text-ink disabled:opacity-50"
          >
            {d}
          </button>
        ))}
      </div>

      {/* Error */}
      {apiError && (
        <div className="rounded-lg border border-negative/20 bg-negative/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-negative" strokeWidth={1.5} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink">{apiError.error}</p>
              {apiError.setup && (
                <div className="mt-3 space-y-2">
                  <p className="font-mono text-[11px] text-ink-secondary">{apiError.setup}</p>
                  <div className="flex flex-wrap gap-2">
                    <a href="https://helius.dev" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded border border-surface-border bg-surface-overlay px-3 py-1.5 font-mono text-[11px] text-ink-secondary hover:text-ink">
                      Get Helius key <ExternalLink className="h-3 w-3" />
                    </a>
                    <a href="https://birdeye.so" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded border border-surface-border bg-surface-overlay px-3 py-1.5 font-mono text-[11px] text-ink-secondary hover:text-ink">
                      Get Birdeye key <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="mt-2 rounded border border-surface-border bg-surface-overlay p-3">
                    <p className="mb-1 font-mono text-[10px] text-ink-tertiary">Add to .env.local</p>
                    <pre className="font-mono text-[11px] leading-relaxed text-ink-secondary">{`HELIUS_API_KEY=your_key_here\nBIRDEYE_API_KEY=your_key_here`}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
