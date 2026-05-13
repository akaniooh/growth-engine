import { NextRequest, NextResponse } from 'next/server'
import { MOCK_DATA } from '@/lib/data'
import { buildInsights, buildActions, buildTweets } from '@/lib/classify'
import { getTokenOverview } from '@/lib/birdeye'

export async function POST(req: NextRequest) {
  const { mint, pcts } = await req.json()

  if (!mint || !pcts) {
    return NextResponse.json({ error: 'mint and pcts required' }, { status: 400 })
  }

  // Get current market data for accurate insights
  const birdeyeKey = process.env.BIRDEYE_API_KEY
  let symbol = mint.slice(0, 4).toUpperCase()
  let priceUp = true, priceChange = 0, volumeUp = true, volumeChange = 0
  let holders = 0, volume = '$0'

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
    networkActiveUsers: pcts.activeCount,
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

  return NextResponse.json({ insights, actions, tweets })
}
