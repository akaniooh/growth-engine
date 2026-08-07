// Birdeye API integration

const BIRDEYE_BASE = 'https://public-api.birdeye.so'

// --- Throttle: serialize all outgoing Birdeye requests with a minimum gap.
// Free/starter Birdeye tiers commonly cap requests per second. When multiple
// routes (e.g. /api/analyze and /api/insights) fire near-simultaneously,
// parallel calls can 429 even though the monthly credit limit isn't close
// to exhausted. This queue makes sure we never fire two Birdeye requests
// less than MIN_INTERVAL_MS apart.
const MIN_INTERVAL_MS = 1100
let queue: Promise<unknown> = Promise.resolve()

function throttledFetch(url: string, init: RequestInit): Promise<Response> {
  const run = queue.then(async () => {
    const res = await fetch(url, init)
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS))
    return res
  })
  // Keep the queue chain alive even if this call errors, so later calls
  // still wait their turn instead of firing immediately.
  queue = run.catch(() => undefined)
  return run
}

// --- Short-lived cache for token overview, keyed by address.
// Prevents /api/analyze and /api/insights (called close together on page
// load) from double-hitting Birdeye for the exact same token.
const OVERVIEW_CACHE_TTL_MS = 20_000
const overviewCache = new Map<string, { data: BirdeyeTokenOverview; expires: number }>()

type BirdeyeRaw = { [key: string]: unknown }

export interface BirdeyeTokenOverview {
  price:                        number
  priceChange24hPercent:        number
  v24hUSD:                      number
  v24hChangePercent:            number
  holder:                       number
  holderChange24h:              number
  mc:                           number
  liquidity:                    number
  uniqueWallet24h:              number
  uniqueWallet24hChangePercent: number
  symbol:                       string
  name:                         string
}

export interface BirdeyeTrade {
  txHash:    string
  side:      'buy' | 'sell'
  price:     number
  volume:    number      // USD value
  amount:    number      // token amount
  source:    string
  blockTime: number
  from:      string
  to:        string
}

function num(raw: BirdeyeRaw, ...keys: string[]): number {
  for (const k of keys) {
    const v = raw[k]
    if (typeof v === 'number' && !isNaN(v)) return v
    if (typeof v === 'string' && v !== '') {
      const n = parseFloat(v)
      if (!isNaN(n)) return n
    }
  }
  return 0
}

function str(raw: BirdeyeRaw, ...keys: string[]): string {
  for (const k of keys) {
    const v = raw[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

function normalise(raw: BirdeyeRaw): BirdeyeTokenOverview {
  return {
    price:                        num(raw, 'price', 'lastPrice', 'currentPrice'),
    priceChange24hPercent:        num(raw, 'priceChange24hPercent', 'price24hChangePercent', 'priceChangePercent', 'priceChange24h'),
    v24hUSD:                      num(raw, 'v24hUSD', 'volume24hUSD', 'volumeUSD', 'v24h', 'volume24h'),
    v24hChangePercent:            num(raw, 'v24hChangePercent', 'volume24hChangePercent', 'volumeChangePercent'),
    holder:                       num(raw, 'holder', 'holders', 'holderCount', 'numberOfHolders'),
    holderChange24h:              num(raw, 'holderChange24h', 'holder24hChange', 'holdersChange24h', 'holderChanges24h'),
    mc:                           num(raw, 'mc', 'marketCap', 'market_cap', 'fdv'),
    liquidity:                    num(raw, 'liquidity', 'liquidityUSD'),
    uniqueWallet24h:              num(raw, 'uniqueWallet24h', 'uniqueWallets24h', 'uniqueWallet24hCount', 'trade24h'),
    uniqueWallet24hChangePercent: num(raw, 'uniqueWallet24hChangePercent', 'uniqueWallets24hChangePercent', 'uniqueWallet24hChange'),
    symbol:                       str(raw, 'symbol'),
    name:                         str(raw, 'name'),
  }
}

// --- In-flight request dedup, keyed by address.
// The Birdeye plan on this project is capped at 1 request/sec. Within a
// single warm serverless instance, /api/analyze and /api/insights can both
// call getTokenOverview for the same token within milliseconds of each
// other (e.g. on page load). Without this, both calls would race past the
// overviewCache (neither sees a cache hit yet) and both queue a real
// Birdeye fetch. This map makes the second caller await the first
// caller's in-flight promise instead of firing its own request.
const pendingOverview = new Map<string, Promise<BirdeyeTokenOverview | null>>()

export async function getTokenOverview(
  address: string,
  apiKey: string
): Promise<BirdeyeTokenOverview | null> {
  const cached = overviewCache.get(address)
  if (cached && cached.expires > Date.now()) {
    console.log('[birdeye] overview cache hit')
    return cached.data
  }

  const pending = pendingOverview.get(address)
  if (pending) {
    console.log('[birdeye] overview in-flight, reusing request')
    return pending
  }

  const request = fetchTokenOverview(address, apiKey).finally(() => {
    pendingOverview.delete(address)
  })
  pendingOverview.set(address, request)
  return request
}

async function fetchTokenOverview(
  address: string,
  apiKey: string
): Promise<BirdeyeTokenOverview | null> {
  const res = await throttledFetch(
    `${BIRDEYE_BASE}/defi/token_overview?address=${address}`,
    { headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana' } }
  )
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`[birdeye] overview failed: ${res.status} ${res.statusText} — ${body.slice(0, 200)}`)
    throw new Error(`Birdeye ${res.status}`)
  }
  const json = await res.json()
  const raw: BirdeyeRaw = json?.data ?? json ?? {}
  console.log('[birdeye] raw keys:', Object.keys(raw).slice(0, 20).join(', '))
  console.log('[birdeye] price:', raw.price, '| mc:', raw.mc, '| holder:', raw.holder)
  const normalised = normalise(raw)
  overviewCache.set(address, { data: normalised, expires: Date.now() + OVERVIEW_CACHE_TTL_MS })
  return normalised
}

export interface OHLCVPoint {
  unixTime: number
  o: number; h: number; l: number; c: number; v: number
}

export async function getPriceHistory(
  address: string,
  apiKey: string,
  days = 7,
  interval: '1D' | '1H' = '1D'
): Promise<OHLCVPoint[]> {
  const to   = Math.floor(Date.now() / 1000)
  const from = to - days * 86400

  // Method 1: /defi/history_price — reliable daily price snapshots on all Birdeye tiers.
  // /defi/ohlcv with type=1D often returns the CURRENT price for all historical candles
  // on starter/free tiers, making every close identical → flat MC line.
  // history_price returns one real price point per interval, sorted ascending.
  try {
    const url = `${BIRDEYE_BASE}/defi/history_price?address=${address}&address_type=token&type=${interval}&time_from=${from}&time_to=${to}`
    const res = await throttledFetch(url, { headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana' } })
    if (res.ok) {
      const json = await res.json()
      const items: { unixTime: number; value: number }[] = json?.data?.items ?? json?.data ?? []
      if (Array.isArray(items) && items.length > 1) {
        // Verify prices actually vary — if all identical, this endpoint also failed us
        const values = items.map((p) => p.value)
        const allSame = values.every((v) => v === values[0])
        if (!allSame) {
          console.log(`[birdeye] history_price: ${items.length} points, prices vary ✓`)
          return items.map((p) => ({ unixTime: p.unixTime, o: p.value, h: p.value, l: p.value, c: p.value, v: 0 }))
        }
        console.warn(`[birdeye] history_price returned identical prices (${values[0]}) — trying ohlcv`)
      }
    }
  } catch (e) { console.warn('[birdeye] history_price failed:', (e as Error).message) }

  // Method 2: /defi/ohlcv — try anyway as fallback
  try {
    const url = `${BIRDEYE_BASE}/defi/ohlcv?address=${address}&type=${interval}&time_from=${from}&time_to=${to}`
    const res = await throttledFetch(url, { headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana' } })
    if (!res.ok) console.warn(`[birdeye] ohlcv http error: ${res.status} ${res.statusText}`)
    if (res.ok) {
      const json = await res.json()
      const items: OHLCVPoint[] = json?.data?.items ?? json?.data ?? json?.items ?? []
      if (Array.isArray(items) && items.length > 1) {
        const closes = items.map((p) => p.c)
        const allSame = closes.every((v) => v === closes[0])
        if (!allSame) {
          console.log(`[birdeye] ohlcv: ${items.length} candles, closes vary ✓`)
          return items
        }
        console.warn(`[birdeye] ohlcv also returned identical closes — no real history available`)
      }
    }
  } catch (e) { console.warn('[birdeye] ohlcv failed:', (e as Error).message) }

  return []
}

/**
 * Fetch 7-day price history from CoinGecko (no API key needed).
 * CoinGecko identifies Solana tokens by their mint address on the solana platform.
 * Returns one data point per day, oldest → newest.
 */
export async function getPriceHistoryFromCoinGecko(
  mintAddress: string,
  days = 7
): Promise<OHLCVPoint[]> {
  try {
    // CoinGecko's /coins/{id}/market_chart/range endpoint by contract address
    const to   = Math.floor(Date.now() / 1000)
    const from = to - days * 86400
    const url  = `https://api.coingecko.com/api/v3/coins/solana/contract/${mintAddress}/market_chart/range?vs_currency=usd&from=${from}&to=${to}`
    const res  = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) {
      console.warn(`[coingecko] ${res.status} for ${mintAddress.slice(0, 8)}`)
      return []
    }
    const json = await res.json()
    // prices: [[timestamp_ms, price], ...]
    const prices: [number, number][] = json?.prices ?? []
    if (!Array.isArray(prices) || prices.length < 2) return []

    // Deduplicate to one point per day (keep last per UTC day)
    const byDay = new Map<string, { unixTime: number; value: number }>()
    for (const [tsMs, value] of prices) {
      const key = new Date(tsMs).toISOString().slice(0, 10)
      byDay.set(key, { unixTime: Math.floor(tsMs / 1000), value })
    }

    const points = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-days)
      .map(([, p]) => ({
        unixTime: p.unixTime,
        o: p.value, h: p.value, l: p.value, c: p.value, v: 0,
      }))

    const values = points.map((p) => p.c)
    const allSame = values.every((v) => v === values[0])
    if (allSame) {
      console.warn('[coingecko] returned identical prices — token not listed?')
      return []
    }

    console.log(`[coingecko] ${points.length} daily price points, prices vary ✓`)
    return points
  } catch (e) {
    console.warn('[coingecko] fetch failed:', (e as Error).message)
    return []
  }
}

export async function getOHLCV(address: string, apiKey: string, days = 7, interval: '1D' | '1H' = '1D'): Promise<OHLCVPoint[]> {
  return getPriceHistory(address, apiKey, days, interval)
}

/**
 * Fetch recent trades for a token — live buys and sells
 * Returns most recent trades sorted newest first
 */
export async function getRecentTrades(
  address: string,
  apiKey: string,
  limit = 50
): Promise<BirdeyeTrade[]> {
  const trades: BirdeyeTrade[] = []

  // Method 1: /defi/txs/token — token transaction history
  try {
    const url = `${BIRDEYE_BASE}/defi/txs/token?address=${address}&tx_type=swap&sort_type=desc&limit=${limit}`
    const res = await throttledFetch(url, { headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana' } })
    if (res.ok) {
      const json = await res.json()
      const items: BirdeyeRaw[] = json?.data?.items ?? json?.data ?? []
      if (Array.isArray(items) && items.length > 0) {
        console.log(`[birdeye] trades: ${items.length} transactions`)
        for (const item of items) {
          const side = str(item as BirdeyeRaw, 'side') as 'buy' | 'sell' || 'buy'
          trades.push({
            txHash:    str(item as BirdeyeRaw, 'txHash', 'signature', 'hash'),
            side:      side === 'sell' ? 'sell' : 'buy',
            price:     num(item as BirdeyeRaw, 'price', 'priceUsd'),
            volume:    num(item as BirdeyeRaw, 'volumeUsd', 'volume', 'value'),
            amount:    num(item as BirdeyeRaw, 'amount', 'tokenAmount', 'fromAmount'),
            source:    str(item as BirdeyeRaw, 'source', 'dex', 'programId'),
            blockTime: num(item as BirdeyeRaw, 'blockUnixTime', 'timestamp', 'blockTime'),
            from:      str(item as BirdeyeRaw, 'owner', 'from', 'signer'),
            to:        str(item as BirdeyeRaw, 'to', 'toAddress'),
          })
        }
        return trades
      }
    }
  } catch (e) {
    console.warn('[birdeye] trades fetch failed:', (e as Error).message)
  }

  return trades
}

/**
 * Compute hourly/daily activity pattern from recent trades
 * Returns a 6×7 matrix (6 hour-buckets × 7 days) of intensity values 0-1
 */
export function computeHeatmap(trades: BirdeyeTrade[]): {
  matrix: number[][]
  peakDay: string
  peakHour: number
  buyCount: number
  sellCount: number
  totalVolume: number
} {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  // 6 buckets: 00-04, 04-08, 08-12, 12-16, 16-20, 20-24
  const matrix: number[][] = Array.from({ length: 6 }, () => Array(7).fill(0))
  const dayCounts   = Array(7).fill(0)
  let buyCount = 0, sellCount = 0, totalVolume = 0

  for (const trade of trades) {
    const date = new Date(trade.blockTime * 1000)
    const dayOfWeek  = date.getUTCDay()            // 0=Sun
    const hourOfDay  = date.getUTCHours()          // 0-23
    const hourBucket = Math.min(5, Math.floor(hourOfDay / 4))

    matrix[hourBucket][dayOfWeek]++
    dayCounts[dayOfWeek]++
    if (trade.side === 'buy')  buyCount++
    else                       sellCount++
    totalVolume += trade.volume
  }

  // Normalize matrix to 0-1
  const maxVal = Math.max(...matrix.flat(), 1)
  const normalized = matrix.map((row) => row.map((v) => v / maxVal))

  // Find peak
  let peakDay = 'Mon', peakHour = 12, peakMax = 0
  matrix.forEach((row, hi) => {
    row.forEach((val, di) => {
      if (val > peakMax) {
        peakMax  = val
        peakDay  = DAYS[di]
        peakHour = hi * 4 + 2
      }
    })
  })

  return { matrix: normalized, peakDay, peakHour, buyCount, sellCount, totalVolume }
}
