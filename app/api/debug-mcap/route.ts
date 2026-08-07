import { NextRequest, NextResponse } from 'next/server'
import { getOHLCV, getTokenOverview } from '@/lib/birdeye'
import { cleanEnv } from '@/lib/env'

export async function GET(req: NextRequest) {
  const mint = req.nextUrl.searchParams.get('mint')?.trim()
  if (!mint) return NextResponse.json({ error: 'mint query param required' }, { status: 400 })

  const key = cleanEnv(process.env.BIRDEYE_API_KEY)
  if (!key) return NextResponse.json({ error: 'BIRDEYE_API_KEY not configured' }, { status: 503 })

  try {
    const [overview, daily, hourly] = await Promise.all([
      getTokenOverview(mint, key),
      getOHLCV(mint, key, 7, '1D'),
      getOHLCV(mint, key, 7, '1H'),
    ])

    const byDay = new Map<string, number>()
    for (const p of hourly) {
      const day = new Date(p.unixTime * 1000).toISOString().slice(0, 10)
      byDay.set(day, p.c)
    }

    const dailyCloses = daily.slice(-7).map((p) => ({ t: p.unixTime, close: p.c }))
    const hourlyDayCloses = Array.from(byDay.entries()).slice(-7).map(([day, close]) => ({ day, close }))

    return NextResponse.json({
      mint,
      marketCapNow: overview?.mc ?? 0,
      priceNow: overview?.price ?? 0,
      uniqueWallet24h: overview?.uniqueWallet24h ?? 0,
      dailyCloses,
      hourlyDayCloses,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
