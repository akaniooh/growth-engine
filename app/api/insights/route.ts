import { NextRequest, NextResponse } from 'next/server'
import { MOCK_DATA } from '@/lib/data'
import { buildInsights, buildActions, buildTweets } from '@/lib/classify'
import { getTokenOverview } from '@/lib/birdeye'
import { buildMemoryContext, detectPatterns, loadMemory } from '@/lib/memory'
import { cleanEnv } from '@/lib/env'

export async function POST(req: NextRequest) {
  let mint = '', pcts, clientOverview: {
    priceChange?: number; priceUp?: boolean; volumeChange?: number; volumeUp?: boolean
    holders?: number; volume?: string; activeTraders?: number; symbol?: string
  } | undefined
  try {
    const body = await req.json()
    mint = body?.mint
    pcts = body?.pcts
    clientOverview = body?.overview
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!mint || !pcts) {
    return NextResponse.json({ error: 'mint and pcts required' }, { status: 400 })
  }

  // Get current market data for accurate insights.
  // Prefer overview data the client already fetched via /api/analyze —
  // avoids a duplicate Birdeye call that can trip the free-tier burst limit
  // when both requests land on separate serverless instances.
  const birdeyeKey = cleanEnv(process.env.BIRDEYE_API_KEY)
  let symbol = mint.slice(0, 4).toUpperCase()
  let priceUp = true, priceChange = 0, volumeUp = true, volumeChange = 0
  let holders = 0, volume = '$0', networkActiveUsers = 0

  // Check demo tokens
  const demoKey = Object.keys(MOCK_DATA).find((k) => mint === k || mint.toUpperCase() === k)
  if (demoKey) {
    const demo = MOCK_DATA[demoKey]
    symbol      = demo.symbol
    priceUp     = demo.priceUp
    priceChange = parseFloat(demo.priceChange.replace('%','').replace('+',''))
    volumeUp    = demo.volumeUp
    volumeChange = parseFloat(demo.volumeChange.replace('%','').replace('+',''))
    holders     = demo.holders
    volume      = demo.volume
    networkActiveUsers = demo.activeTraders
  } else if (clientOverview) {
    // Client already has fresh data from /api/analyze — use it directly,
    // no Birdeye call needed.
    symbol       = clientOverview.symbol || symbol
    priceChange  = parseFloat(String(clientOverview.priceChange ?? '0').replace('%', '').replace('+', ''))
    priceUp      = clientOverview.priceUp ?? priceChange >= 0
    volumeChange = parseFloat(String(clientOverview.volumeChange ?? '0').replace('%', '').replace('+', ''))
    volumeUp     = clientOverview.volumeUp ?? volumeChange >= 0
    holders      = clientOverview.holders ?? 0
    volume       = clientOverview.volume ?? '$0'
    networkActiveUsers = clientOverview.activeTraders ?? 0
  } else if (birdeyeKey) {
    try {
      const overview = await getTokenOverview(mint, birdeyeKey)
      if (overview) {
        symbol       = overview.symbol || symbol
        priceChange  = overview.priceChange24hPercent
        priceUp      = priceChange >= 0
        volumeChange = overview.v24hChangePercent
        volumeUp     = volumeChange >= 0
        holders      = overview.holder
        networkActiveUsers = overview.uniqueWallet24h
        const vol    = overview.v24hUSD
        volume       = vol >= 1e6 ? `$${(vol/1e6).toFixed(1)}M` : `$${(vol/1e3).toFixed(0)}K`
      }
    } catch { /* use defaults */ }
  }

  const heatPeak = 'From on-chain analysis'

  const insights = buildInsights({
    symbol,
    whalePct:      pcts.whale,
    activePct:     pcts.active,
    newPct:        pcts.new,
    dormantPct:    pcts.dormant,
    priceUp,
    priceChange,
    volumeUp,
    volumeChange,
    heatPeak,
    // Enriched count data from top-20 holder analysis
    whaleCount:    pcts.whaleCount,
    activeCount:   pcts.activeCount,
    newCount:      pcts.newCount,
    totalSampled:  pcts.totalSampled,
    networkActiveUsers: networkActiveUsers || pcts.activeCount,
  })

  const actions = buildActions({
    symbol,
    whalePct:   pcts.whale,
    dormantPct: pcts.dormant,
    newPct:     pcts.new,
    volumeUp,
    heatPeak,
  })

  const tweets = buildTweets({
    symbol,
    holders,
    volume,
    priceUp,
    priceChange,
    volumeUp,
    dormantPct:  pcts.dormant,
    whalePct:    pcts.whale,
    heatPeak,
  })

  // ── Founder Memory: inject context into outputs ──────────────────────────
  const memContext = buildMemoryContext(mint, [])
  const mem = loadMemory(mint)
  const patterns = detectPatterns(mem.events)

  // Prepend memory context note to first insight if relevant history exists
  const memoryEnrichedInsights = memContext
    ? insights.map((ins, i) => {
        if (i !== 0) return ins
        return {
          ...ins,
          memoryContext: memContext,
        }
      })
    : insights

  return NextResponse.json({
    insights: memoryEnrichedInsights,
    actions,
    tweets,
    // Memory data passed alongside for UI to render
    memory: {
      has_context: memContext.length > 0,
      event_count: mem.events.length,
      founder_goals: mem.founder_goals,
      patterns: patterns.slice(0, 3),
    },
  })
}
