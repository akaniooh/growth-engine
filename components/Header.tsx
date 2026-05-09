'use client'

import { TrendingUp } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-13 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand">
            <TrendingUp className="h-3.5 w-3.5 text-white" strokeWidth={2} />
          </div>
          <span className="text-sm font-semibold tracking-tight text-ink">
            Growth Engine
          </span>
          <span className="hidden rounded border border-surface-border bg-surface-overlay px-2 py-0.5 text-[10px] font-mono text-ink-tertiary sm:inline">
            SOLANA
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-positive" />
            <span className="text-[11px] font-mono text-ink-secondary">Live</span>
          </div>
          <a
            href="https://docs.helius.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-[11px] font-mono text-ink-tertiary transition-colors hover:text-ink sm:inline"
          >
            Docs →
          </a>
        </div>
      </div>
    </header>
  )
}
