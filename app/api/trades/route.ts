import { NextRequest, NextResponse } from 'next/server'
import { getRecentTrades, computeHeatmap } from '@/lib/birdeye'

export async function POST(req: NextRequest) {
  const { mint } = await req.json()
  if (!mint) return NextResponse.json({ error: 'mint required' }, { status: 400 })

  const birdeyeKey = process.env.BIRDEYE_API_KEY
  if (!birdeyeKey) {
    return NextResponse.json({ error: 'BIRDEYE_API_KEY not configured' }, { status: 503 })
  }

  try {
    const trades  = await getRecentTrades(mint, birdeyeKey, 100)
    const heatmap = computeHeatmap(trades)

    return NextResponse.json({
      trades:     trades.slice(0, 30),  // return latest 30 for display
      heatmap:    heatmap.matrix,
      peakDay:    heatmap.peakDay,
      peakHour:   heatmap.peakHour,
      buyCount:   heatmap.buyCount,
      sellCount:  heatmap.sellCount,
      totalVolume: heatmap.totalVolume,
      buySellRatio: heatmap.buyCount / Math.max(1, heatmap.buyCount + heatmap.sellCount),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
