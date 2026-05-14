export type DexSnapshot = {
  price: number
  priceChange24hPercent: number
  v24hUSD: number
  marketCap: number
  symbol?: string
  name?: string
}

type Pair = {
  chainId?: string
  liquidity?: { usd?: number }
  priceUsd?: string
  priceChange?: { h24?: number }
  volume?: { h24?: number }
  marketCap?: number
  fdv?: number
  baseToken?: { symbol?: string; name?: string }
}

export async function getDexSnapshot(mint: string): Promise<DexSnapshot | null> {
  const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, { cache: 'no-store' })
  if (!res.ok) return null
  const json = await res.json() as { pairs?: Pair[] }
  const pairs = (json.pairs ?? []).filter((p) => p.chainId === 'solana')
  if (!pairs.length) return null
  const best = pairs.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0]

  return {
    price: Number(best.priceUsd ?? 0) || 0,
    priceChange24hPercent: Number(best.priceChange?.h24 ?? 0) || 0,
    v24hUSD: Number(best.volume?.h24 ?? 0) || 0,
    marketCap: Number(best.marketCap ?? best.fdv ?? 0) || 0,
    symbol: best.baseToken?.symbol,
    name: best.baseToken?.name,
  }
}
