// Helius API — simplified top-10 holders via RPC getParsedTokenAccountsByDelegate
// Uses getTokenLargestAccounts (standard RPC, works on all plans)

const HELIUS_RPC = 'https://mainnet.helius-rpc.com'

export interface HeliusTokenHolder {
  owner:    string
  uiAmount: number
  decimals: number
}

export interface HeliusTransaction {
  signature:    string
  timestamp:    number
  fee:          number
  type:         string
  source:       string
  accountData?: Array<{ account: string; nativeBalanceChange: number }>
}

async function rpcCall(apiKey: string, method: string, params: unknown[]) {
  const res = await fetch(`${HELIUS_RPC}/?api-key=${apiKey}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error.message ?? JSON.stringify(json.error))
  return json.result
}


/** Retry an async operation up to `attempts` times with exponential backoff */
async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 600
): Promise<T> {
  let lastError: Error = new Error('Unknown error')
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e as Error
      const isOverload = lastError.message.toLowerCase().includes('overload') ||
                         lastError.message.toLowerCase().includes('overloaded') ||
                         lastError.message.toLowerCase().includes('rate limit') ||
                         lastError.message.toLowerCase().includes('too many')
      if (!isOverload || i === attempts - 1) throw lastError
      const delay = baseDelayMs * Math.pow(2, i)
      console.log(`[helius] retry ${i + 1}/${attempts} after ${delay}ms: ${lastError.message.slice(0, 80)}`)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastError
}

export async function getTokenMetadata(
  mint: string,
  apiKey: string
): Promise<{ name: string; symbol: string; supply: number; decimals: number } | null> {

  // Method 1: Helius token-metadata REST
  try {
    const res = await fetch(
      `https://api.helius.xyz/v0/token-metadata?api-key=${apiKey}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mintAccounts: [mint], includeOffChain: false }),
      }
    )
    if (res.ok) {
      const json = await res.json()
      const item = Array.isArray(json) ? json[0] : null
      if (item) {
        const onChain    = item.onChainMetadata?.metadata?.data ?? {}
        const onChainAcc = item.onChainAccountInfo?.accountInfo?.data?.parsed?.info ?? {}
        const decimals   = (onChainAcc.decimals as number) ?? 0
        const rawSupply  = parseFloat((onChainAcc.supply as string) ?? '0')
        const name       = ((onChain.name as string) ?? '').trim()
        const symbol     = ((onChain.symbol as string) ?? '').trim()
        if (decimals > 0 || rawSupply > 0) {
          return {
            name:    name   || mint.slice(0, 6).toUpperCase(),
            symbol:  symbol || mint.slice(0, 4).toUpperCase(),
            supply:  decimals > 0 ? rawSupply / Math.pow(10, decimals) : rawSupply,
            decimals,
          }
        }
      }
    }
  } catch (e) {
    console.warn('[helius] token-metadata REST failed:', (e as Error).message)
  }

  // Method 2: getAsset (DAS)
  try {
    const result = await rpcCall(apiKey, 'getAsset', [mint])
    const ti   = result?.token_info
    const meta = result?.content?.metadata
    if (ti?.decimals != null) {
      const decimals = ti.decimals as number
      const rawSup   = (ti.supply as number) ?? 0
      return {
        name:    ((meta?.name   as string) ?? '').trim() || mint.slice(0, 6).toUpperCase(),
        symbol:  ((meta?.symbol as string) ?? '').trim() || mint.slice(0, 4).toUpperCase(),
        supply:  decimals > 0 ? rawSup / Math.pow(10, decimals) : rawSup,
        decimals,
      }
    }
  } catch (e) {
    console.warn('[helius] getAsset failed:', (e as Error).message)
  }

  // Method 3: getParsedAccountInfo
  try {
    const result = await rpcCall(apiKey, 'getParsedAccountInfo', [mint, { encoding: 'jsonParsed' }])
    const info = result?.value?.data?.parsed?.info
    if (info?.decimals != null) {
      const decimals  = info.decimals as number
      const rawSupply = parseFloat((info.supply as string) ?? '0')
      return {
        name:    mint.slice(0, 6).toUpperCase(),
        symbol:  mint.slice(0, 4).toUpperCase(),
        supply:  decimals > 0 ? rawSupply / Math.pow(10, decimals) : rawSupply,
        decimals,
      }
    }
  } catch (e) {
    console.warn('[helius] getParsedAccountInfo failed:', (e as Error).message)
  }

  return null
}

/**
 * Get top 10 holders using getTokenLargestAccounts — standard RPC, works everywhere.
 * Then resolve each token account to its owner wallet via getAccountInfo.
 */
export async function getTokenHolders(
  mint: string,
  apiKey: string
): Promise<HeliusTokenHolder[]> {
  const meta        = await getTokenMetadata(mint, apiKey)
  const decimals    = meta?.decimals ?? 0

  console.log(`[helius] getTokenLargestAccounts for ${mint.slice(0, 8)}, decimals=${decimals}`)

  // Step 1: get top 20 largest token accounts
  // NOTE: commitment must be an object, not a plain string
  const largest = await withRetry(() =>
    rpcCall(apiKey, 'getTokenLargestAccounts', [mint, { commitment: 'confirmed' }]),
    4,   // up to 4 attempts
    800  // 800ms, 1.6s, 3.2s, 6.4s backoff
  )

  // Normalize — some RPC nodes return uiAmount as null when frozen/delegated
  // Fall back to uiAmountString in that case
  const accounts = (largest?.value ?? [])
    .map((a: { address: string; uiAmount: number | null; uiAmountString?: string; amount?: string }) => {
      let amount = a.uiAmount ?? 0
      if (amount === 0 && a.uiAmountString) {
        amount = parseFloat(a.uiAmountString)
      }
      if (amount === 0 && a.amount && decimals >= 0) {
        amount = parseFloat(a.amount) / Math.pow(10, decimals)
      }
      return { address: a.address, uiAmount: amount }
    })
    .filter((a: { uiAmount: number }) => a.uiAmount > 0)

  console.log(`[helius] found ${accounts.length} token accounts with balance`)

  if (accounts.length === 0) return []

  // Step 2: resolve each token account address → owner wallet
  // getAccountInfo with jsonParsed encoding gives us parsed.info.owner
  const settled = await Promise.allSettled(
    accounts.slice(0, 20).map(async (acct: { address: string; uiAmount: number }) => {
      try {
        const info   = await withRetry(() =>
          rpcCall(apiKey, 'getAccountInfo', [acct.address, { encoding: 'jsonParsed' }]),
          3, 400
        )
        const parsed = info?.value?.data?.parsed?.info
        const owner: string =
          parsed?.owner    ??   // wallet that owns this token account
          parsed?.delegate ??   // delegated authority
          acct.address          // last resort: use the token account itself

        return { owner, uiAmount: acct.uiAmount, decimals }
      } catch {
        // If resolution fails, use the token account address as the identifier
        return { owner: acct.address, uiAmount: acct.uiAmount, decimals }
      }
    })
  )

  const holders: HeliusTokenHolder[] = []
  for (const result of settled) {
    if (result.status === 'fulfilled' && result.value.owner) {
      holders.push(result.value)
    }
  }

  console.log(`[helius] resolved ${holders.length} holders with owner addresses`)
  return holders
}

export async function getWalletTransactions(
  addresses: string[],
  apiKey: string,
  limit = 10
): Promise<HeliusTransaction[]> {
  const all: HeliusTransaction[] = []
  for (const addr of addresses.slice(0, 10)) {
    try {
      const res = await fetch(
        `https://api.helius.xyz/v0/addresses/${addr}/transactions?api-key=${apiKey}&limit=${limit}`
      )
      if (!res.ok) continue
      const txs = await res.json()
      if (Array.isArray(txs)) all.push(...txs)
    } catch { /* skip */ }
  }
  return all
}
