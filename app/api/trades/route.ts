import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'

const HELIUS_BASE = 'https://api.helius.xyz'
const HELIUS_RPC  = 'https://mainnet.helius-rpc.com'

interface ParsedTrade {
  txHash:    string
  side:      'buy' | 'sell'
  price:     number
  volume:    number
  amount:    number
  source:    string
  blockTime: number
  from:      string
}

interface HeatmapResult {
  matrix:       number[][]
  peakDay:      string
  peakHour:     number
  buyCount:     number
  sellCount:    number
  totalVolume:  number
  buySellRatio: number
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function computeHeatmap(trades: ParsedTrade[]): HeatmapResult {
  const matrix: number[][] = Array.from({ length: 6 }, () => Array(7).fill(0))
  let buyCount = 0, sellCount = 0, totalVolume = 0

  for (const t of trades) {
    if (!t.blockTime) continue
    const d = new Date(t.blockTime * 1000)
    const day    = d.getUTCDay()
    const bucket = Math.min(5, Math.floor(d.getUTCHours() / 4))
    matrix[bucket][day]++
    if (t.side === 'buy') buyCount++; else sellCount++
    totalVolume += t.volume
  }

  const maxVal = Math.max(...matrix.flat(), 1)
  const normalized = matrix.map(row => row.map(v => v / maxVal))

  let peakDay = 'Mon', peakHour = 12, peakMax = 0
  matrix.forEach((row, hi) => {
    row.forEach((val, di) => {
      if (val > peakMax) { peakMax = val; peakDay = DAYS[di]; peakHour = hi * 4 + 2 }
    })
  })

  return {
    matrix: normalized, peakDay, peakHour,
    buyCount, sellCount, totalVolume,
    buySellRatio: buyCount / Math.max(1, buyCount + sellCount),
  }
}

// Parse a Helius enhanced transaction into a trade
function parseTx(tx: Record<string, unknown>, mint: string): ParsedTrade | null {
  try {
    const sig  = tx.signature as string
    const time = tx.timestamp as number
    const events = tx.events as Record<string, unknown> | undefined
    const swap   = events?.swap as Record<string, unknown> | undefined

    if (swap) {
      const nativeInput  = swap.nativeInput  as { mint?: string; amount?: number } | undefined
      const nativeOutput = swap.nativeOutput as { mint?: string; amount?: number } | undefined
      const tokenInputs  = (swap.tokenInputs  as Array<{mint: string; amount: number; userAccount?: string}>) || []
      const tokenOutputs = (swap.tokenOutputs as Array<{mint: string; amount: number; userAccount?: string}>) || []

      const inAmount = tokenInputs
        .filter((t) => t.mint === mint)
        .reduce((acc, t) => acc + (t.amount || 0), 0)
      const outAmount = tokenOutputs
        .filter((t) => t.mint === mint)
        .reduce((acc, t) => acc + (t.amount || 0), 0)

      const netAmount = outAmount - inAmount
      if (Math.abs(netAmount) <= 0) return null

      const side: 'buy' | 'sell' = netAmount > 0 ? 'buy' : 'sell'
      const amount = Math.abs(netAmount)

      const solIn = (nativeInput?.amount ?? 0) / 1e9
      const solOut = (nativeOutput?.amount ?? 0) / 1e9
      const solAmount = side === 'buy' ? solIn : solOut

      // Rough USD value: use SOL price estimate ~$150 as fallback
      const solPrice = 150
      const usdValue = solAmount * solPrice

      const feePayer = (tx.feePayer as string) ?? ''
      const source   = (tx.source   as string) ?? 'unknown'

      return {
        txHash:    sig,
        side,
        price:     amount > 0 ? usdValue / amount : 0,
        volume:    usdValue,
        amount,
        source,
        blockTime: time,
        from:      tokenInputs[0]?.userAccount ?? tokenOutputs[0]?.userAccount ?? feePayer,
      }
    }

    // Fallback: check accountData for token transfers
    const accountData = tx.accountData as Array<{account: string; tokenBalanceChanges?: Array<{mint: string; rawTokenAmount: {tokenAmount: string; decimals: number}; userAccount: string}>}> | undefined
    if (!accountData) return null

    for (const acct of accountData) {
      const changes = acct.tokenBalanceChanges ?? []
      for (const ch of changes) {
        if (ch.mint !== mint) continue
        const rawAmount = parseFloat(ch.rawTokenAmount?.tokenAmount ?? '0')
        const dec       = ch.rawTokenAmount?.decimals ?? 0
        const uiAmount  = dec > 0 ? rawAmount / Math.pow(10, dec) : rawAmount
        if (Math.abs(uiAmount) < 1) continue
        return {
          txHash:    sig,
          side:      uiAmount > 0 ? 'buy' : 'sell',
          price:     0,
          volume:    0,
          amount:    Math.abs(uiAmount),
          source:    'transfer',
          blockTime: time,
          from:      ch.userAccount ?? acct.account,
        }
      }
    }
    return null
  } catch { return null }
}

export async function POST(req: NextRequest) {
  noStore()

  const { mint } = await req.json()
  if (!mint) return NextResponse.json({ error: 'mint required' }, { status: 400 })

  const heliusKey = process.env.HELIUS_API_KEY
  if (!heliusKey) return NextResponse.json({ error: 'HELIUS_API_KEY not configured' }, { status: 503 })

  // Demo tokens — return realistic mock heatmap data
  const DEMOS = ['BONK', 'WIF', 'POPCAT']
  if (DEMOS.includes(mint.toUpperCase())) {
    const mockTrades: ParsedTrade[] = []
    const now = Math.floor(Date.now() / 1000)
    for (let i = 0; i < 80; i++) {
      const offset = Math.floor(Math.random() * 7 * 86400)
      mockTrades.push({
        txHash: `mock_${i}`, side: Math.random() > 0.4 ? 'buy' : 'sell',
        price: 0.0000182, volume: Math.random() * 500,
        amount: Math.random() * 1e9, source: 'raydium',
        blockTime: now - offset, from: `${i}xAB...cD${i}`,
      })
    }
    const heatmap = computeHeatmap(mockTrades)
    return NextResponse.json({ trades: mockTrades.slice(0, 20), heatmap: heatmap.matrix, ...heatmap })
  }

  try {
    // Fetch recent transactions for the token mint address
    // Use Helius enhanced transactions API — works on free plan
    const url = `${HELIUS_BASE}/v0/addresses/${mint}/transactions?api-key=${heliusKey}&limit=100&type=SWAP`
    const res = await fetch(url, { cache: 'no-store' })

    let rawTxs: Record<string, unknown>[] = []
    if (res.ok) {
      const json = await res.json()
      rawTxs = Array.isArray(json) ? json : []
      console.log(`[trades] Helius returned ${rawTxs.length} txs for ${mint.slice(0,8)}`)
    } else {
      console.warn(`[trades] Helius txs failed: ${res.status}`)
    }

    // If SWAP type returns nothing, try without type filter
    if (rawTxs.length === 0) {
      const url2 = `${HELIUS_BASE}/v0/addresses/${mint}/transactions?api-key=${heliusKey}&limit=100`
      const res2 = await fetch(url2, { cache: 'no-store' })
      if (res2.ok) {
        const json2 = await res2.json()
        rawTxs = Array.isArray(json2) ? json2 : []
        console.log(`[trades] Helius fallback returned ${rawTxs.length} txs`)
      }
    }

    // Parse trades from transactions
    const trades: ParsedTrade[] = []
    for (const tx of rawTxs) {
      const parsed = parseTx(tx, mint)
      if (parsed) trades.push(parsed)
    }

    console.log(`[trades] parsed ${trades.length} trades from ${rawTxs.length} txs`)

    // If we have no parsed trades but have raw txs, create basic activity entries
    // so the heatmap still shows real timestamps
    if (trades.length === 0 && rawTxs.length > 0) {
      for (const tx of rawTxs.slice(0, 50)) {
        const time = tx.timestamp as number
        if (time) {
          trades.push({
            txHash: tx.signature as string, side: 'buy',
            price: 0, volume: 0, amount: 0,
            source: (tx.source as string) ?? 'unknown',
            blockTime: time,
            from: (tx.feePayer as string) ?? '',
          })
        }
      }
    }

    const heatmap = computeHeatmap(trades)

    return NextResponse.json({
      trades:      trades.slice(0, 30),
      heatmap:     heatmap.matrix,
      peakDay:     heatmap.peakDay,
      peakHour:    heatmap.peakHour,
      buyCount:    heatmap.buyCount,
      sellCount:   heatmap.sellCount,
      totalVolume: heatmap.totalVolume,
      buySellRatio: heatmap.buySellRatio,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[trades] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
