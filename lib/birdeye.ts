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
  const result = normalise(raw)
  console.log('[birdeye] normalised: price=', result.price, 'mc=', result.mc)
  return result
}

export interface OHLCVPoint {
  unixTime: number
  o: number; h: number; l: number; c: number; v: number
}

/**
 * Fetch historical price data using Birdeye's price history endpoint.
 * This works directly on token address and returns real daily closes.
 */
export async function getPriceHistory(
  address: string,
  apiKey: string,
  days = 7
): Promise<OHLCVPoint[]> {
  const to   = Math.floor(Date.now() / 1000)
  const from = to - days * 86400

  // Method 1: /defi/history_price — returns price per timestamp (most reliable)
  try {
    const url = `${BIRDEYE_BASE}/defi/history_price?address=${address}&address_type=token&type=1D&time_from=${from}&time_to=${to}`
    const res = await fetch(url, {
      headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana' },
    })
    if (res.ok) {
      const json = await res.json()
      const items: { unixTime: number; value: number }[] =
        json?.data?.items ?? json?.data ?? []
      if (Array.isArray(items) && items.length > 1) {
        console.log(`[birdeye] history_price: ${items.length} points`)
        // Convert price history to OHLCV-like shape
        return items.map((p) => ({
          unixTime: p.unixTime,
          o: p.value, h: p.value, l: p.value, c: p.value, v: 0,
        }))
      }
    }
  } catch (e) {
    console.warn('[birdeye] history_price failed:', (e as Error).message)
  }

  // Method 2: /defi/ohlcv — classic OHLCV endpoint
  try {
    const url = `${BIRDEYE_BASE}/defi/ohlcv?address=${address}&type=1D&time_from=${from}&time_to=${to}`
    const res = await fetch(url, {
      headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana' },
    })
    if (res.ok) {
      const json = await res.json()
      const items: OHLCVPoint[] =
        json?.data?.items ?? json?.data ?? json?.items ?? []
      if (Array.isArray(items) && items.length > 0) {
        console.log(`[birdeye] ohlcv: ${items.length} candles`)
        return items
      }
    }
  } catch (e) {
    console.warn('[birdeye] ohlcv failed:', (e as Error).message)
  }

  // Method 3: /defi/price_multiple with daily intervals — build manually
  try {
    const timestamps: number[] = []
    for (let i = days - 1; i >= 0; i--) {
      timestamps.push(to - i * 86400)
    }
    const tsParam = timestamps.join(',')
    const url = `${BIRDEYE_BASE}/defi/historical_price_unix?address=${address}&unixtime=${tsParam}`
    const res = await fetch(url, {
      headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana' },
    })
    if (res.ok) {
      const json = await res.json()
      const data = json?.data
      if (data && typeof data === 'object') {
        const points = timestamps.map((ts) => {
          const val = (data as Record<string, number>)[ts.toString()] ?? 0
          return { unixTime: ts, o: val, h: val, l: val, c: val, v: 0 }
        }).filter((p) => p.c > 0)
        if (points.length > 1) {
          console.log(`[birdeye] historical_price_unix: ${points.length} points`)
          return points
        }
      }
    }
  } catch (e) {
    console.warn('[birdeye] historical_price_unix failed:', (e as Error).message)
  }

  console.warn('[birdeye] all price history methods failed')
  return []
}

// Keep old export name for backward compatibility
export async function getOHLCV(
  address: string,
  apiKey: string,
  days = 7
): Promise<OHLCVPoint[]> {
  return getPriceHistory(address, apiKey, days)
}
