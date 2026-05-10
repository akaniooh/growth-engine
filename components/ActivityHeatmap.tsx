'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import clsx from 'clsx'

interface ActivityHeatmapProps {
  mint: string
  symbol: string
}

interface Trade {
  txHash: string
  side: 'buy' | 'sell'
  price: number
  volume: number
  amount: number
  source: string
  blockTime: number
  from: string
}

interface TradeData {
  trades:       Trade[]
  heatmap:      number[][]
  peakDay:      string
  peakHour:     number
  buyCount:     number
  sellCount:    number
  totalVolume:  number
  buySellRatio: number
}

const HOURS = ['00–04', '04–08', '08–12', '12–16', '16–20', '20–24']
const DAYS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function fmtTime(ts: number): string {
  const d   = new Date(ts * 1000)
  const h   = d.getUTCHours().toString().padStart(2, '0')
  const m   = d.getUTCMinutes().toString().padStart(2, '0')
  return `${h}:${m} UTC`
}

function fmtAmount(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return n.toFixed(0)
}

function fmtUSD(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}

export function ActivityHeatmap({ mint, symbol }: ActivityHeatmapProps) {
  const [data, setData]       = useState<TradeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [tab, setTab]         = useState<'heatmap' | 'trades'>('heatmap')
  const mintRef = useRef(mint)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchTrades = async (currentMint: string, silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/trades', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mint: currentMint }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        if (!silent) setError(json.error ?? 'Failed to load trades')
        return
      }
      if (mintRef.current === currentMint) {
        setData(json as TradeData)
      }
    } catch {
      if (!silent) setError('Network error')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    mintRef.current = mint
    setData(null)
    setError('')
    fetchTrades(mint)

    // Refresh trades every 30 seconds
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => fetchTrades(mint, true), 30_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [mint]) // eslint-disable-line

  const peakLabel = data
    ? `${data.peakDay} ${String(data.peakHour).padStart(2,'0')}:00 UTC`
    : 'Loading…'

  return (
    <div className="card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="label">Live Activity</span>
          {data && (
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-positive" />
              <span className="font-mono text-[10px] text-ink-tertiary">auto-refreshing</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <span className="font-mono text-[10px] text-ink-tertiary">Peak: {peakLabel}</span>
          )}
          <div className="flex rounded-lg border border-surface-border overflow-hidden">
            {(['heatmap', 'trades'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={clsx(
                  'px-3 py-1.5 font-mono text-[10px] transition-colors capitalize',
                  tab === t ? 'bg-brand text-white' : 'text-ink-tertiary hover:text-ink'
                )}
              >
                {t === 'heatmap' ? 'Heatmap' : 'Live Trades'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-12">
          <Loader2 className="h-4 w-4 animate-spin text-brand" strokeWidth={1.5} />
          <span className="font-mono text-[11px] text-ink-tertiary">Fetching trade activity…</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="px-5 py-8 text-center">
          <p className="font-mono text-[11px] text-ink-tertiary">{error}</p>
          <button
            onClick={() => fetchTrades(mint)}
            className="mt-3 rounded border border-surface-border bg-surface-overlay px-4 py-2 font-mono text-[11px] text-ink-secondary hover:text-ink"
          >
            Retry
          </button>
        </div>
      )}

      {/* Buy/sell summary bar */}
      {data && (
        <div className="flex items-center gap-4 border-b border-surface-border px-5 py-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-positive" strokeWidth={1.5} />
            <span className="font-mono text-[11px] text-positive font-medium">{data.buyCount} buys</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-3.5 w-3.5 text-negative" strokeWidth={1.5} />
            <span className="font-mono text-[11px] text-negative font-medium">{data.sellCount} sells</span>
          </div>
          {/* Buy/sell ratio bar */}
          <div className="flex-1 h-1.5 rounded-full bg-surface-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-positive transition-all duration-700"
              style={{ width: `${data.buySellRatio * 100}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-ink-tertiary">
            {Math.round(data.buySellRatio * 100)}% buy pressure
          </span>
          <span className="font-mono text-[10px] text-ink-tertiary hidden sm:inline">
            Vol: {fmtUSD(data.totalVolume)}
          </span>
        </div>
      )}

      {/* HEATMAP TAB */}
      {data && tab === 'heatmap' && (
        <div className="p-5">
          <div className="grid gap-1" style={{ gridTemplateColumns: 'auto repeat(7, 1fr)' }}>
            {/* Day headers */}
            <div />
            {DAYS.map((d) => (
              <div key={d} className="pb-2 text-center font-mono text-[9px] text-ink-tertiary">{d}</div>
            ))}
            {/* Rows */}
            {HOURS.map((h, hi) => (
              <React.Fragment key={`row-${hi}`}>
                <div className="flex items-center pr-3 font-mono text-[9px] text-ink-tertiary whitespace-nowrap">{h}</div>
                {DAYS.map((day, di) => {
                  const intensity = data.heatmap[hi]?.[di] ?? 0
                  const alpha     = 0.08 + intensity * 0.92
                  const isPeak    = data.peakDay === day && Math.floor(data.peakHour / 4) === hi
                  return (
                    <div
                      key={`${hi}-${di}`}
                      className="aspect-square rounded-sm transition-opacity hover:opacity-70"
                      style={{
                        background: isPeak
                          ? `rgba(0,212,170,${alpha})`
                          : intensity > 0.5
                            ? `rgba(79,110,247,${alpha})`
                            : `rgba(42,42,48,${0.3 + intensity * 0.7})`,
                        boxShadow: isPeak ? '0 0 6px rgba(0,212,170,0.4)' : 'none',
                      }}
                      title={`${h} ${day}: ${Math.round(intensity * 100)}% activity`}
                    />
                  )
                })}
              </React.Fragment>
            ))}
          </div>
          {/* Legend */}
          <div className="mt-4 flex items-center gap-3">
            <span className="font-mono text-[9px] text-ink-tertiary">Low</span>
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
              <div key={v} className="h-2.5 w-2.5 rounded-sm" style={{ background: `rgba(79,110,247,${v})` }} />
            ))}
            <span className="font-mono text-[9px] text-ink-tertiary">High</span>
            <div className="ml-4 flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm" style={{ background: 'rgba(0,212,170,0.9)' }} />
              <span className="font-mono text-[9px] text-ink-tertiary">Peak window</span>
            </div>
          </div>
          <p className="mt-2 font-mono text-[10px] text-ink-tertiary">
            Built from last 100 on-chain trades for ${symbol}
          </p>
        </div>
      )}

      {/* LIVE TRADES TAB */}
      {data && tab === 'trades' && (
        <div className="overflow-hidden">
          {data.trades.length === 0 ? (
            <p className="px-5 py-8 text-center font-mono text-[11px] text-ink-tertiary">
              No recent trades found for ${symbol}
            </p>
          ) : (
            <>
              {/* Table header */}
              <div className="grid border-b border-surface-border px-5 py-2.5"
                   style={{ gridTemplateColumns: '60px 80px 1fr 100px 80px 80px' }}>
                {['Time', 'Side', 'Wallet', 'Amount', 'Value', 'Price'].map((h) => (
                  <span key={h} className="font-mono text-[9px] uppercase tracking-widest text-ink-tertiary">{h}</span>
                ))}
              </div>
              {/* Rows */}
              <div className="max-h-72 overflow-y-auto">
                {data.trades.map((t, i) => (
                  <div
                    key={`${t.txHash}-${i}`}
                    className={clsx(
                      'grid items-center border-b border-surface-border/40 px-5 py-2.5 transition-colors hover:bg-surface-overlay/50',
                      'last:border-0'
                    )}
                    style={{ gridTemplateColumns: '60px 80px 1fr 100px 80px 80px' }}
                  >
                    <span className="font-mono text-[10px] text-ink-tertiary">{fmtTime(t.blockTime)}</span>
                    <div className="flex items-center gap-1.5">
                      {t.side === 'buy'
                        ? <TrendingUp className="h-3 w-3 text-positive" strokeWidth={2} />
                        : <TrendingDown className="h-3 w-3 text-negative" strokeWidth={2} />
                      }
                      <span className={clsx(
                        'font-mono text-[10px] font-bold uppercase',
                        t.side === 'buy' ? 'text-positive' : 'text-negative'
                      )}>
                        {t.side}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-ink-secondary truncate">
                      {t.from ? `${t.from.slice(0,4)}...${t.from.slice(-4)}` : '—'}
                    </span>
                    <span className="font-mono text-[10px] text-ink">
                      {fmtAmount(t.amount)} {symbol}
                    </span>
                    <span className="font-mono text-[10px] text-ink-secondary">{fmtUSD(t.volume)}</span>
                    <span className="font-mono text-[10px] text-ink-tertiary">
                      ${t.price < 0.01 ? t.price.toPrecision(3) : t.price.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-surface-border px-5 py-2.5">
                <p className="font-mono text-[10px] text-ink-tertiary">
                  Showing {data.trades.length} most recent trades · refreshes every 30s
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
