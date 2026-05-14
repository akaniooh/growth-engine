'use client'

import { useState } from 'react'
import { Brain, ChevronDown, ChevronUp } from 'lucide-react'

interface MemoryContextBannerProps {
  context: string   // raw context string from memory
}

/**
 * Subtle inline banner that appears inside AI Insight / Action cards
 * when founder memory has enriched that output.
 */
export function MemoryContextBanner({ context }: MemoryContextBannerProps) {
  const [expanded, setExpanded] = useState(false)

  if (!context) return null

  // Show only first 2 lines collapsed, rest on expand
  const lines  = context.split('\n').filter(Boolean)
  const preview = lines.slice(0, 2).join(' · ')
  const hasMore = lines.length > 2

  return (
    <div className="mt-3 rounded-lg border border-brand-border bg-brand-dim">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start gap-2 px-3 py-2 text-left"
      >
        <Brain className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={1.5} />
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 font-mono text-[9px] uppercase tracking-wider text-brand/70">
            Memory Context
          </div>
          {expanded ? (
            <ul className="space-y-1">
              {lines.map((line, i) => (
                <li key={i} className="text-xs leading-relaxed text-brand/80">{line}</li>
              ))}
            </ul>
          ) : (
            <p className="truncate text-xs text-brand/80">{preview}</p>
          )}
        </div>
        {hasMore && (
          <div className="shrink-0 text-brand/50">
            {expanded
              ? <ChevronUp className="h-3.5 w-3.5" />
              : <ChevronDown className="h-3.5 w-3.5" />
            }
          </div>
        )}
      </button>
    </div>
  )
}
