// Wallet classification + insight generation from real on-chain data

import { HeliusTokenHolder, HeliusTransaction } from './helius'
import { Wallet, WalletType, Distribution, Insight, Action, Tweet } from './data'

const NOW = () => Date.now()

export function classifyWallets(
  holders:    HeliusTokenHolder[],
  totalSupply: number,
  transactions: HeliusTransaction[],
  symbol = ''
): {
  wallets:      Wallet[]
  distribution: Distribution[]
  whalePct:     number
  activePct:    number
  newPct:       number
  dormantPct:   number
  activeCount:  number
  heatPeak:     string
} {
  // Build a set of "recently active" and "new" owners from tx data
  const recentlyActive = new Set<string>()
  const newBuyers      = new Set<string>()
  const ACTIVE_WINDOW  = 72  * 3600 * 1000  // 72h
  const NEW_WINDOW     = 48  * 3600 * 1000  // 48h
  const now            = NOW()

  for (const tx of transactions) {
    const age = now - tx.timestamp * 1000
    const accts = (tx.accountData ?? []).map((a) => a.account)
    if (age < NEW_WINDOW) accts.forEach((a) => newBuyers.add(a))
    if (age < ACTIVE_WINDOW) accts.forEach((a) => recentlyActive.add(a))
  }

  // Sort holders by amount descending — keep ALL for table display
  const sorted = [...holders].sort((a, b) => b.uiAmount - a.uiAmount)
  const top = sorted // all holders, paginated in the UI

  const classify = (h: HeliusTokenHolder): WalletType => {
    const pct = totalSupply > 0 ? h.uiAmount / totalSupply : 0
    if (pct >= 0.01)                         return 'whale'
    if (newBuyers.has(h.owner))              return 'new'
    if (recentlyActive.has(h.owner))         return 'active'
    return 'dormant'
  }

  // Counts across all holders
  const sample = sorted
  let whaleCount = 0, activeCount = 0, newCount = 0, dormantCount = 0
  for (const h of sample) {
    const t = classify(h)
    if (t === 'whale')   whaleCount++
    if (t === 'active')  activeCount++
    if (t === 'new')     newCount++
    if (t === 'dormant') dormantCount++
  }
  const total = sample.length || 1
  const whalePct   = Math.round(whaleCount   / total * 100)
  const activePct  = Math.round(activeCount  / total * 100)
  const newPct     = Math.round(newCount     / total * 100)
  const dormantPct = Math.max(0, 100 - whalePct - activePct - newPct)

  // Format wallet rows
  const wallets: Wallet[] = top.map((h) => {
    const pct        = totalSupply > 0 ? ((h.uiAmount / totalSupply) * 100).toFixed(2) : '0'
    const type       = classify(h)
    const shortAddr  = `${h.owner.slice(0, 4)}...${h.owner.slice(-4)}`
    const symSuffix = symbol ? ` ${symbol}` : ''
    const holdings   = h.uiAmount >= 1e12
      ? `${(h.uiAmount / 1e12).toFixed(2)}T${symSuffix}`
      : h.uiAmount >= 1e9
        ? `${(h.uiAmount / 1e9).toFixed(1)}B${symSuffix}`
        : h.uiAmount >= 1e6
          ? `${(h.uiAmount / 1e6).toFixed(2)}M${symSuffix}`
          : h.uiAmount >= 1e3
            ? `${(h.uiAmount / 1e3).toFixed(1)}K${symSuffix}`
            : `${h.uiAmount.toFixed(0)}${symSuffix}`

    // Estimate last active from tx data
    const ownerTxs = transactions.filter((tx) =>
      (tx.accountData ?? []).some((a) => a.account === h.owner)
    )
    let last = 'unknown'
    if (ownerTxs.length > 0) {
      const latest = Math.max(...ownerTxs.map((t) => t.timestamp))
      const diff   = Math.floor((NOW() / 1000 - latest) / 3600)
      last = diff < 1 ? 'just now' : diff < 24 ? `${diff}h ago` : `${Math.floor(diff / 24)}d ago`
    }

    return { addr: shortAddr, type, pct: `${pct}%`, holdings, last }
  })

  // Detect activity peak from tx timestamps
  const hourBuckets = Array(24).fill(0)
  for (const tx of transactions) {
    const h = new Date(tx.timestamp * 1000).getUTCHours()
    hourBuckets[h]++
  }
  const peakHour = hourBuckets.indexOf(Math.max(...hourBuckets))
  const days     = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayBuckets = Array(7).fill(0)
  for (const tx of transactions) {
    const d = new Date(tx.timestamp * 1000).getUTCDay()
    dayBuckets[d]++
  }
  const peakDay = days[dayBuckets.indexOf(Math.max(...dayBuckets))]
  const heatPeak = `${peakDay} ${String(peakHour).padStart(2, '0')}:00 UTC`

  return {
    wallets,
    distribution: [
      { label: 'Whales',  pct: whalePct,   color: '#4f6ef7' },
      { label: 'Active',  pct: activePct,  color: '#f0f0f4' },
      { label: 'New',     pct: newPct,     color: '#8a8a9a' },
      { label: 'Dormant', pct: dormantPct, color: '#2a2a30' },
    ],
    whalePct,
    activePct,
    newPct,
    dormantPct,
    activeCount: recentlyActive.size,
    heatPeak,
  }
}

export function buildInsights(params: {
  symbol:     string
  whalePct:   number
  activePct:  number
  newPct:     number
  dormantPct: number
  priceUp:    boolean
  priceChange: number
  volumeUp:   boolean
  volumeChange: number
  heatPeak:   string
  // Optional enriched fields
  whaleCount?:  number
  activeCount?: number
  newCount?:    number
  totalSampled?: number
  buySellRatio?: number
  networkActiveUsers?: number
}): Insight[] {
  const {
    whalePct,
    dormantPct,
    newPct,
    volumeUp,
    volumeChange,
    whaleCount,
    activeCount,
    newCount,
    totalSampled,
    networkActiveUsers,
  } = params

  const sampled = totalSampled ?? 20
  const estimatedActive = activeCount ?? Math.round((params.activePct / 100) * sampled)
  const activeWallets = networkActiveUsers && networkActiveUsers > 0 ? networkActiveUsers : estimatedActive
  const newWallets = newCount ?? Math.round((newPct / 100) * sampled)

  return [
    {
      tag: 'User / Network Activity',
      text: volumeUp
        ? `Network participation is strengthening: ${activeWallets} active wallets in the sampled holder set and 24h volume up ${volumeChange.toFixed(1)}%. This supports product-market pull.`
        : `Network participation is softening: only ${activeWallets} active wallets in the sampled holder set and 24h volume down ${Math.abs(volumeChange).toFixed(1)}%. PMF signal is weakening.`,
      metric: '24h participation trend',
      val: `${activeWallets > 0 ? activeWallets.toLocaleString() : 'N/A'} active / ${volumeUp ? '+' : ''}${volumeChange.toFixed(1)}% vol`,
      sentiment: volumeUp ? 'positive' : 'warning',
    },
    {
      tag: 'Emissions vs Selling Pressure',
      text: dormantPct > 55
        ? `Dormancy is elevated (${dormantPct}%), which can convert into latent sell pressure if unlocked rewards/emissions are not absorbed by new demand.`
        : `Dormancy is moderate (${dormantPct}%), suggesting current circulation is healthier and less likely to face abrupt emission-driven exits.`,
      metric: 'Dormant holder share',
      val: `${dormantPct}% dormant`,
      sentiment: dormantPct > 55 ? 'warning' : 'neutral',
    },
    {
      tag: 'Holder Quality & Distribution',
      text: whalePct > 35
        ? `${whaleCount ?? 'Large'} whale cohort controls ${whalePct}% of supply. Conviction may be high, but community resilience is lower due to concentration risk.`
        : `Whales control ${whalePct}% of supply with ${newWallets} new wallets recently added. Distribution is healthier for community-led conviction.`,
      metric: 'Whale concentration',
      val: `${whalePct}% controlled`,
      sentiment: whalePct > 35 ? 'negative' : 'positive',
    },
    {
      tag: 'Liquidity & Market Health',
      text: volumeUp
        ? `Improving turnover (volume +${volumeChange.toFixed(1)}%) suggests better market efficiency and easier entry/exit for participants.`
        : `Lower turnover (volume ${volumeChange.toFixed(1)}%) points to thinner liquidity and weaker market efficiency; large trades may move price disproportionately.`,
      metric: 'Liquidity proxy',
      val: `${volumeUp ? 'Expanding' : 'Contracting'} flow`,
      sentiment: volumeUp ? 'positive' : 'warning',
    },
  ]
}


export function buildActions(params: {
  symbol:     string
  whalePct:   number
  dormantPct: number
  newPct:     number
  volumeUp:   boolean
  heatPeak:   string
}): Action[] {
  const { symbol: s, whalePct, dormantPct, newPct, volumeUp, heatPeak } = params
  const [peakDay, peakHour] = heatPeak.split(' ')

  const concentrationRisk = whalePct >= 35
  const retentionRisk = newPct >= 20 && dormantPct >= 30
  const distributionWeak = dormantPct >= 45

  return [
    {
      title: concentrationRisk ? 'De-risk whale concentration' : 'Compound high-intent holders',
      desc: concentrationRisk
        ? `Whales control ${whalePct}% of supply. Lower fragility by converting large holders into long-horizon lockers and widening medium-wallet ownership.`
        : `Concentration is manageable. Double down on wallets already showing conviction to increase hold time and reduce churn.` ,
      cta: concentrationRisk ? 'Launch lock program' : 'Build loyalty ladder',
      priority: 'high',
      steps: concentrationRisk ? [
        { label: 'Map top-wallet behavior', detail: `Segment top 25 $${s} wallets by last activity (0–3d, 4–14d, 15d+). Prioritize the most active 30% for direct outreach.` },
        { label: 'Offer lock-in utility', detail: 'Create 30/60/90-day lock tiers with progressively stronger utility (alpha room, early feature access, governance weight).' },
        { label: 'Add anti-dump unlock design', detail: 'Stagger unlock windows and pre-announce unlock calendars so sell pressure is smoothed instead of clustered.' },
        { label: 'Measure dispersion weekly', detail: 'Track top-10 and top-25 concentration delta weekly. Success target: reduce top-10 concentration by 2–4% over 30 days.' },
      ] : [
        { label: 'Identify quality cohorts', detail: `Build 3 cohorts: newly acquired, repeat buyers, and >14 day holders for $${s}.` },
        { label: 'Design progression rewards', detail: 'Reward behaviors, not just balances: holding duration, governance participation, and referral conversions.' },
        { label: 'Run weekly wallet missions', detail: 'Ship one on-chain or community mission per week with transparent completion criteria and wallet-based eligibility.' },
        { label: 'Track retention improvement', detail: 'Measure holder retention at day-7 and day-30 after each mission and iterate rewards accordingly.' },
      ],
    },
    {
      title: retentionRisk ? 'Fix new-wallet retention loop' : 'Scale acquisition with conversion guardrails',
      desc: retentionRisk
        ? `New-wallet inflow is strong (${newPct}%) but dormancy is elevated (${dormantPct}%). Shift from awareness campaigns to onboarding + activation loops.`
        : `Acquisition conditions are favorable. Pair growth campaigns with conversion checkpoints so incoming wallets become active participants.` ,
      cta: retentionRisk ? 'Deploy onboarding funnel' : 'Plan growth sprint',
      priority: 'high',
      steps: retentionRisk ? [
        { label: 'Day-0 onboarding pack', detail: `Deliver a clear "what to do next" path for new $${s} wallets in the first 24h (claim, join, stake, vote, referral).` },
        { label: '72h activation trigger', detail: 'Run a timed quest that requires one meaningful action within 72h of first wallet interaction.' },
        { label: 'Lifecycle messaging', detail: 'Send segmented updates by wallet age (0–3d, 4–14d, 15+d) with one single CTA per message.' },
        { label: 'Close-loop metric', detail: 'Primary KPI: activation rate of new wallets within 72h. Secondary KPI: 14-day dormant conversion.' },
      ] : [
        { label: 'Define campaign hypothesis', detail: 'Pick one growth hypothesis: partner exposure, creator amplification, or wallet incentive.' },
        { label: 'Attach conversion event', detail: 'Every campaign CTA must map to an on-chain or measurable community action within 48h.' },
        { label: 'Set stop-loss rules', detail: 'If conversion per wallet drops below target for 2 consecutive days, pause and reallocate budget.' },
        { label: 'Scale winners only', detail: 'Increase spend/effort only on channels with above-target conversion and retention, not raw impressions.' },
      ],
    },
    {
      title: distributionWeak ? 'Re-activate dormant supply' : 'Exploit momentum with precision timing',
      desc: distributionWeak
        ? `Dormant share is ${dormantPct}%. Treat this as recoverable demand: reactivation is cheaper than net-new acquisition.`
        : `Use the peak activity window (${peakDay} ${peakHour}) for high-impact launches and coordinated amplification.` ,
      cta: distributionWeak ? 'Run reactivation campaign' : `Schedule ${peakDay} launch`,
      priority: volumeUp ? 'high' : 'medium',
      steps: distributionWeak ? [
        { label: 'Create dormant segments', detail: 'Split dormant wallets by inactivity length (14–30d, 31–60d, 60d+) and prioritize shortest inactivity first.' },
        { label: 'Design comeback incentive', detail: 'Offer a small, expiring benefit tied to one on-chain action to reactivate behavior, not just passive claims.' },
        { label: 'Use proof-based messaging', detail: 'Share transparent campaign stats publicly (reactivated wallets, actions completed, retention after 7 days).' },
        { label: 'Prevent relapse', detail: 'Queue follow-up missions within 5–7 days so reactivated wallets do not return to dormant status.' },
      ] : [
        { label: 'Prepare content stack', detail: `Draft launch post, proof tweet, and follow-up thread for ${peakDay} ${peakHour} UTC.` },
        { label: 'Coordinate distribution', detail: 'Align community mods, partner accounts, and KOL allies with a synchronized publish window.' },
        { label: 'Trigger social proof quickly', detail: 'Within 2 hours, publish live adoption/progress signals to reinforce momentum.' },
        { label: 'Post-mortem in 24h', detail: 'Evaluate volume lift, active wallet lift, and conversion quality to refine the next launch cadence.' },
      ],
    },
  ]
}


export function buildTweets(params: {
  symbol:     string
  holders:    number
  volume:     string
  priceUp:    boolean
  priceChange: number
  volumeUp:   boolean
  dormantPct: number
  whalePct:   number
  heatPeak:   string
}): Tweet[] {
  const { symbol: s, holders, volume, priceUp, priceChange, volumeUp, dormantPct, whalePct, heatPeak } = params
  const [peakDay, peakHour] = heatPeak.split(' ')

  const narrative = volumeUp
    ? `Participation is accelerating and execution speed matters.`
    : `Participation cooled, which is where strong communities separate from hype cycles.`

  return [
    {
      type: 'Market Narrative Thread',
      category: 'announcement',
      hook: 'Turn data into a conviction story',
      body: `$${s} update:
• Holders: ${holders.toLocaleString()}
• 24h volume: ${volume}
• Price: ${priceUp ? '+' : ''}${priceChange.toFixed(1)}%

${narrative}

Next execution window: ${peakDay} ${peakHour} UTC.`,
    },
    {
      type: 'Retention CTA',
      category: 'engagement',
      hook: 'Drive an action, not just impressions',
      body: `If you hold $${s}, do one thing today:
1) Check your wallet segment
2) Complete this week’s mission
3) Invite 1 aligned holder

We’re optimizing for high-signal community growth, not vanity metrics.`,
    },
    {
      type: 'Risk Transparency Post',
      category: 'community',
      hook: 'Earn trust with honest metrics',
      body: `Current structure snapshot for $${s}:
• Whale concentration: ${whalePct}%
• Dormant share: ${dormantPct}%

We track these publicly because sustainable growth > short-term noise.`,
    },
    {
      type: 'Momentum / Rebuild Signal',
      category: volumeUp ? 'alpha' : 'community',
      hook: volumeUp ? 'Press the advantage while flow is strong' : 'Build depth while others go quiet',
      body: volumeUp
        ? `Volume is expanding. We’re using this window to convert attention into long-term holders through targeted activation.`
        : `Lower volume is not a setback — it’s an opportunity to tighten holder quality and improve retention fundamentals.`,
    },
  ]
}

