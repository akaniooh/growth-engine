'use client'

import React, { useMemo } from 'react'

interface HeatmapProps {
  seed?: number
  peak: string
}

const HOURS = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function seededRandom(seed: number, i: number) {
  const x = Math.sin(seed * 9301 + i * 49297 + 233) * 49297
  return x - Math.floor(x)
}

export function ActivityHeatmap({ seed = 1, peak }: HeatmapProps) {
  const data = useMemo(() => {
    return Array.from({ length: 6 * 7 }, (_, idx) => {
      const h = Math.floor(idx / 7)
      const d = idx % 7
      let v = seededRandom(seed, idx) * 0.45
      if (d < 5) v += 0.15
      if (h === 2 || h === 3) v += 0.35
      return Math.min(1, v)
    })
  }, [seed])

  return (
    <div className="card">
      <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
        <span className="label">Activity Heatmap — UTC hours</span>
        <span className="font-mono text-[10px] text-ink-tertiary">
          Peak: {peak}
        </span>
      </div>
      <div className="p-5">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: 'auto repeat(7, 1fr)' }}
        >
          {/* Day headers */}
          <div />
          {DAYS.map((d) => (
            <div
              key={d}
              className="pb-2 text-center font-mono text-[9px] text-ink-tertiary"
            >
              {d}
            </div>
          ))}

          {/* Rows */}
          {HOURS.map((h, hi) => (
            <React.Fragment key={`row-${hi}`}>
              <div
                className="flex items-center pr-3 font-mono text-[9px] text-ink-tertiary"
              >
                {h}
              </div>
              {DAYS.map((_, di) => {
                const intensity = data[hi * 7 + di]
                const alpha = 0.08 + intensity * 0.92
                return (
                  <div
                    key={`${hi}-${di}`}
                    className="aspect-square rounded-sm transition-opacity hover:opacity-70"
                    style={{
                      background:
                        intensity > 0.65
                          ? `rgba(79,110,247,${alpha})`
                          : `rgba(42,42,48,${0.4 + intensity * 0.6})`,
                    }}
                    title={`${h} ${DAYS[di]}: ${Math.round(intensity * 100)}% activity`}
                  />
                )
              })}
            </React.Fragment>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="font-mono text-[9px] text-ink-tertiary">Low</span>
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
            <div
              key={v}
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: `rgba(79,110,247,${v})` }}
            />
          ))}
          <span className="font-mono text-[9px] text-ink-tertiary">High</span>
        </div>
      </div>
    </div>
  )
}
