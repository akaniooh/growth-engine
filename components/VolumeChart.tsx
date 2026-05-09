'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface VolumeChartProps {
  data: number[]
}

export function VolumeChart({ data }: VolumeChartProps) {
  // Build last N days labels based on today's actual date
  const today = new Date()
  const days = data.map((_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (data.length - 1 - i))
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  })
  const shortLabels = data.map((_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (data.length - 1 - i))
    return d.toLocaleDateString('en-US', { weekday: 'short' })
  })

  const max = Math.max(...data)
  const chartData = data.map((v, i) => ({
    label: shortLabels[i],
    fullDate: days[i],
    vol: v,
  }))

  return (
    <div className="card flex flex-col">
      <div className="border-b border-surface-border px-5 py-4">
        <span className="label">Volume — 7 Day</span>
      </div>
      <div className="flex-1 p-4 sm:p-5">
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="28%">
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#55555f', fontFamily: 'var(--font-geist-mono)' }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#55555f', fontFamily: 'var(--font-geist-mono)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1 ? `$${v}M` : `$${(v * 1000).toFixed(0)}K`}
                width={44}
              />
              <Tooltip
                contentStyle={{
                  background: '#17171b',
                  border: '1px solid #1f1f24',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-geist-mono)',
                  color: '#f0f0f4',
                }}
                formatter={(v: number) => [
                  v >= 1 ? `$${v.toFixed(2)}M` : `$${(v * 1000).toFixed(0)}K`,
                  'Volume',
                ]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ''}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="vol" radius={[3, 3, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.vol === max ? '#4f6ef7' : '#2a2a30'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
