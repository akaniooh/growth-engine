/**
 * FOUNDER MEMORY — Storage Engine
 *
 * Lightweight JSON-file memory store. No external DB needed.
 * One file per token mint → `/tmp/memory-{mint}.json`
 * (Replace /tmp with a persistent volume path in production)
 *
 * Schema mirrors the spec exactly:
 *   action_taken, reason, date, metrics_before, metrics_after,
 *   outcome, confidence, tags, founder_goals
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

// ── Types ────────────────────────────────────────────────────────────────────

export type GoalType =
  | 'growth'
  | 'sustainability'
  | 'retention'
  | 'price_stability'
  | 'decentralization'
  | 'liquidity_depth'

export type ActionTag =
  | 'incentives'
  | 'emissions'
  | 'liquidity'
  | 'marketing'
  | 'listing'
  | 'governance'
  | 'unlock'
  | 'treasury'
  | 'rewards'
  | 'partnership'
  | 'burn'
  | 'other'

export interface MetricSnapshot {
  holders?: number
  holderChange7d?: number    // % change
  retention7d?: number       // % retained
  volume24h?: number
  price?: number
  marketCap?: number
  whalePct?: number
  dormantPct?: number
  sellPressure?: 'high' | 'medium' | 'low'
}

export interface MemoryEvent {
  id: string                    // uuid-like, generated on save
  action_taken: string          // human-readable description
  reason: string                // why it was done
  date: string                  // ISO date "2026-03-01"
  metrics_before: MetricSnapshot
  metrics_after?: MetricSnapshot // filled in retrospectively
  outcome?: string              // summary of what happened
  negative_effect?: string      // any downsides observed
  confidence: number            // 0–1, how reliable this record is
  tags: ActionTag[]
}

export interface FounderGoals {
  primary: GoalType
  secondary: GoalType[]
  notes?: string
}

export interface TokenMemory {
  mint: string
  symbol: string
  founder_goals: FounderGoals | null
  events: MemoryEvent[]
  updated_at: string
}

// ── Storage path ─────────────────────────────────────────────────────────────

const MEM_DIR = '/tmp'

function memPath(mint: string): string {
  // Sanitise mint to safe filename
  const safe = mint.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64)
  return join(MEM_DIR, `memory-${safe}.json`)
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export function loadMemory(mint: string): TokenMemory {
  const p = memPath(mint)
  if (existsSync(p)) {
    try {
      return JSON.parse(readFileSync(p, 'utf-8')) as TokenMemory
    } catch { /* corrupt file — reset */ }
  }
  return { mint, symbol: '', founder_goals: null, events: [], updated_at: new Date().toISOString() }
}

export function saveMemory(mem: TokenMemory): void {
  mem.updated_at = new Date().toISOString()
  writeFileSync(memPath(mem.mint), JSON.stringify(mem, null, 2), 'utf-8')
}

export function addEvent(mint: string, event: Omit<MemoryEvent, 'id'>): MemoryEvent {
  const mem = loadMemory(mint)
  const full: MemoryEvent = {
    ...event,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  }
  mem.events.push(full)
  // Keep last 100 events
  if (mem.events.length > 100) mem.events = mem.events.slice(-100)
  saveMemory(mem)
  return full
}

export function updateEventOutcome(
  mint: string,
  eventId: string,
  patch: Partial<Pick<MemoryEvent, 'metrics_after' | 'outcome' | 'negative_effect' | 'confidence'>>
): void {
  const mem = loadMemory(mint)
  const ev = mem.events.find((e) => e.id === eventId)
  if (ev) Object.assign(ev, patch)
  saveMemory(mem)
}

export function setFounderGoals(mint: string, symbol: string, goals: FounderGoals): void {
  const mem = loadMemory(mint)
  mem.symbol = symbol
  mem.founder_goals = goals
  saveMemory(mem)
}

// ── Pattern Detection ─────────────────────────────────────────────────────────

export interface Pattern {
  pattern: string     // human-readable description
  confidence: number  // 0–1
  evidence: string[]  // event IDs that support it
}

export function detectPatterns(events: MemoryEvent[]): Pattern[] {
  const patterns: Pattern[] = []
  if (events.length < 2) return patterns

  // Pattern 1: Incentive / reward spikes followed by retention drops
  const incentiveEvents = events.filter((e) =>
    e.tags.some((t) => t === 'incentives' || t === 'rewards')
  )
  const retentionDropsAfterIncentives = incentiveEvents.filter((e) =>
    e.negative_effect?.toLowerCase().includes('retention') ||
    (e.metrics_after?.retention7d !== undefined &&
     e.metrics_before?.retention7d !== undefined &&
     e.metrics_after.retention7d < e.metrics_before.retention7d)
  )
  if (retentionDropsAfterIncentives.length >= 2) {
    patterns.push({
      pattern: `Reward spikes repeatedly improve short-term acquisition but reduce retention 2–3 weeks later (observed ${retentionDropsAfterIncentives.length}× across recorded history).`,
      confidence: Math.min(0.5 + retentionDropsAfterIncentives.length * 0.15, 0.95),
      evidence: retentionDropsAfterIncentives.map((e) => e.id),
    })
  }

  // Pattern 2: Liquidity actions outperforming marketing
  const liquidityEvents = events.filter((e) => e.tags.includes('liquidity'))
  const marketingEvents = events.filter((e) => e.tags.includes('marketing'))
  const liquidityPositive = liquidityEvents.filter((e) =>
    e.outcome?.toLowerCase().match(/retention|holder|growth|positive/)
  )
  const marketingPositive = marketingEvents.filter((e) =>
    e.outcome?.toLowerCase().match(/retention|holder|growth|positive/)
  )
  if (liquidityPositive.length > marketingPositive.length && liquidityEvents.length >= 2) {
    patterns.push({
      pattern: 'Liquidity campaigns have consistently generated better retention outcomes than marketing campaigns for this token.',
      confidence: 0.72,
      evidence: liquidityPositive.map((e) => e.id),
    })
  }

  // Pattern 3: Emissions reduction reducing sell pressure
  const emissionsEvents = events.filter((e) => e.tags.includes('emissions'))
  const emissionsLoweredSellPressure = emissionsEvents.filter((e) =>
    (e.metrics_after?.sellPressure === 'low' && e.metrics_before?.sellPressure !== 'low') ||
    e.outcome?.toLowerCase().includes('sell pressure')
  )
  if (emissionsLoweredSellPressure.length >= 1 && emissionsEvents.length >= 2) {
    patterns.push({
      pattern: 'Reducing emissions has historically lowered sell pressure, though acquisition slowed in subsequent weeks.',
      confidence: 0.65,
      evidence: emissionsLoweredSellPressure.map((e) => e.id),
    })
  }

  return patterns
}

// ── Context Injection ─────────────────────────────────────────────────────────
// Builds a concise context string for injecting into AI prompts

export function buildMemoryContext(mint: string, situationTags: ActionTag[]): string {
  const mem = loadMemory(mint)
  if (mem.events.length === 0 && !mem.founder_goals) return ''

  const lines: string[] = []

  if (mem.founder_goals) {
    lines.push(`Founder primary goal: ${mem.founder_goals.primary.replace(/_/g, ' ')}.`)
    if (mem.founder_goals.secondary.length > 0) {
      lines.push(`Secondary goals: ${mem.founder_goals.secondary.map((g) => g.replace(/_/g, ' ')).join(', ')}.`)
    }
  }

  // Find relevant past events (matching tags or recent)
  const relevant = mem.events
    .filter((e) =>
      e.tags.some((t) => situationTags.includes(t)) ||
      situationTags.length === 0
    )
    .slice(-5) // last 5 relevant

  if (relevant.length > 0) {
    lines.push('\nPast decisions and outcomes:')
    for (const ev of relevant) {
      const date = new Date(ev.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      let entry = `• ${date}: ${ev.action_taken}.`
      if (ev.outcome) entry += ` Outcome: ${ev.outcome}.`
      if (ev.negative_effect) entry += ` Downside: ${ev.negative_effect}.`
      lines.push(entry)
    }
  }

  const patterns = detectPatterns(mem.events)
  if (patterns.length > 0) {
    lines.push('\nDetected behavioral patterns:')
    patterns.slice(0, 2).forEach((p) => lines.push(`• ${p.pattern}`))
  }

  return lines.join('\n')
}
