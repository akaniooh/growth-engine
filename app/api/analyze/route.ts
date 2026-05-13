import { NextRequest, NextResponse } from 'next/server'
import { MOCK_DATA, TokenData } from '@/lib/data'
import { getTokenMetadata } from '@/lib/helius'
import { getTokenOverview, getOHLCV } from '@/lib/birdeye'
import { buildInsights, buildActions, buildTweets } from '@/lib/classify'

const SOLANA_ADDR_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

function fmtUSD(n: number): string {
  if (!n || n === 0) return '$0.00'
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3)  return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}

function fmtPrice(n: number): string {
  if (!n || n === 0) return '$0.00'
  if (n >= 1)         return `$${n.toFixed(3)}`
  if (n >= 0.01)      return `$${n.toFixed(4)}`
  if (n >= 0.000001)  return `$${n.toFixed(7)}`
  return `$${n.toPrecision(4)}`
}

export async function POST(req: NextRequest) {
  let query = ''
  try {
    const body = await req.json()
    query = body?.query ?? ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const trimmed = query.trim()
  if (!trimmed) return NextResponse.json({ error: 'Query required' }, { status: 400 })

  // Demo tokens
  const demoKey = Object.keys(MOCK_DATA).find((k) => trimmed.toUpperCase() === k)
  if (demoKey) {
    return NextResponse.json({ data: { ...MOCK_DATA[demoKey], mint: demoKey }, source: 'demo' })
  }

  if (!SOLANA_ADDR_RE.test(trimmed)) {
    return NextResponse.json(
      { error: `"${trimmed}" is not a valid Solana token address.` },
      { status: 400 }
    )
  }

  const heliusKey  = process.env.HELIUS_API_KEY
  const birdeyeKey = process.env.BIRDEYE_API_KEY

  if (!heliusKey || heliusKey === 'your_helius_api_key_here') {
    return NextResponse.json(
      { error: 'HELIUS_API_KEY not configured.', setup: 'Add HELIUS_API_KEY to .env.local — get one free at https://helius.dev' },
      { status: 503 }
    )
  }

  try {
    const [meta, overview, ohlcv] = await Promise.all([
      getTokenMetadata(trimmed, heliusKey).catch(() => null),
      birdeyeKey ? getTokenOverview(trimmed, birdeyeKey).catch(() => null) : Promise.resolve(null),
      birdeyeKey ? getOHLCV(trimmed, birdeyeKey, 7).catch(() => []) : Promise.resolve([]),
    ])

    if (!overview && !meta) {
      return NextResponse.json(
        { error: 'Token not found. Verify this is a valid SPL token mint on Solana mainnet.' },
        { status: 404 }
      )
    }

    console.log(`[analyze] overview: price=${overview?.price} mc=${overview?.mc} holder=${overview?.holder}`)
    console.log(`[analyze] ohlcv items: ${Array.isArray(ohlcv) ? ohlcv.length : 0}`)
    console.log(`[analyze] meta: supply=${meta?.supply} decimals=${meta?.decimals}`)

    const symbol = (overview?.symbol ?? meta?.symbol ?? trimmed.slice(0, 4).toUpperCase()).trim()
    const name   = (overview?.name   ?? meta?.name   ?? symbol).trim()

    const price       = overview?.price ?? 0
    const priceChange = overview?.priceChange24hPercent ?? 0
    const priceUp     = priceChange >= 0
    const vol24h      = overview?.v24hUSD ?? 0
    const volChange   = overview?.v24hChangePercent ?? 0
    const volumeUp    = volChange >= 0
    const holders     = overview?.holder ?? 0
    const activeT     = overview?.uniqueWallet24h ?? 0

    // Market cap: prefer Birdeye's mc field directly
    // Birdeye may call it 'mc', 'marketCap', or 'market_cap' depending on version
    const rawOverview = overview as unknown as Record<string, number>
    const marketCap = rawOverview?.mc
      ?? rawOverview?.marketCap
      ?? rawOverview?.market_cap
      ?? (price > 0 && meta?.supply ? price * meta.supply : 0)

    console.log(`[analyze] marketCap computed: ${marketCap}`)

    // 7-day volume series (in $M)
    const vol7d = Array.isArray(ohlcv) && ohlcv.length > 0
      ? ohlcv.slice(-7).map((c) => Math.max(0, parseFloat((c.v / 1e6).toFixed(4))))
      : [0, 0, 0, 0, 0, 0, parseFloat((vol24h / 1e6).toFixed(4))]

    // Circulating supply: from metadata or derived from mc/price
    const circulatingSupply = (meta?.supply && meta.supply > 0)
      ? meta.supply
      : (marketCap > 0 && price > 0 ? marketCap / price : 0)

        // Build 7-day market cap series from price history.
    // Prefer relative scaling from closes so MC moves even when supply metadata is imperfect.
    let marketCap7d: number[]
    const buildScaledSeries = (closes: number[]): number[] | null => {
      if (!marketCap || marketCap <= 0 || closes.length < 2) return null
      const lastClose = closes[closes.length - 1]
      if (!lastClose || lastClose <= 0) return null
      const varied = new Set(closes.map((v) => v.toFixed(12))).size > 1
      if (!varied) return null
      return closes.map((c) => Math.max(0, Math.round(marketCap * (c / lastClose))))
    }

    const dailyCloses = Array.isArray(ohlcv) ? ohlcv.slice(-7).map((p) => p.c).filter((v) => v > 0) : []
    const scaledDaily = buildScaledSeries(dailyCloses)

    if (scaledDaily) {
      marketCap7d = scaledDaily
      console.log(`[analyze] marketCap7d from daily closes: min=${Math.min(...marketCap7d)} max=${Math.max(...marketCap7d)}`)
    } else {
      // Retry with hourly candles to derive day-end closes when daily feed is flat or sparse
      try {
        const ohlcvHourly = birdeyeKey ? await getOHLCV(trimmed, birdeyeKey, 7, '1H').catch(() => []) : []
        const byDay = new Map<string, number>()
        for (const p of ohlcvHourly) {
          const key = new Date(p.unixTime * 1000).toISOString().slice(0, 10)
          byDay.set(key, p.c)
        }
        const dayCloses = Array.from(byDay.values()).slice(-7).filter((v) => v > 0)
        const scaledHourly = buildScaledSeries(dayCloses)
        if (scaledHourly) {
          marketCap7d = scaledHourly
          console.log(`[analyze] marketCap7d from hourly-derived closes: min=${Math.min(...marketCap7d)} max=${Math.max(...marketCap7d)}`)
        } else if (marketCap > 0) {
          marketCap7d = Array(7).fill(marketCap)
          console.warn('[analyze] No varying close history — flat mc line')
        } else {
          marketCap7d = Array(7).fill(0)
        }
      } catch {
        marketCap7d = marketCap > 0 ? Array(7).fill(marketCap) : Array(7).fill(0)
      }
    }

    const heatPeak = 'See holder data'
    const whalePct = 0, dormantPct = 0, newPct = 0

    const data: TokenData = {
      name, symbol, mint: trimmed,
      holders,
      holdersChange: holders > 0 ? `${holders.toLocaleString()}` : '—',
      holdersUp: true,
      volume: fmtUSD(vol24h),
      volumeChange: `${volumeUp ? '+' : ''}${volChange.toFixed(1)}%`,
      volumeUp,
      price: fmtPrice(price),
      priceChange: `${priceUp ? '+' : ''}${priceChange.toFixed(2)}%`,
      priceUp,
      activeTraders: activeT,
      activeTradersChange: `${activeT > 0 ? activeT.toLocaleString() : '—'}`,
      activeTradersUp: true,
      wallets: [],
      distribution: [
        { label: 'Whales',  pct: 0,   color: '#4f6ef7' },
        { label: 'Active',  pct: 0,   color: '#f0f0f4' },
        { label: 'New',     pct: 0,   color: '#8a8a9a' },
        { label: 'Dormant', pct: 100, color: '#2a2a30' },
      ],
      volume7d: vol7d,
      marketCap,
      marketCap7d,
      heatPeak,
      insights: buildInsights({ symbol, whalePct, activePct: activeT > 0 ? 100 : 0, newPct, dormantPct, priceUp, priceChange, volumeUp, volumeChange: volChange, heatPeak, networkActiveUsers: activeT }),
      actions:  buildActions({ symbol, whalePct, dormantPct, newPct, volumeUp, heatPeak }),
      tweets:   buildTweets({ symbol, holders, volume: fmtUSD(vol24h), priceUp, priceChange, volumeUp, dormantPct, whalePct, heatPeak }),
    }

    return NextResponse.json({ data, source: 'live' })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[analyze] error:', message)
    return NextResponse.json({ error: `Failed: ${message}` }, { status: 500 })
  }
}
