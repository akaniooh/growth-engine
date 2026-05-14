'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Brain, Clock, Target, Sparkles, Plus, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, TrendingUp, X, Loader2, Search,
} from 'lucide-react'
import clsx from 'clsx'

// ── Types (mirrored from lib/memory.ts for client) ───────────────────────────

type GoalType =
  | 'growth' | 'sustainability' | 'retention'
  | 'price_stability' | 'decentralization' | 'liquidity_depth'

type ActionTag =
  | 'incentives' | 'emissions' | 'liquidity' | 'marketing'
  | 'listing' | 'governance' | 'unlock' | 'treasury' | 'rewards'
  | 'partnership' | 'burn' | 'other'

interface MetricSnapshot {
  holders?: number
  holderChange7d?: number
  retention7d?: number
  volume24h?: number
  price?: number
  marketCap?: number
  whalePct?: number
  dormantPct?: number
  sellPressure?: 'high' | 'medium' | 'low'
}

interface MemoryEvent {
  id: string
  action_taken: string
  reason: string
  date: string
  metrics_before: MetricSnapshot
  metrics_after?: MetricSnapshot
  outcome?: string
  negative_effect?: string
  confidence: number
  tags: ActionTag[]
}

interface FounderGoals {
  primary: GoalType
  secondary: GoalType[]
  notes?: string
}

interface Pattern {
  pattern: string
  confidence: number
  evidence: string[]
}

interface TokenMemory {
  mint: string
  symbol: string
  founder_goals: FounderGoals | null
  events: MemoryEvent[]
  patterns: Pattern[]
  updated_at: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GOAL_LABELS: Record<GoalType, string> = {
  growth:          'Growth',
  sustainability:  'Sustainability',
  retention:       'Retention',
  price_stability: 'Price Stability',
  decentralization:'Decentralization',
  liquidity_depth: 'Liquidity Depth',
}

const TAG_LABELS: Record<ActionTag, string> = {
  incentives: 'Incentives', emissions: 'Emissions', liquidity: 'Liquidity',
  marketing: 'Marketing', listing: 'Listing', governance: 'Governance',
  unlock: 'Unlock', treasury: 'Treasury', rewards: 'Rewards',
  partnership: 'Partnership', burn: 'Burn', other: 'Other',
}

const TAG_COLORS: Record<ActionTag, string> = {
  incentives: 'bg-brand-dim text-brand border-brand-border',
  rewards:    'bg-brand-dim text-brand border-brand-border',
  emissions:  'bg-warn-dim text-warn border-warn/30',
  unlock:     'bg-warn-dim text-warn border-warn/30',
  liquidity:  'bg-positive-dim text-positive border-positive/30',
  marketing:  'bg-surface-muted text-ink-secondary border-surface-border',
  listing:    'bg-surface-muted text-ink-secondary border-surface-border',
  governance: 'bg-surface-muted text-ink-secondary border-surface-border',
  treasury:   'bg-surface-muted text-ink-secondary border-surface-border',
  partnership:'bg-surface-muted text-ink-secondary border-surface-border',
  burn:       'bg-negative-dim text-negative border-negative/30',
  other:      'bg-surface-muted text-ink-secondary border-surface-border',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TagBadge({ tag }: { tag: ActionTag }) {
  return (
    <span className={clsx(
      'inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider',
      TAG_COLORS[tag]
    )}>
      {TAG_LABELS[tag]}
    </span>
  )
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 75 ? 'bg-positive' : pct >= 50 ? 'bg-warn' : 'bg-ink-tertiary'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-16 overflow-hidden rounded-full bg-surface-muted">
        <div className={clsx('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[10px] text-ink-tertiary">{pct}%</span>
    </div>
  )
}

function OutcomeForm({ event, mint, onSaved }: {
  event: MemoryEvent; mint: string; onSaved: () => void
}) {
  const [outcome, setOutcome]   = useState(event.outcome ?? '')
  const [downside, setDownside] = useState(event.negative_effect ?? '')
  const [saving, setSaving]     = useState(false)

  const save = async () => {
    if (!outcome.trim() && !downside.trim()) return
    setSaving(true)
    try {
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_outcome',
          mint,
          event_id: event.id,
          patch: {
            outcome:         outcome.trim() || undefined,
            negative_effect: downside.trim() || undefined,
            confidence:      0.8,
          },
        }),
      })
      onSaved()
    } finally { setSaving(false) }
  }

  return (
    <div className="mt-3 space-y-2.5 border-t border-surface-border pt-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
        What happened?
      </p>
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-2.5 h-3.5 w-3.5 shrink-0 text-positive" strokeWidth={1.5} />
          <input
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-xs text-ink placeholder-ink-tertiary outline-none focus:border-positive/50"
            placeholder="What worked? e.g. Holders up 18%, community very active"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
          />
        </div>
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-2.5 h-3.5 w-3.5 shrink-0 text-warn" strokeWidth={1.5} />
          <input
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-xs text-ink placeholder-ink-tertiary outline-none focus:border-warn/50"
            placeholder="Any downside? e.g. Retention dropped after 2 weeks"
            value={downside}
            onChange={(e) => setDownside(e.target.value)}
          />
        </div>
      </div>
      <button
        onClick={save}
        disabled={saving || (!outcome.trim() && !downside.trim())}
        className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-overlay px-3 py-1.5 font-mono text-[10px] text-ink-secondary transition-colors hover:border-surface-muted hover:text-ink disabled:opacity-40"
      >
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
        {saving ? 'Saving...' : 'Save Outcome'}
      </button>
    </div>
  )
}

function EventCard({ event, mint, onDelete, onRefresh }: {
  event: MemoryEvent; mint: string; onDelete: (id: string) => void; onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing]   = useState(false)
  const date = new Date(event.date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
  const hasOutcome = !!(event.outcome || event.negative_effect)

  return (
    <div className="relative pl-6">
      {/* Timeline dot — green when outcome recorded */}
      <div className={clsx(
        'absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full border-2 ring-2 ring-surface',
        hasOutcome ? 'border-positive bg-positive/20' : 'border-surface-border bg-surface-raised'
      )} />

      <div className="card-sm p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[10px] text-ink-tertiary">{date}</span>
              {event.tags.map((t) => <TagBadge key={t} tag={t} />)}
              {hasOutcome && (
                <span className="inline-flex items-center gap-1 rounded border border-positive/30 bg-positive-dim px-1.5 py-0.5 font-mono text-[9px] text-positive">
                  <CheckCircle2 className="h-2.5 w-2.5" /> outcome logged
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-ink">{event.action_taken}</p>
            {event.reason && (
              <p className="mt-0.5 text-xs text-ink-tertiary">{event.reason}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ConfidenceBar value={event.confidence} />
            <button
              onClick={() => { setExpanded((e) => !e); setEditing(false) }}
              className="rounded p-1 text-ink-tertiary transition-colors hover:text-ink"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => onDelete(event.id)}
              className="rounded p-1 text-ink-tertiary transition-colors hover:text-negative"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {expanded && (
          <>
            {/* Show recorded outcome */}
            {hasOutcome && !editing && (
              <div className="mt-3 space-y-2 border-t border-surface-border pt-3">
                {event.outcome && (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-positive" strokeWidth={1.5} />
                    <p className="text-xs text-ink-secondary">
                      <span className="text-ink-tertiary">Outcome: </span>{event.outcome}
                    </p>
                  </div>
                )}
                {event.negative_effect && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" strokeWidth={1.5} />
                    <p className="text-xs text-ink-secondary">
                      <span className="text-ink-tertiary">Downside: </span>{event.negative_effect}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => setEditing(true)}
                  className="font-mono text-[10px] text-ink-tertiary underline underline-offset-2 hover:text-ink-secondary"
                >
                  edit outcome
                </button>
              </div>
            )}

            {/* Outcome form — shown when no outcome yet, or editing */}
            {(!hasOutcome || editing) && (
              <OutcomeForm
                event={event}
                mint={mint}
                onSaved={() => { setExpanded(false); setEditing(false); onRefresh() }}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Add Event Form ────────────────────────────────────────────────────────────

const ALL_TAGS: ActionTag[] = [
  'incentives','rewards','emissions','liquidity','marketing',
  'listing','governance','unlock','treasury','partnership','burn','other',
]

function AddEventForm({ mint, onSaved }: { mint: string; onSaved: () => void }) {
  const [action, setAction]   = useState('')
  const [reason, setReason]   = useState('')
  const [date, setDate]       = useState(new Date().toISOString().slice(0, 10))
  const [tags, setTags]       = useState<ActionTag[]>([])
  const [saving, setSaving]   = useState(false)

  const toggleTag = (t: ActionTag) =>
    setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])

  const save = async () => {
    if (!action.trim()) return
    setSaving(true)
    try {
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_event', mint,
          event: {
            action_taken: action.trim(),
            reason: reason.trim(),
            date,
            tags: tags.length ? tags : ['other'],
            metrics_before: {},
            confidence: 0.7,
          },
        }),
      })
      setAction(''); setReason(''); setTags([])
      onSaved()
    } finally { setSaving(false) }
  }

  return (
    <div className="card-sm space-y-3 p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">Log a Decision</p>
      <input
        className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-ink placeholder-ink-tertiary outline-none focus:border-brand"
        placeholder="What action was taken? e.g. Increased staking rewards by 20%"
        value={action}
        onChange={(e) => setAction(e.target.value)}
      />
      <input
        className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-ink placeholder-ink-tertiary outline-none focus:border-brand"
        placeholder="Why? (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <label className="font-mono text-[10px] text-ink-tertiary shrink-0">Date</label>
        <input
          type="date"
          className="rounded-lg border border-surface-border bg-surface px-3 py-1.5 font-mono text-xs text-ink outline-none focus:border-brand"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div>
        <p className="mb-1.5 font-mono text-[10px] text-ink-tertiary">Category</p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_TAGS.map((t) => (
            <button
              key={t}
              onClick={() => toggleTag(t)}
              className={clsx(
                'rounded border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-colors',
                tags.includes(t) ? TAG_COLORS[t] : 'border-surface-border text-ink-tertiary hover:border-surface-muted hover:text-ink-secondary'
              )}
            >{TAG_LABELS[t]}</button>
          ))}
        </div>
      </div>
      <button
        onClick={save}
        disabled={saving || !action.trim()}
        className="flex items-center gap-1.5 rounded-lg border border-brand bg-brand-dim px-4 py-2 font-mono text-xs text-brand transition-colors hover:bg-brand/20 disabled:opacity-40"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        {saving ? 'Saving…' : 'Log Decision'}
      </button>
    </div>
  )
}

// ── Goals Panel ───────────────────────────────────────────────────────────────

const ALL_GOALS: GoalType[] = [
  'growth','sustainability','retention','price_stability','decentralization','liquidity_depth',
]

function GoalsPanel({ mint, symbol, goals, onSaved }: {
  mint: string; symbol: string; goals: FounderGoals | null; onSaved: () => void
}) {
  const [primary, setPrimary]     = useState<GoalType>(goals?.primary ?? 'growth')
  const [secondary, setSecondary] = useState<GoalType[]>(goals?.secondary ?? [])
  const [notes, setNotes]         = useState(goals?.notes ?? '')
  const [saving, setSaving]       = useState(false)

  const toggleSecondary = (g: GoalType) => {
    if (g === primary) return
    setSecondary((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])
  }

  const save = async () => {
    setSaving(true)
    try {
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_goals', mint, symbol,
          goals: { primary, secondary: secondary.filter((g) => g !== primary), notes },
        }),
      })
      onSaved()
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">Primary Goal</p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_GOALS.map((g) => (
            <button
              key={g}
              onClick={() => { setPrimary(g); setSecondary((s) => s.filter((x) => x !== g)) }}
              className={clsx(
                'rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors',
                g === primary
                  ? 'border-brand bg-brand-dim text-brand'
                  : 'border-surface-border text-ink-secondary hover:border-surface-muted hover:text-ink'
              )}
            >{GOAL_LABELS[g]}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">Secondary Goals</p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_GOALS.filter((g) => g !== primary).map((g) => (
            <button
              key={g}
              onClick={() => toggleSecondary(g)}
              className={clsx(
                'rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors',
                secondary.includes(g)
                  ? 'border-brand/50 bg-brand-dim text-brand/80'
                  : 'border-surface-border text-ink-tertiary hover:border-surface-muted hover:text-ink-secondary'
              )}
            >{GOAL_LABELS[g]}</button>
          ))}
        </div>
      </div>
      <input
        className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-ink placeholder-ink-tertiary outline-none focus:border-brand"
        placeholder="Notes on current priorities or constraints…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-1.5 rounded-lg border border-brand bg-brand-dim px-4 py-2 font-mono text-xs text-brand transition-colors hover:bg-brand/20 disabled:opacity-40"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5" />}
        {saving ? 'Saving…' : 'Save Goals'}
      </button>
    </div>
  )
}

// ── AI Patterns Panel ────────────────────────────────────────────────────────

type PatternType = 'risk' | 'strength' | 'warning' | 'opportunity'

interface AIPattern {
  title: string
  insight: string
  type: PatternType
  confidence: number
}

interface AnalysisResult {
  patterns: AIPattern[]
  summary: string | null
  event_count?: number
  message?: string
  error?: string
}

const PATTERN_TYPE_CONFIG: Record<PatternType, {
  icon: React.FC<{ className?: string; strokeWidth?: number }>
  color: string
  label: string
}> = {
  strength:    { icon: TrendingUp,    color: 'text-positive', label: 'Strength'    },
  opportunity: { icon: Sparkles,      color: 'text-brand',    label: 'Opportunity' },
  warning:     { icon: AlertTriangle, color: 'text-warn',     label: 'Warning'     },
  risk:        { icon: AlertTriangle, color: 'text-negative', label: 'Risk'        },
}

function PatternsPanel({ mint, eventCount }: { mint: string; eventCount: number }) {
  const [result, setResult]     = useState<AnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [ran, setRan]           = useState(false)

  const analyze = async () => {
    setAnalyzing(true)
    try {
      const res = await fetch('/api/memory/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mint }),
      })
      const json = await res.json()
      setResult(json)
      setRan(true)
    } catch {
      setResult({ patterns: [], summary: null, error: 'Analysis failed. Try again.' })
    } finally {
      setAnalyzing(false)
    }
  }

  const withOutcomes = eventCount  // approximate — server filters

  return (
    <div className="space-y-4">
      {/* Run analysis CTA */}
      {!ran && (
        <div className="rounded-xl border border-dashed border-brand-border bg-brand-dim p-6 text-center">
          <Brain className="mx-auto mb-3 h-8 w-8 text-brand" strokeWidth={1} />
          <p className="mb-1 text-sm font-medium text-ink">AI Pattern Analysis</p>
          <p className="mb-4 text-xs text-ink-secondary">
            Claude will study your {eventCount} logged decision{eventCount !== 1 ? 's' : ''} and surface real strategic patterns — not just summaries of your words.
          </p>
          <button
            onClick={analyze}
            disabled={analyzing || withOutcomes === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-brand bg-brand-dim px-5 py-2.5 font-mono text-xs text-brand transition-colors hover:bg-brand/20 disabled:opacity-40"
          >
            {analyzing
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing decisions…</>
              : <><Sparkles className="h-3.5 w-3.5" /> Run Analysis</>
            }
          </button>
          {withOutcomes === 0 && (
            <p className="mt-3 text-xs text-ink-tertiary">Add outcomes to your decisions first.</p>
          )}
        </div>
      )}

      {/* Loading state */}
      {analyzing && (
        <div className="flex flex-col items-center gap-3 py-10">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
          <p className="font-mono text-xs text-ink-tertiary">Reading your token history…</p>
        </div>
      )}

      {/* Results */}
      {ran && result && !analyzing && (
        <>
          {/* Overall summary */}
          {result.summary && (
            <div className="rounded-lg border border-surface-border bg-surface-overlay p-4">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">Strategic Read</p>
                {(result as AnalysisResult & { source?: string }).source === 'local' && (
                  <span className="font-mono text-[9px] text-ink-tertiary">
                    rule-based · add <code className="text-ink-tertiary">ANTHROPIC_API_KEY</code> for full AI
                  </span>
                )}
                {(result as AnalysisResult & { source?: string }).source === 'ai' && (
                  <span className="inline-flex items-center gap-1 font-mono text-[9px] text-brand">
                    <Sparkles className="h-2.5 w-2.5" /> AI analysis
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-ink">{result.summary}</p>
            </div>
          )}

          {/* Error */}
          {result.error && (
            <div className="rounded-lg border border-negative/30 bg-negative-dim p-4">
              <p className="text-sm text-negative">{result.error}</p>
            </div>
          )}

          {/* No outcomes message */}
          {result.message && (
            <div className="rounded-xl border border-dashed border-surface-border p-8 text-center">
              <p className="text-sm text-ink-tertiary">{result.message}</p>
            </div>
          )}

          {/* Pattern cards */}
          {result.patterns.map((p, i) => {
            const cfg = PATTERN_TYPE_CONFIG[p.type] ?? PATTERN_TYPE_CONFIG.warning
            const Icon = cfg.icon
            return (
              <div key={i} className="card p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Icon className={clsx('h-3.5 w-3.5 shrink-0', cfg.color)} strokeWidth={1.5} />
                  <span className={clsx('font-mono text-[10px] uppercase tracking-wider', cfg.color)}>
                    {cfg.label}
                  </span>
                </div>
                <p className="mb-3 text-sm font-medium text-ink">{p.title}</p>
                <p className="text-sm leading-relaxed text-ink-secondary">{p.insight}</p>
                <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-3">
                  <span className="font-mono text-[10px] text-ink-tertiary">AI confidence</span>
                  <ConfidenceBar value={p.confidence} />
                </div>
              </div>
            )
          })}

          {/* Re-run button */}
          <button
            onClick={analyze}
            disabled={analyzing}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-surface-border py-2 font-mono text-[10px] text-ink-tertiary transition-colors hover:border-surface-muted hover:text-ink-secondary"
          >
            <Sparkles className="h-3 w-3" />
            Re-run analysis
          </button>
        </>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

type Tab = 'timeline' | 'patterns' | 'goals'

interface FounderMemoryProps {
  mint: string
  symbol: string
}

export function FounderMemory({ mint, symbol }: FounderMemoryProps) {
  const [memory, setMemory]   = useState<TokenMemory | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<Tab>('timeline')
  const [search, setSearch]   = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/memory?mint=${encodeURIComponent(mint)}`)
      if (res.ok) setMemory(await res.json())
    } finally { setLoading(false) }
  }, [mint])

  useEffect(() => { setLoading(true); load() }, [mint, load])

  const handleDelete = async (id: string) => {
    await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_event', mint, event_id: id }),
    })
    load()
  }

  const filtered = (memory?.events ?? [])
    .slice()
    .reverse()
    .filter((e) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        e.action_taken.toLowerCase().includes(q) ||
        e.outcome?.toLowerCase().includes(q) ||
        e.tags.some((t) => t.includes(q))
      )
    })

  const patterns = memory?.patterns ?? []
  const goals    = memory?.founder_goals ?? null

  const TAB_CONFIG: { id: Tab; label: string; icon: React.FC<{ className?: string; strokeWidth?: number }> }[] = [
    { id: 'timeline', label: 'Timeline',  icon: Clock     },
    { id: 'patterns', label: 'Patterns',  icon: Sparkles  },
    { id: 'goals',    label: 'Goals',     icon: Target    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-brand" strokeWidth={1.5} />
          <div>
            <h2 className="text-sm font-semibold text-ink">Founder Memory</h2>
            <p className="mt-0.5 text-xs text-ink-secondary">
              Historical context that makes every AI output smarter
            </p>
          </div>
        </div>
        {goals && (
          <div className="flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-dim px-3 py-1">
            <Target className="h-3 w-3 text-brand" strokeWidth={1.5} />
            <span className="font-mono text-[10px] text-brand">
              Goal: {GOAL_LABELS[goals.primary]}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-lg border border-surface-border bg-surface-overlay p-1">
        {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 font-mono text-xs transition-colors',
              tab === id
                ? 'bg-surface-raised text-ink'
                : 'text-ink-tertiary hover:text-ink-secondary'
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
            {label}
            {id === 'timeline' && (memory?.events.length ?? 0) > 0 && (
              <span className="ml-0.5 rounded-full bg-surface-muted px-1.5 py-0.5 font-mono text-[9px] text-ink-tertiary">
                {memory!.events.length}
              </span>
            )}
            {id === 'patterns' && patterns.length > 0 && (
              <span className="ml-0.5 rounded-full bg-brand-dim px-1.5 py-0.5 font-mono text-[9px] text-brand">
                {patterns.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-ink-tertiary" />
        </div>
      ) : (

        <>
          {/* ── TIMELINE TAB ─────────────────────────────────────────────── */}
          {tab === 'timeline' && (
            <div className="space-y-4">
              {/* Add event toggle */}
              <button
                onClick={() => setShowAdd((s) => !s)}
                className="flex items-center gap-2 rounded-lg border border-dashed border-surface-border px-4 py-2.5 font-mono text-xs text-ink-tertiary transition-colors hover:border-brand hover:text-brand"
              >
                <Plus className="h-3.5 w-3.5" />
                {showAdd ? 'Cancel' : 'Log a decision or action'}
              </button>

              {showAdd && (
                <AddEventForm mint={mint} onSaved={() => { setShowAdd(false); load() }} />
              )}

              {/* Search */}
              {filtered.length > 0 || search ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-tertiary" />
                  <input
                    className="w-full rounded-lg border border-surface-border bg-surface-overlay py-2 pl-9 pr-3 text-sm text-ink placeholder-ink-tertiary outline-none focus:border-brand"
                    placeholder="Search decisions…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              ) : null}

              {/* Timeline */}
              {filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-surface-border p-8 text-center">
                  <Clock className="mx-auto mb-3 h-7 w-7 text-ink-tertiary" strokeWidth={1} />
                  <p className="text-sm text-ink-tertiary">No decisions recorded yet.</p>
                  <p className="mt-1 text-xs text-ink-tertiary">
                    Log your first action to start building memory.
                  </p>
                </div>
              ) : (
                <div className="relative space-y-3">
                  {/* Vertical line */}
                  <div className="absolute left-[4.5px] top-2 bottom-2 w-px bg-surface-border" />
                  {filtered.map((ev) => (
                    <EventCard key={ev.id} event={ev} mint={mint} onDelete={handleDelete} onRefresh={load} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PATTERNS TAB ─────────────────────────────────────────────── */}
          {tab === 'patterns' && (
            <PatternsPanel mint={mint} eventCount={memory?.events.length ?? 0} />
          )}

          {/* ── GOALS TAB ────────────────────────────────────────────────── */}
          {tab === 'goals' && (
            <GoalsPanel
              mint={mint}
              symbol={symbol}
              goals={goals}
              onSaved={load}
            />
          )}
        </>
      )}
    </div>
  )
}
