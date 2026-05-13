'use client'

import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'

interface MarketCapChartProps {
  data:      number[]   // 7-day market cap series in USD
  current:   number     // current market cap
  symbol:    string
}

function fmtMC(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export function MarketCapChart({ data, current, symbol }: MarketCapChartProps) {
  // Build labels for last N days
  const today  = new Date()
  const labels = data.map((_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (data.length - 1 - i))
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  })
  const shortLabels = data.map((_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (data.length - 1 - i))
    return d.toLocaleDateString('en-US', { weekday: 'short' })
  })

  const series = data.length > 0 ? data : (current > 0 ? Array(7).fill(current) : [])

  const chartData = series.map((v, i) => ({
    day:      shortLabels[i],
    fullDate: labels[i],
    mc:       v,
  }))

  const hasData  = series.some((v) => v > 0)
  const minVal   = hasData ? Math.min(...series.filter((v) => v > 0)) : 0
  const maxVal   = hasData ? Math.max(...series) : 0
  const firstVal = series.find((v) => v > 0) ?? 0
  const lastVal  = series[series.length - 1] ?? 0
  const change   = firstVal > 0 ? ((lastVal - firstVal) / firstVal) * 100 : 0
  const up       = change >= 0

  return (
    <div className="card flex flex-col">
      <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
        <span className="label">Market Cap — 7 Day</span>
        {hasData && current > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-ink">{fmtMC(current)}</span>
            <span className={`font-mono text-[11px] ${up ? 'text-positive' : 'text-negative'}`}>
              {up ? '+' : ''}{change.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 p-4 sm:p-5">
        {!hasData ? (
          <div className="flex h-44 flex-col items-center justify-center gap-2">
            <p className="font-mono text-[11px] text-ink-tertiary">
              Market cap data unavailable for ${symbol}
            </p>
            <p className="font-mono text-[10px] text-ink-tertiary opacity-60">
              Birdeye may not have historical data for this token yet
            </p>
          </div>
        ) : (
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: '#55555f', fontFamily: 'var(--font-geist-mono)' }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#55555f', fontFamily: 'var(--font-geist-mono)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={fmtMC}
                  width={52}
                  domain={[minVal * 0.95, maxVal * 1.05]}
                />
                <Tooltip
                  contentStyle={{
                    background:   '#17171b',
                    border:       '1px solid #1f1f24',
                    borderRadius: '8px',
                    padding:      '8px 12px',
                    fontSize:     '12px',
                    fontFamily:   'var(--font-geist-mono)',
                    color:        '#f0f0f4',
                  }}
                  formatter={(v: number) => [fmtMC(v), 'Market Cap']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ''}
                  cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }}
                />
                {/* Reference line at week start */}
                <ReferenceLine
                  y={firstVal}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4 4"
                />
                <Line
                  type="monotone"
                  dataKey="mc"
                  stroke="#4f6ef7"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: '#4f6ef7',
                    stroke: '#0c0c0e',
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
