import { NextRequest, NextResponse } from 'next/server'
import {
  loadMemory,
  addEvent,
  updateEventOutcome,
  setFounderGoals,
  buildMemoryContext,
  detectPatterns,
  FounderGoals,
  MemoryEvent,
  ActionTag,
} from '@/lib/memory'

// GET /api/memory?mint=xxx            → load full memory for token
// GET /api/memory?mint=xxx&context=1  → load context string for AI injection
export async function GET(req: NextRequest) {
  const mint = req.nextUrl.searchParams.get('mint')?.trim()
  if (!mint) return NextResponse.json({ error: 'mint required' }, { status: 400 })

  const mem = loadMemory(mint)

  if (req.nextUrl.searchParams.get('context')) {
    const tags = (req.nextUrl.searchParams.get('tags') ?? '').split(',').filter(Boolean) as ActionTag[]
    const context = buildMemoryContext(mint, tags)
    const patterns = detectPatterns(mem.events)
    return NextResponse.json({ context, patterns, event_count: mem.events.length })
  }

  const patterns = detectPatterns(mem.events)
  return NextResponse.json({ ...mem, patterns })
}

// POST /api/memory — multiple actions via `action` field
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, mint } = body

  if (!mint) return NextResponse.json({ error: 'mint required' }, { status: 400 })

  // ── Save a new memory event ───────────────────────────────────────────────
  if (action === 'add_event') {
    const { event } = body as { event: Omit<MemoryEvent, 'id'>; mint: string }
    if (!event) return NextResponse.json({ error: 'event required' }, { status: 400 })
    const saved = addEvent(mint, event)
    return NextResponse.json({ ok: true, event: saved })
  }

  // ── Update outcome on an existing event ───────────────────────────────────
  if (action === 'update_outcome') {
    const { event_id, patch } = body
    if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 })
    updateEventOutcome(mint, event_id, patch)
    return NextResponse.json({ ok: true })
  }

  // ── Save/update founder goals ─────────────────────────────────────────────
  if (action === 'set_goals') {
    const { symbol, goals } = body as { symbol: string; goals: FounderGoals }
    if (!goals) return NextResponse.json({ error: 'goals required' }, { status: 400 })
    setFounderGoals(mint, symbol ?? '', goals)
    return NextResponse.json({ ok: true })
  }

  // ── Delete an event ───────────────────────────────────────────────────────
  if (action === 'delete_event') {
    const { event_id } = body
    const mem = loadMemory(mint)
    mem.events = mem.events.filter((e) => e.id !== event_id)
    const { saveMemory } = await import('@/lib/memory')
    saveMemory(mem)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
}
