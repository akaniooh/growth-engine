import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { mint } = await req.json()
  const apiKey = process.env.HELIUS_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No HELIUS_API_KEY' }, { status: 503 })

  // Fetch exactly 3 records so we can see the real shape
  const res = await fetch(`https://api.helius.xyz/v0/token-accounts?api-key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mint, limit: 3 }),
  })

  const json = await res.json()
  const records = json.tokenAccounts ?? json.token_accounts ?? json.accounts ?? json.result ?? []
  const first = records[0] ?? null

  return NextResponse.json({
    httpStatus:     res.status,
    topLevelKeys:   Object.keys(json),
    cursor:         json.cursor ?? null,
    recordCount:    records.length,
    firstRecordKeys: first ? Object.keys(first) : [],
    firstRecord:    first,
    // Show exactly what our extractor would produce
    extracted: first ? {
      owner:     first.owner ?? first.account ?? first.wallet ?? '(not found)',
      amount_raw: first.amount ?? first.tokenAmount?.amount ?? '(not found)',
      uiAmount:  first.tokenAmount?.uiAmount ?? '(not found)',
      decimals:  first.tokenAmount?.decimals ?? first.decimals ?? '(not found)',
    } : null,
  })
}
