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
  if (events.length === 0) return patterns

  const withDownside = events.filter((e) => !!e.negative_effect)
  const withPositive = events.filter((e) => !!e.outcome)
  const withOutcome  = events.filter((e) => e.outcome || e.negative_effect)

  // Pattern A: Same tag used 2+ times with outcome data — most common early pattern
  const tagMap = new Map<string, MemoryEvent[]>()
  for (const ev of events) {
    for (const tag of ev.tags) {
      if (!tagMap.has(tag)) tagMap.set(tag, [])
      tagMap.get(tag)!.push(ev)
    }
  }
  for (const [tag, tagEvents] of tagMap.entries()) {
    if (tagEvents.length < 2) continue
    const tagWithOutcome = tagEvents.filter((e) => e.outcome || e.negative_effect)
    if (tagWithOutcome.length === 0) continue
    const positives = tagWithOutcome.filter((e) => e.outcome).map((e) => e.outcome!)
    const negatives = tagWithOutcome.filter((e) => e.negative_effect).map((e) => e.negative_effect!)
    let summary = `You have used "${tag}" actions ${tagEvents.length} times.`
    if (positives.length > 0) summary += ` Positive results: ${positives.slice(0, 2).join('; ')}.`
    if (negatives.length > 0) summary += ` Downsides observed: ${negatives.slice(0, 2).join('; ')}.`
    patterns.push({
      pattern: summary,
      confidence: Math.min(0.4 + tagWithOutcome.length * 0.2, 0.9),
      evidence: tagWithOutcome.map((e) => e.id),
    })
  }

  // Pattern B: Same downside keyword recurring across 2+ events
  if (withDownside.length >= 2) {
    const keywords = ['retention', 'dump', 'sell', 'drop', 'whale', 'exit', 'churn', 'mercenary', 'pressure', 'slow']
    for (const kw of keywords) {
      const matching = withDownside.filter((e) => e.negative_effect!.toLowerCase().includes(kw))
      if (matching.length >= 2) {
        patterns.push({
          pattern: `"${kw}" has appeared as a downside in ${matching.length} separate decisions — this is a recurring risk pattern for this token.`,
          confidence: Math.min(0.45 + matching.length * 0.2, 0.9),
          evidence: matching.map((e) => e.id),
        })
      }
    }
  }

  // Pattern C: Which tag type has produced the most positive outcomes
  if (withPositive.length >= 2) {
    const tagPositive = new Map<string, number>()
    for (const ev of withPositive) {
      for (const tag of ev.tags) {
        tagPositive.set(tag, (tagPositive.get(tag) ?? 0) + 1)
      }
    }
    const sorted = Array.from(tagPositive.entries()).sort((a, b) => b[1] - a[1])
    if (sorted.length > 0 && sorted[0][1] >= 2) {
      const [bestTag, count] = sorted[0]
      patterns.push({
        pattern: `"${bestTag}" actions have produced the most positive recorded outcomes for this token (${count} of ${withPositive.length} successful decisions).`,
        confidence: Math.min(0.5 + count * 0.15, 0.88),
        evidence: withPositive.filter((e) => e.tags.includes(bestTag as ActionTag)).map((e) => e.id),
      })
    }
  }

  // Pattern D: Tradeoff — even 1 event with both sides is worth surfacing early
  if (patterns.length === 0 && withOutcome.length >= 1) {
    const tradeoffs = withOutcome.filter((e) => e.outcome && e.negative_effect)
    if (tradeoffs.length >= 1) {
      const ev = tradeoffs[0]
      patterns.push({
        pattern: `Your "${ev.action_taken}" decision showed a tradeoff: ${ev.outcome} — but also: ${ev.negative_effect}. Log more decisions with outcomes to detect deeper patterns.`,
        confidence: 0.55,
        evidence: [ev.id],
      })
    }
  }

  // Deduplicate and cap at 4
  const seen = new Set<string>()
  return patterns.filter((p) => {
    if (seen.has(p.pattern)) return false
    seen.add(p.pattern)
    return true
  }).slice(0, 4)
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
