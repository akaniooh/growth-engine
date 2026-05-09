'use client'

import { useState, useEffect, useRef } from 'react'
import { Wallet } from '@/lib/data'
import { Loader2, Download, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

interface WalletTableProps {
  mint:         string
  symbol:       string
  totalHolders: number
}

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  whale:   { label: 'Whale',   className: 'bg-brand-dim text-brand border-brand-border' },
  active:  { label: 'Active',  className: 'bg-positive/10 text-positive border-positive/20' },
  new:     { label: 'New',     className: 'bg-warn/10 text-warn border-warn/20' },
  dormant: { label: 'Dormant', className: 'bg-surface-muted text-ink-tertiary border-surface-muted' },
}

type FilterType = 'all' | 'whale' | 'active' | 'new' | 'dormant'

interface TableState {
  wallets:  Wallet[]
  total:    number
  counts:   Record<FilterType, number>
  loaded:   boolean
  error:    string
}

const EMPTY: TableState = {
  wallets: [], total: 0,
  counts: { all: 0, whale: 0, active: 0, new: 0, dormant: 0 },
  loaded: false, error: '',
}

function exportCSV(wallets: Wallet[], symbol: string) {
  const header = ['Rank', 'Address', 'Segment', 'Holdings', 'Supply %', 'Last Active']
  const rows   = wallets.map((w, i) => [
    i + 1,
    w.addr,
    w.type,
    w.holdings,
    w.pct,
    w.last,
  ])
  const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${symbol}-top-holders.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function WalletTable({ mint, symbol, totalHolders }: WalletTableProps) {
  const [filter, setFilter]       = useState<FilterType>('all')
  const [dropdownOpen, setDropdown] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [state, setState]         = useState<TableState>(EMPTY)
  const abortRef  = useRef<AbortController | null>(null)
  const mintRef   = useRef(mint)
  const dropRef   = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchData = async (f: FilterType, currentMint: string) => {
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)

    try {
      const res  = await fetch('/api/holders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mint: currentMint, symbol, filter: f }),
        signal:  ctrl.signal,
      })
      if (mintRef.current !== currentMint) return
      const json = await res.json()
      if (!res.ok || json.error) {
        // Auto-retry on overload (503) after a short delay
        if (res.status === 503 && json.retryable) {
          console.log('[WalletTable] RPC overloaded, auto-retrying in 2s…')
          await new Promise((r) => setTimeout(r, 2000))
          // Recurse — but only if still same mint
          if (mintRef.current === currentMint) {
            fetchData(f, currentMint)
          }
          return
        }
        setState((p) => ({ ...p, error: json.error ?? 'Failed to load', loaded: true }))
        return
      }
      setState({
        wallets: json.wallets ?? [],
        total:   json.total   ?? 0,
        counts:  json.counts  ?? EMPTY.counts,
        loaded:  true,
        error:   '',
      })
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
      if (mintRef.current === currentMint) {
        setState((p) => ({ ...p, error: 'Network error — try again', loaded: true }))
      }
    } finally {
      if (mintRef.current === currentMint) setLoading(false)
    }
  }

  useEffect(() => {
    mintRef.current = mint
    setFilter('all')
    setState(EMPTY)
    fetchData('all', mint)
    return () => { abortRef.current?.abort() }
  }, [mint]) // eslint-disable-line

  const handleFilter = (f: FilterType) => {
    setFilter(f)
    setDropdown(false)
    fetchData(f, mint)
  }

  const { wallets, counts, loaded, error } = state

  const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
    { value: 'all',     label: `All (${counts.all})` },
    { value: 'whale',   label: `Whales (${counts.whale})` },
    { value: 'active',  label: `Active Traders (${counts.active})` },
    { value: 'new',     label: `New Buyers (${counts.new})` },
    { value: 'dormant', label: `Dormant (${counts.dormant})` },
  ]

  const currentLabel = FILTER_OPTIONS.find((o) => o.value === filter)?.label ?? 'All'

  return (
    <div className="card overflow-hidden">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border px-4 py-3.5 sm:px-5">
        <div>
          <span className="label">Top 10 Holders</span>
          {totalHolders > 0 && (
            <span className="ml-2 font-mono text-[10px] text-ink-tertiary">
              of {totalHolders.toLocaleString()} total
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter dropdown */}
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setDropdown((o) => !o)}
              disabled={!loaded}
              className="flex items-center gap-1.5 rounded border border-surface-border bg-surface-overlay px-3 py-1.5 font-mono text-[11px] text-ink-secondary transition-colors hover:border-surface-muted hover:text-ink disabled:opacity-50"
            >
              <span>{currentLabel}</span>
              <ChevronDown className={clsx('h-3 w-3 transition-transform', dropdownOpen && 'rotate-180')} strokeWidth={1.5} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-surface-border bg-surface-raised shadow-xl">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleFilter(opt.value)}
                    className={clsx(
                      'flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-[11px] transition-colors first:rounded-t-lg last:rounded-b-lg',
                      filter === opt.value
                        ? 'bg-brand-dim text-brand'
                        : 'text-ink-secondary hover:bg-surface-overlay hover:text-ink'
                    )}
                  >
                    {opt.value !== 'all' && (
                      <span className={clsx(
                        'h-1.5 w-1.5 rounded-full flex-shrink-0',
                        opt.value === 'whale'   && 'bg-brand',
                        opt.value === 'active'  && 'bg-positive',
                        opt.value === 'new'     && 'bg-warn',
                        opt.value === 'dormant' && 'bg-ink-tertiary',
                      )} />
                    )}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CSV Export */}
          <button
            onClick={() => exportCSV(wallets, symbol)}
            disabled={!loaded || wallets.length === 0}
            title="Download as CSV"
            className="flex items-center gap-1.5 rounded border border-surface-border bg-surface-overlay px-3 py-1.5 font-mono text-[11px] text-ink-secondary transition-colors hover:border-surface-muted hover:text-ink disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Loading */}
      {!loaded && loading && (
        <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
          <Loader2 className="mb-3 h-5 w-5 animate-spin text-brand" strokeWidth={1.5} />
          <p className="text-sm font-medium text-ink">Fetching top holders…</p>
          <p className="mt-1 font-mono text-[11px] text-ink-tertiary">Resolving wallet addresses from chain</p>
        </div>
      )}

      {/* Error */}
      {loaded && error && (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-negative">{error}</p>
          <button
            onClick={() => { setState((p) => ({ ...p, error: '', loaded: false })); fetchData(filter, mint) }}
            className="mt-3 rounded border border-surface-border bg-surface-overlay px-4 py-2 font-mono text-[11px] text-ink-secondary hover:text-ink"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {loaded && !error && wallets.length === 0 && (
        <p className="px-5 py-8 text-center text-sm text-ink-secondary">
          No holders found for this segment
        </p>
      )}

      {/* Desktop table */}
      {loaded && !error && wallets.length > 0 && (
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border">
                {['#', 'Wallet Address', 'Segment', 'Holdings', 'Supply %', 'Last Active'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-ink-tertiary">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={clsx(loading && 'opacity-40 transition-opacity')}>
              {wallets.map((w, i) => {
                const cfg = TYPE_CONFIG[w.type] ?? TYPE_CONFIG.dormant
                return (
                  <tr key={`${w.addr}-${i}`} className="border-b border-surface-border/50 transition-colors last:border-0 hover:bg-surface-overlay/50">
                    <td className="px-5 py-3.5 font-mono text-[11px] text-ink-tertiary">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-ink-secondary">{w.addr}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={clsx('badge border', cfg.className)}>{cfg.label}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-medium text-ink">{w.holdings}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-ink-secondary">{w.pct}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-ink-tertiary">{w.last}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {loaded && !error && wallets.length > 0 && (
        <div className={clsx('divide-y divide-surface-border sm:hidden', loading && 'opacity-40')}>
          {wallets.map((w, i) => {
            const cfg = TYPE_CONFIG[w.type] ?? TYPE_CONFIG.dormant
            return (
              <div key={`${w.addr}-${i}`} className="flex items-center justify-between px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-5 flex-shrink-0 font-mono text-[10px] text-ink-tertiary">{i + 1}</span>
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <span className={clsx('badge border', cfg.className)}>{cfg.label}</span>
                      <span className="font-mono text-[10px] text-ink-tertiary">{w.last}</span>
                    </div>
                    <span className="block truncate font-mono text-xs text-ink-secondary">{w.addr}</span>
                  </div>
                </div>
                <div className="ml-3 flex-shrink-0 text-right">
                  <div className="font-mono text-xs font-medium text-ink">{w.pct}</div>
                  <div className="font-mono text-[10px] text-ink-tertiary">{w.holdings}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Page-turn loading indicator */}
      {loaded && loading && (
        <div className="flex items-center gap-2 border-t border-surface-border px-5 py-2">
          <Loader2 className="h-3 w-3 animate-spin text-brand" strokeWidth={1.5} />
          <span className="font-mono text-[11px] text-ink-tertiary">Updating…</span>
        </div>
      )}
    </div>
  )
}
