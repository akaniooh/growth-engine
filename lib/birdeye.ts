// Birdeye API integration

const BIRDEYE_BASE = 'https://public-api.birdeye.so'

type BirdeyeRaw = { [key: string]: unknown }

export interface BirdeyeTokenOverview {
  price:                 number
  priceChange24hPercent: number
  v24hUSD:               number
  v24hChangePercent:     number
  holder:                number
  mc:                    number
  liquidity:             number
  uniqueWallet24h:       number
  symbol:                string
  name:                  string
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
    price:                 num(raw, 'price', 'lastPrice', 'currentPrice'),
    priceChange24hPercent: num(raw, 'priceChange24hPercent', 'price24hChangePercent', 'priceChangePercent', 'priceChange24h'),
    v24hUSD:               num(raw, 'v24hUSD', 'volume24hUSD', 'volumeUSD', 'v24h', 'volume24h'),
    v24hChangePercent:     num(raw, 'v24hChangePercent', 'volume24hChangePercent', 'volumeChangePercent'),
    holder:                num(raw, 'holder', 'holders', 'holderCount', 'numberOfHolders'),
    mc:                    num(raw, 'mc', 'marketCap', 'market_cap', 'fdv'),
    liquidity:             num(raw, 'liquidity', 'liquidityUSD'),
    uniqueWallet24h:       num(raw, 'uniqueWallet24h', 'uniqueWallets24h', 'uniqueWallet24hCount', 'trade24h'),
    symbol:                str(raw, 'symbol'),
    name:                  str(raw, 'name'),
  }
}

export async function getTokenOverview(
  address: string,
  apiKey: string
): Promise<BirdeyeTokenOverview | null> {
  const res = await fetch(
    `${BIRDEYE_BASE}/defi/token_overview?address=${address}`,
    { headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana' } }
  )
  if (!res.ok) throw new Error(`Birdeye ${res.status}`)
  const json = await res.json()
  const raw: BirdeyeRaw = json?.data ?? json ?? {}
  console.log('[birdeye] raw keys:', Object.keys(raw).slice(0, 20).join(', '))
  console.log('[birdeye] price:', raw.price, '| mc:', raw.mc, '| holder:', raw.holder)
  return normalise(raw)
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

  // Method 1: /defi/ohlcv — real open/high/low/close/volume candles (preferred)
  try {
    const url = `${BIRDEYE_BASE}/defi/ohlcv?address=${address}&type=${interval}&time_from=${from}&time_to=${to}`
    const res = await fetch(url, { headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana' } })
    if (res.ok) {
      const json = await res.json()
      const items: OHLCVPoint[] = json?.data?.items ?? json?.data ?? json?.items ?? []
      if (Array.isArray(items) && items.length > 1) {
        console.log(`[birdeye] ohlcv: ${items.length} candles (interval=${interval})`)
        return items
      }
    }
  } catch (e) { console.warn('[birdeye] ohlcv failed:', (e as Error).message) }

  // Method 2: /defi/history_price — price snapshots (fallback, volume will be 0)
  try {
    const url = `${BIRDEYE_BASE}/defi/history_price?address=${address}&address_type=token&type=${interval}&time_from=${from}&time_to=${to}`
    const res = await fetch(url, { headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana' } })
    if (res.ok) {
      const json = await res.json()
      const items: { unixTime: number; value: number }[] = json?.data?.items ?? json?.data ?? []
      if (Array.isArray(items) && items.length > 1) {
        console.log(`[birdeye] history_price fallback: ${items.length} points`)
        return items.map((p) => ({ unixTime: p.unixTime, o: p.value, h: p.value, l: p.value, c: p.value, v: 0 }))
      }
    }
  } catch (e) { console.warn('[birdeye] history_price failed:', (e as Error).message) }

  return []
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
    const res = await fetch(url, { headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana' } })
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
