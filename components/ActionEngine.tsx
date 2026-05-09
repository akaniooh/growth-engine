'use client'

import { useState } from 'react'
import { Action } from '@/lib/data'
import { ArrowRight, Zap, X, ExternalLink, CheckCircle2, Circle } from 'lucide-react'
import clsx from 'clsx'

interface ActionEngineProps {
  actions: Action[]
}

const PRIORITY_CONFIG = {
  high:   { label: 'High priority',   class: 'text-negative' },
  medium: { label: 'Medium priority', class: 'text-warn'     },
  low:    { label: 'Low priority',    class: 'text-ink-tertiary' },
}

function ActionModal({ action, onClose }: { action: Action; onClose: () => void }) {
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const prio = PRIORITY_CONFIG[action.priority]

  const toggle = (i: number) => {
    setCompleted((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const progress = action.steps ? Math.round((completed.size / action.steps.length) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-h-[92vh] overflow-y-auto rounded-t-2xl bg-surface-raised border border-surface-border sm:max-w-lg sm:rounded-2xl">
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-surface-muted" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 pb-4">
          <div>
            <span className={clsx('mb-2 block font-mono text-[10px] uppercase tracking-wider', prio.class)}>
              {prio.label}
            </span>
            <h2 className="text-base font-semibold text-ink">{action.title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-secondary">{action.desc}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-lg border border-surface-border bg-surface-overlay p-1.5 text-ink-tertiary transition-colors hover:text-ink"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Progress bar */}
        {action.steps && action.steps.length > 0 && (
          <div className="px-5 pb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-[10px] text-ink-tertiary">Progress</span>
              <span className="font-mono text-[10px] text-ink-secondary">
                {completed.size}/{action.steps.length} steps
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-brand transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="border-t border-surface-border" />

        {/* Steps */}
        {action.steps && action.steps.length > 0 && (
          <div className="p-5">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
              Action steps
            </p>
            <div className="space-y-3">
              {action.steps.map((step, i) => (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  className={clsx(
                    'w-full rounded-lg border p-3.5 text-left transition-all',
                    completed.has(i)
                      ? 'border-positive/20 bg-positive/5'
                      : 'border-surface-border bg-surface-overlay hover:border-surface-muted'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {completed.has(i)
                        ? <CheckCircle2 className="h-4 w-4 text-positive" strokeWidth={1.5} />
                        : <Circle className="h-4 w-4 text-ink-tertiary" strokeWidth={1.5} />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className={clsx(
                        'mb-1 text-xs font-semibold',
                        completed.has(i) ? 'text-ink-secondary line-through' : 'text-ink'
                      )}>
                        {i + 1}. {step.label}
                      </p>
                      <p className="text-xs leading-relaxed text-ink-secondary">{step.detail}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Resources */}
        {action.resources && action.resources.length > 0 && (
          <>
            <div className="border-t border-surface-border" />
            <div className="p-5">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
                Resources
              </p>
              <div className="flex flex-wrap gap-2">
                {action.resources.map((r, i) => (
                  <a
                    key={i}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-overlay px-3 py-2 text-xs text-ink-secondary transition-colors hover:border-surface-muted hover:text-ink"
                  >
                    {r.label}
                    <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function ActionEngine({ actions }: ActionEngineProps) {
  const [open, setOpen] = useState<Action | null>(null)

  return (
    <>
      <div>
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-ink">Action Engine</h2>
          <p className="mt-0.5 text-xs text-ink-secondary">
            Click any action to get a step-by-step execution guide
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {actions.map((a, i) => {
            const prio = PRIORITY_CONFIG[a.priority]
            return (
              <button
                key={i}
                onClick={() => setOpen(a)}
                className="card group cursor-pointer p-4 text-left transition-all hover:border-surface-muted hover:shadow-lg sm:p-5"
              >
                <div className="mb-3 flex items-center justify-between sm:mb-4">
                  <span className={clsx('font-mono text-[10px] uppercase tracking-wider', prio.class)}>
                    {prio.label}
                  </span>
                  <div className="flex h-6 w-6 items-center justify-center rounded border border-surface-border bg-surface-overlay transition-colors group-hover:border-brand group-hover:bg-brand-dim">
                    <Zap className="h-3 w-3 text-ink-tertiary group-hover:text-brand" strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-ink">{a.title}</h3>
                <p className="mb-4 text-xs leading-relaxed text-ink-secondary sm:mb-5">{a.desc}</p>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-brand">
                  {a.cta}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {open && <ActionModal action={open} onClose={() => setOpen(null)} />}
    </>
  )
}
