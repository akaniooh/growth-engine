export type DexScreenerSnapshot = {
  symbol?: string
  name?: string
  price: number
  priceChange24hPercent: number
  v24hUSD: number
  marketCap: number
}

type RawPair = {
  chainId?: string
  dexId?: string
  liquidity?: { usd?: number }
  baseToken?: { symbol?: string; name?: string }
  priceUsd?: string
  priceChange?: { h24?: number }
  volume?: { h24?: number }
  marketCap?: number
  fdv?: number
}

export async function getDexScreenerSnapshot(address: string): Promise<DexScreenerSnapshot | null> {
  const url = `https://api.dexscreener.com/latest/dex/tokens/${address}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return null

  const json = await res.json() as { pairs?: RawPair[] }
  const pairs = Array.isArray(json?.pairs) ? json.pairs : []
  const solanaPairs = pairs.filter((p) => p.chainId === 'solana')
  if (solanaPairs.length === 0) return null

  const best = [...solanaPairs].sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0]
  const price = Number(best.priceUsd ?? 0)
  const volume = Number(best.volume?.h24 ?? 0)
  const change = Number(best.priceChange?.h24 ?? 0)
  const marketCap = Number(best.marketCap ?? best.fdv ?? 0)

  return {
    symbol: best.baseToken?.symbol,
    name: best.baseToken?.name,
    price: Number.isFinite(price) ? price : 0,
    v24hUSD: Number.isFinite(volume) ? volume : 0,
    priceChange24hPercent: Number.isFinite(change) ? change : 0,
    marketCap: Number.isFinite(marketCap) ? marketCap : 0,
  }
}
