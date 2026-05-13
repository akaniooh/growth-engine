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
  } = params

  const sampled = totalSampled ?? 20
  const activeWallets = activeCount ?? Math.round((params.activePct / 100) * sampled)
  const newWallets = newCount ?? Math.round((newPct / 100) * sampled)

  return [
    {
      tag: 'User / Network Activity',
      text: volumeUp
        ? `Network participation is strengthening: ${activeWallets} active wallets in the sampled holder set and 24h volume up ${volumeChange.toFixed(1)}%. This supports product-market pull.`
        : `Network participation is softening: only ${activeWallets} active wallets in the sampled holder set and 24h volume down ${Math.abs(volumeChange).toFixed(1)}%. PMF signal is weakening.`,
      metric: '24h participation trend',
      val: `${volumeUp ? '+' : ''}${volumeChange.toFixed(1)}% volume`,
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

  return [
    {
      title: dormantPct > 40 ? 'Re-engage dormant holders' : 'Reward active traders',
      desc:  dormantPct > 40
        ? `${dormantPct}% of wallets are silent. A small targeted airdrop for wallets inactive 14+ days can reactivate them cheaply.`
        : `Your active base is healthy. Lock in loyalty with exclusive tiers, governance access, or early-release perks.`,
      cta:      dormantPct > 40 ? 'Build segment' : 'Design tiers',
      priority: dormantPct > 40 ? 'high' : 'medium',
      steps: dormantPct > 40 ? [
        { label: 'Segment dormant wallets', detail: `Filter all $${s} holders for wallets with zero transactions in the last 14 days using Helius or Solscan.` },
        { label: 'Design the wake-up hook', detail: 'Prepare a small symbolic airdrop — enough to trigger a wallet notification and remind them they hold your token.' },
        { label: 'Set a response window', detail: 'Give a 72h window: wallets that interact after receiving the drop qualify for a second, larger reward.' },
        { label: 'Broadcast the campaign', detail: `Post on X and Telegram: "Dormant $${s} wallets — check your wallet." Create urgency without revealing the full reward.` },
        { label: 'Measure reactivation rate', detail: 'Track on-chain activity from the target list over 7 days. 15–20% reactivation is a successful campaign.' },
      ] : [
        { label: 'Define your tiers', detail: `Create 3 tiers: Bronze (any holder), Silver (hold >30 days), Gold (top 5% by $${s} volume traded).` },
        { label: 'Set up a verification gate', detail: 'Use Holder Verify or Grape Protocol to gate a Discord role by wallet signature.' },
        { label: 'Define tier benefits', detail: 'Gold: private channel + early announcements. Silver: exclusive role + monthly AMA. Bronze: community badge.' },
        { label: 'Announce publicly', detail: 'Post the tier breakdown with a "check your tier" link to reconnect dormant holders.' },
      ],
      resources: [
        { label: 'Streamflow Finance', url: 'https://streamflow.finance' },
        { label: 'Helius wallet data', url: 'https://helius.dev' },
        { label: 'Grape Protocol', url: 'https://grapes.network' },
      ],
    } as Action,
    {
      title: `Post on ${peakDay} at ${peakHour}`,
      desc:  `Real on-chain data shows your audience is most active at this UTC window. Front-load announcements, campaign launches, and threads here.`,
      cta:      'Plan content',
      priority: 'medium',
      steps: [
        { label: 'Confirm your peak window', detail: `On-chain data shows ${peakDay} ${peakHour} UTC as your highest-activity window. Cross-check with your last 3 announcements.` },
        { label: 'Draft your post', detail: 'Write the announcement now. Hook in the first line, a key stat or milestone, and a single CTA.' },
        { label: 'Schedule on Buffer or Hypefury', detail: `Set the post to go live at ${peakHour} ${peakDay}. Queue a follow-up thread 2h later.` },
        { label: 'Prep community channels', detail: 'Have your Telegram/Discord announcement ready to fire 30 min after the X post.' },
      ],
      resources: [
        { label: 'Buffer (scheduling)', url: 'https://buffer.com' },
        { label: 'Hypefury', url: 'https://hypefury.com' },
      ],
    } as Action,
    {
      title: volumeUp
        ? 'Ride the volume breakout'
        : whalePct > 25
        ? 'Reduce whale concentration risk'
        : 'Grow new wallet inflow',
      desc: volumeUp
        ? `Volume is up — this window lasts 48–72h. Launch your next campaign, partner announcement, or CT thread today.`
        : whalePct > 25
        ? `Introduce staking or lock mechanisms to reduce exit pressure from large holders and signal long-term commitment.`
        : `Partner with an active Solana project for a cross-community drop. Target 5–10K fresh wallets in a single event.`,
      cta: volumeUp ? 'Draft campaign' : whalePct > 25 ? 'Design lock mechanism' : 'Find partners',
      priority: 'high',
      steps: volumeUp ? [
        { label: 'List all pending content', detail: 'Gather announcements, memes, and partnership reveals. Rank by impact.' },
        { label: 'Build a 48h calendar', detail: 'Post 3–5 times over 48h, spaced 8–10h apart. Lead with your biggest news.' },
        { label: 'Coordinate amplifiers', detail: 'DM 3–5 CT accounts with an embargoed brief so they amplify at the right time.' },
        { label: 'Pin a thread', detail: 'Write a 5-tweet momentum thread and pin it to your profile for the breakout window.' },
      ] : whalePct > 25 ? [
        { label: 'Identify top whale wallets', detail: `Pull the top 10 $${s} holders. Note which are CT-linked vs anonymous.` },
        { label: 'Design a locking incentive', detail: 'Offer exclusive rewards for locking: governance NFT, private channel access, or next-drop allocation.' },
        { label: 'Deploy a lock contract', detail: 'Use Streamflow with 30/60/90 day periods and tiered rewards.' },
        { label: 'Announce the programme', detail: 'Post that locking wallets get named recognition + early access. This signals confidence.' },
      ] : [
        { label: 'Identify partner candidates', detail: 'Find Solana projects with 20K+ holders and complementary audiences.' },
        { label: 'Pitch a mutual airdrop', detail: 'Propose a swap airdrop: both communities get a small allocation of the other token.' },
        { label: 'Define eligibility', detail: `Require holding both tokens to qualify. Drives cross-holding and locks in new $${s} wallets.` },
        { label: 'Co-announce simultaneously', detail: 'Both projects post at the same time to maximise combined reach.' },
      ],
      resources: volumeUp
        ? [{ label: 'Buffer', url: 'https://buffer.com' }, { label: 'TweetDeck', url: 'https://tweetdeck.twitter.com' }]
        : whalePct > 25
        ? [{ label: 'Streamflow Finance', url: 'https://streamflow.finance' }]
        : [{ label: 'Solana ecosystem', url: 'https://solana.com/ecosystem' }, { label: 'Streamflow', url: 'https://streamflow.finance' }],
    } as Action,
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

  return [
    {
      type: 'Volume Signal',
      category: 'announcement',
      hook: 'Ride real momentum publicly',
      body: `$${s} 24h volume: ${volume}.\n\n${volumeUp ? 'The market is building momentum.' : 'The floor is holding strong.'}\n\n${holders.toLocaleString()} wallets. Not leaving.`,
    },
    {
      type: 'Price Move',
      category: 'announcement',
      hook: 'Capture attention on real price action',
      body: `$${s} is ${priceUp ? 'up' : 'down'} ${Math.abs(priceChange).toFixed(1)}% today.\n\n${priceUp ? 'Momentum is real.' : 'Accumulation window is open.'}\n\nOn-chain data doesn't lie.`,
    },
    {
      type: 'Holder Milestone',
      category: 'community',
      hook: 'Social proof from real holder data',
      body: `${holders.toLocaleString()} wallets holding $${s}.\n\nEvery single one made a decision.\n\nThe community keeps growing.`,
    },
    {
      type: 'Builder Post',
      category: 'community',
      hook: 'Show long-term commitment',
      body: `We're not here to pump $${s}.\n\nWe're here to build something that outlasts every cycle.\n\nThe community makes that possible.`,
    },
    {
      type: dormantPct > 40 ? 'Wake-Up Drop' : 'Holder Reward',
      category: 'campaign',
      hook: dormantPct > 40 ? 'Re-activate dormant holders' : 'Incentivise loyalty',
      body: dormantPct > 40
        ? `${dormantPct}% of $${s} holders have been quiet.\n\nThis week, we wake them up.\n\nIf your wallet has been idle — check back in 24 hours.`
        : `Rewarding $${s} holders this week.\n\nLong-term wallets only.\n\nStay tuned for the snapshot date.`,
    },
    {
      type: 'Snapshot Tease',
      category: 'campaign',
      hook: 'Create urgency to hold',
      body: `$${s} snapshot incoming.\n\nHold your position continuously to qualify.\n\nSell before then and you're out.\n\nSimple.`,
    },
    {
      type: 'Engagement Poll',
      category: 'engagement',
      hook: 'Drive replies and reach',
      body: `How long have you held $${s}?\n\n🟦 Less than a week\n🟩 1–4 weeks\n🟨 1–3 months\n🟥 Since day one\n\nDrop it below 👇`,
    },
    {
      type: 'Conviction Hold',
      category: 'engagement',
      hook: 'Keep holders from panic selling',
      body: `The $${s} holders who haven't checked the chart in a week are going to be the most surprised.\n\nStay off the charts. Stay convicted.`,
    },
    {
      type: 'On-Chain Alpha',
      category: 'alpha',
      hook: 'Real data builds credibility',
      body: `$${s} on-chain data:\n\n→ ${holders.toLocaleString()} total holders\n→ ${whalePct}% whale concentration\n→ Peak activity: ${peakDay} ${peakHour}\n\nTrade with context.`,
    },
    {
      type: 'Timing Alpha',
      category: 'alpha',
      hook: 'Data-driven post timing',
      body: `Best time to post about $${s}: ${peakDay} ${peakHour} UTC\n\nVolume is ${volumeUp ? 'building' : 'consolidating'}.\n\nPost accordingly.`,
    },
  ]
}
