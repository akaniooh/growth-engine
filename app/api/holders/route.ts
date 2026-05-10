import { NextRequest, NextResponse } from 'next/server'
import { MOCK_DATA, Wallet, WalletType } from '@/lib/data'
import { getTokenHolders, getTokenMetadata, getWalletTransactions } from '@/lib/helius'

// ── Types ────────────────────────────────────────────────────────────────────

interface ProcessedHolder {
  owner:    string
  uiAmount: number
  pct:      number
  type:     WalletType
  last:     string
}

// ── Format ───────────────────────────────────────────────────────────────────

function fmtHoldings(amount: number, symbol: string): string {
  const s = symbol ? ` ${symbol}` : ''
  if (amount >= 1e12) return `${(amount / 1e12).toFixed(2)}T${s}`
  if (amount >= 1e9)  return `${(amount / 1e9).toFixed(1)}B${s}`
  if (amount >= 1e6)  return `${(amount / 1e6).toFixed(2)}M${s}`
  if (amount >= 1e3)  return `${(amount / 1e3).toFixed(1)}K${s}`
  return `${amount.toFixed(2)}${s}`
}

function toWallet(h: ProcessedHolder, symbol: string): Wallet {
  return {
    addr:     h.owner.length > 8
      ? `${h.owner.slice(0, 4)}...${h.owner.slice(-4)}`
      : h.owner,
    type:     h.type,
    pct:      `${h.pct.toFixed(3)}%`,
    holdings: fmtHoldings(h.uiAmount, symbol),
    last:     h.last,
  }
}

// ── Build holder list (top 10 via getTokenLargestAccounts) ───────────────────

async function buildHolderList(mint: string, apiKey: string): Promise<ProcessedHolder[]> {
  const [raw, meta] = await Promise.all([
    getTokenHolders(mint, apiKey),
    getTokenMetadata(mint, apiKey),
  ])

  if (raw.length === 0) {
    throw new Error('No token holders found for this mint address')
  }

  raw.sort((a, b) => b.uiAmount - a.uiAmount)

  // Total supply for % calculation
  let totalSupply = meta?.supply ?? 0
  if (totalSupply === 0) {
    totalSupply = raw.reduce((s, h) => s + h.uiAmount, 0)
  }

  // Base classification
  const processed: ProcessedHolder[] = raw.map((h) => {
    const pct: number = totalSupply > 0 ? (h.uiAmount / totalSupply) * 100 : 0
    const type: WalletType = pct >= 1 ? 'whale' : 'dormant'
    return { owner: h.owner, uiAmount: h.uiAmount, pct, type, last: '—' }
  })

  // Upgrade with real tx activity for all holders (only top 10 anyway)
  try {
    const owners = processed.map((h) => h.owner)
    const txs    = await getWalletTransactions(owners, apiKey, 10)

    const NOW       = Date.now()
    const ACTIVE_MS = 72 * 3600 * 1000
    const NEW_MS    = 48 * 3600 * 1000
    const lastTsMap = new Map<string, number>()
    const recentSet = new Set<string>()
    const newSet    = new Set<string>()

    for (const tx of txs) {
      const accs = (tx.accountData ?? []).map((a) => a.account)
      const age  = NOW - tx.timestamp * 1000
      for (const acc of accs) {
        const prev = lastTsMap.get(acc) ?? 0
        if (tx.timestamp > prev) lastTsMap.set(acc, tx.timestamp)
        if (age < NEW_MS)    newSet.add(acc)
        if (age < ACTIVE_MS) recentSet.add(acc)
      }
    }

    for (const h of processed) {
      const ts = lastTsMap.get(h.owner)
      if (ts) {
        const diffH = Math.floor((NOW / 1000 - ts) / 3600)
        h.last = diffH < 1  ? 'just now'
               : diffH < 24 ? `${diffH}h ago`
               : `${Math.floor(diffH / 24)}d ago`
      }
      if (h.type !== 'whale') {
        if (newSet.has(h.owner))         h.type = 'new'
        else if (recentSet.has(h.owner)) h.type = 'active'
      }
    }
  } catch (e) {
    console.warn('[holders] tx classification skipped:', (e as Error).message)
  }

  return processed
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { mint, symbol = '', filter = 'all' } = await req.json()
  if (!mint) return NextResponse.json({ error: 'mint required' }, { status: 400 })

  // Demo tokens
  const demoKey = Object.keys(MOCK_DATA).find(
    (k) => mint === k || mint.toUpperCase() === k
  )
  if (demoKey) {
    const all      = MOCK_DATA[demoKey].wallets.slice(0, 10)
    const filtered = filter === 'all' ? all : all.filter((w) => w.type === filter)
    return NextResponse.json({
      wallets: filtered,
      total:   filtered.length,
      counts: {
        all:     all.length,
        whale:   all.filter((w) => w.type === 'whale').length,
        active:  all.filter((w) => w.type === 'active').length,
        new:     all.filter((w) => w.type === 'new').length,
        dormant: all.filter((w) => w.type === 'dormant').length,
      },
    })
  }

  const heliusKey = process.env.HELIUS_API_KEY
  if (!heliusKey || heliusKey === 'your_helius_api_key_here') {
    return NextResponse.json({ error: 'HELIUS_API_KEY not configured' }, { status: 503 })
  }

  try {
    const processed = await buildHolderList(mint, heliusKey)
    const filtered  = filter === 'all' ? processed : processed.filter((h) => h.type === filter)

    const total    = processed.length || 1
    const whaleCt  = processed.filter((h) => h.type === 'whale').length
    const activeCt = processed.filter((h) => h.type === 'active').length
    const newCt    = processed.filter((h) => h.type === 'new').length
    const dormCt   = processed.filter((h) => h.type === 'dormant').length

    return NextResponse.json({
      wallets: filtered.map((h) => toWallet(h, symbol)),
      total:   filtered.length,
      counts: {
        all:     processed.length,
        whale:   whaleCt,
        active:  activeCt,
        new:     newCt,
        dormant: dormCt,
      },
      // Real percentages for AI insights
      pcts: {
        whale:   Math.round(whaleCt   / total * 100),
        active:  Math.round(activeCt  / total * 100),
        new:     Math.round(newCt     / total * 100),
        dormant: Math.round(dormCt    / total * 100),
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[holders] failed:', msg)
    const isOverload = msg.toLowerCase().includes('overload') || msg.toLowerCase().includes('rate limit')
    return NextResponse.json(
      {
        error:     isOverload ? 'Helius RPC is busy — retrying automatically…' : msg,
        retryable: isOverload,
      },
      { status: isOverload ? 503 : 500 }
    )
  }
}
