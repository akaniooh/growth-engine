export type WalletType = 'whale' | 'active' | 'new' | 'dormant'

export interface Wallet {
  addr: string
  type: WalletType
  pct: string
  holdings: string
  last: string
}

export interface Distribution {
  label: string
  pct: number
  color: string
}

export interface Insight {
  tag: string
  text: string
  metric: string
  val: string
  sentiment: 'neutral' | 'positive' | 'negative' | 'warning'
}

export interface ActionStep {
  label: string
  detail: string
}

export interface Action {
  title: string
  desc: string
  cta: string
  priority: 'high' | 'medium' | 'low'
  steps: ActionStep[]
  resources?: { label: string; url: string }[]
}

export interface Tweet {
  type: string
  category: 'engagement' | 'announcement' | 'community' | 'campaign' | 'alpha'
  body: string
  hook?: string
}

export interface TokenData {
  name: string
  symbol: string
  mint: string     // token address or demo key
  holders: number
  holdersChange: string
  holdersUp: boolean
  volume: string
  volumeChange: string
  volumeUp: boolean
  price: string
  priceChange: string
  priceUp: boolean
  activeTraders: number
  activeTradersChange: string
  activeTradersUp: boolean
  wallets: Wallet[]
  distribution: Distribution[]
  volume7d: number[]
  marketCap: number      // current market cap in USD
  marketCap7d: number[]  // 7-day market cap series
  heatPeak: string
  insights: Insight[]
  actions: Action[]
  tweets: Tweet[]
}

export const MOCK_DATA: Record<string, TokenData> = {
  BONK: {
    name: 'BONK',
    symbol: 'BONK',
    mint: 'BONK',
    holders: 284701,
    holdersChange: '+2,310',
    holdersUp: true,
    volume: '$8.4M',
    volumeChange: '+34%',
    volumeUp: true,
    price: '$0.0000182',
    priceChange: '+5.2%',
    priceUp: true,
    activeTraders: 1840,
    activeTradersChange: '+12%',
    activeTradersUp: true,
    wallets: [
      { addr: '4D22...N9Fn', type: 'whale', pct: '3.83%', holdings: '3.8T BONK', last: '1h ago' },
      { addr: 'U3mn...VcJe', type: 'whale', pct: '3.71%', holdings: '3.7T BONK', last: '3h ago' },
      { addr: 'u1vr...xS44', type: 'whale', pct: '1.39%', holdings: '1.4T BONK', last: '6h ago' },
      { addr: '6gBt...UJaJ', type: 'active', pct: '0.82%', holdings: '820.0B BONK', last: '4m ago' },
      { addr: 'j1jM...H3mB', type: 'active', pct: '0.79%', holdings: '790.0B BONK', last: '11m ago' },
      { addr: 'PEBh...T7ep', type: 'active', pct: '0.74%', holdings: '740.0B BONK', last: '28m ago' },
      { addr: 'TXAw...NY64', type: 'active', pct: '0.74%', holdings: '740.0B BONK', last: '47m ago' },
      { addr: 'Tyat...XXfb', type: 'active', pct: '0.73%', holdings: '730.0B BONK', last: '1h ago' },
      { addr: 'Fr5a...FT5Q', type: 'active', pct: '0.72%', holdings: '720.0B BONK', last: '2h ago' },
      { addr: '4tFG...bj5r', type: 'new', pct: '0.7%', holdings: '700.0B BONK', last: '5m ago' },
      { addr: 'pjBq...LfwF', type: 'new', pct: '0.69%', holdings: '690.0B BONK', last: '18m ago' },
      { addr: 'K6AK...bP4s', type: 'new', pct: '0.59%', holdings: '590.0B BONK', last: '33m ago' },
      { addr: 'nNVb...CXTu', type: 'new', pct: '0.58%', holdings: '580.0B BONK', last: '51m ago' },
      { addr: 'X5pE...6neB', type: 'new', pct: '0.53%', holdings: '530.0B BONK', last: '1h ago' },
      { addr: 'HHe7...HnJV', type: 'new', pct: '0.52%', holdings: '520.0B BONK', last: '2h ago' },
      { addr: 'XEEd...ndU8', type: 'new', pct: '0.43%', holdings: '430.0B BONK', last: '3h ago' },
      { addr: 'Lw4n...8yXs', type: 'dormant', pct: '0.41%', holdings: '410.0B BONK', last: '8d ago' },
      { addr: 'CHAq...Z2AS', type: 'dormant', pct: '0.4%', holdings: '400.0B BONK', last: '12d ago' },
      { addr: 'TPvq...8tW9', type: 'dormant', pct: '0.34%', holdings: '340.0B BONK', last: '15d ago' },
      { addr: 'kaGH...mMUM', type: 'dormant', pct: '0.31%', holdings: '310.0B BONK', last: '19d ago' },
      { addr: 'mcbB...sJe7', type: 'dormant', pct: '0.3%', holdings: '300.0B BONK', last: '22d ago' },
      { addr: 'P3UF...T4zd', type: 'dormant', pct: '0.28%', holdings: '280.0B BONK', last: '27d ago' },
      { addr: 'rfVB...5M8Y', type: 'dormant', pct: '0.26%', holdings: '260.0B BONK', last: '31d ago' },
      { addr: 'jjP6...tYC7', type: 'dormant', pct: '0.25%', holdings: '250.0B BONK', last: '35d ago' },
      { addr: 'vhr6...Vtgh', type: 'dormant', pct: '0.19%', holdings: '190.0B BONK', last: '42d ago' },
      { addr: 'Chgd...PPj9', type: 'dormant', pct: '0.17%', holdings: '170.0B BONK', last: '48d ago' },
      { addr: 'RvUu...YJDL', type: 'dormant', pct: '0.17%', holdings: '170.0B BONK', last: '55d ago' },
      { addr: 'ET4b...2KEx', type: 'dormant', pct: '0.12%', holdings: '120.0B BONK', last: '60d ago' },
      { addr: '5LHG...m6T2', type: 'dormant', pct: '0.07%', holdings: '70.0B BONK', last: '72d ago' },
      { addr: 'x1xY...z93P', type: 'dormant', pct: '0.03%', holdings: '30.0B BONK', last: '90d ago' },
    ],
    distribution: [
      { label: 'Whales',  pct: 22, color: '#4f6ef7' },
      { label: 'Active',  pct: 31, color: '#f0f0f4' },
      { label: 'New',     pct: 18, color: '#8a8a9a' },
      { label: 'Dormant', pct: 29, color: '#2a2a30' },
    ],
    volume7d: [3.2, 5.1, 4.7, 6.3, 8.1, 7.4, 8.4],
    marketCap: 1820000,
    marketCap7d: [1650000, 1720000, 1690000, 1750000, 1810000, 1790000, 1820000],
    heatPeak: 'Tue 14:00 UTC',
    insights: [
      {
        tag: 'Audience',
        text: 'Growth is driven by small active wallets, not whales. Your 10 largest holders have been inactive for 3+ days.',
        metric: 'Whale activity this week',
        val: '↓ 67%',
        sentiment: 'warning',
      },
      {
        tag: 'Timing',
        text: 'Engagement spikes between 12–16:00 UTC on weekdays. Weekend volume consistently runs 40% lower.',
        metric: 'Optimal post window',
        val: 'Tue–Thu, 13:00 UTC',
        sentiment: 'positive',
      },
      {
        tag: 'Retention',
        text: '18% of your holders are new in the last 48h. They arrived on momentum but haven\'t been given a reason to stay.',
        metric: 'Estimated churn risk',
        val: '~12% of new buyers',
        sentiment: 'negative',
      },
      {
        tag: 'Concentration',
        text: 'Top 2 wallets hold 7.3% combined supply. A coordinated exit could trigger a cascade — build loyalty ahead of cycle.',
        metric: 'Whale concentration',
        val: '7.3% in 2 wallets',
        sentiment: 'negative',
      },
    ],
    actions: [
      {
        title: 'Reward small holders',
        desc: 'Run an airdrop or engagement campaign targeting wallets with <0.5% supply. They are your compounding growth engine.',
        cta: 'Draft campaign',
        priority: 'high',
        steps: [
          { label: 'Export holder list', detail: 'Pull all wallets holding <0.5% supply from your token analytics. Filter for wallets active in the last 30 days.' },
          { label: 'Set reward criteria', detail: 'Define the qualifying threshold (e.g. hold ≥500M BONK for 7+ days). Snapshot date should be announced 48h in advance.' },
          { label: 'Prepare airdrop', detail: 'Use Streamflow or Wormhole to batch-distribute rewards. Set amount per wallet — even 10M BONK per holder drives engagement.' },
          { label: 'Announce publicly', detail: 'Post the campaign on X/Twitter with exact eligibility rules 24–48h before snapshot. Pin the post.' },
          { label: 'Execute & verify', detail: 'Run the airdrop transaction. Share the on-chain proof in your community immediately after.' },
        ],
        resources: [
          { label: 'Streamflow (batch airdrop)', url: 'https://streamflow.finance' },
          { label: 'Helius holder export', url: 'https://docs.helius.dev' },
        ],
      },
      {
        title: 'Time your next announcement',
        desc: 'Schedule major posts for Tue/Wed 13:00 UTC when trade volume peaks 2.3× above average.',
        cta: 'Set reminder',
        priority: 'medium',
        steps: [
          { label: 'Confirm your peak window', detail: 'On-chain data shows Tue–Thu 12:00–16:00 UTC as your highest-activity window. Cross-check with your last 3 announcements.' },
          { label: 'Draft your post', detail: 'Write the announcement now. Include a clear hook in the first line, a key stat or milestone, and a single CTA.' },
          { label: 'Schedule on Buffer or Hypefury', detail: 'Set the post to go live at 13:00 UTC Tuesday or Wednesday. Queue a follow-up thread for 2h later.' },
          { label: 'Prep community channels', detail: 'Have your Telegram/Discord announcement ready to fire 30 min after the X post goes live.' },
        ],
        resources: [
          { label: 'Buffer (scheduling)', url: 'https://buffer.com' },
          { label: 'Hypefury (Twitter scheduler)', url: 'https://hypefury.com' },
        ],
      },
      {
        title: 'Re-engage top whales',
        desc: 'Your top 10 holders haven\'t traded in 3 days. Send exclusive alpha or early access to reactivate them.',
        cta: 'Identify wallets',
        priority: 'high',
        steps: [
          { label: 'Pull top 10 wallet addresses', detail: 'Export the top 10 holders by supply % from the Wallet table above. Note their last-active timestamp.' },
          { label: 'Research wallet history', detail: 'Use Solscan or Step Finance to check what other tokens these wallets hold. This tells you what kind of value they respond to.' },
          { label: 'Craft personalised outreach', detail: 'If wallets are linked to known CT accounts, DM them with exclusive info — early access, governance rights, or a private group invite.' },
          { label: 'Create a whale-only channel', detail: 'Set up a private Telegram group for wallets holding >1%. Invite them with a wallet-verification bot like Holder Verify.' },
          { label: 'Monitor response', detail: 'Check on-chain activity 48–72h after outreach. Any movement from these wallets signals re-engagement.' },
        ],
        resources: [
          { label: 'Solscan (wallet explorer)', url: 'https://solscan.io' },
          { label: 'Step Finance (portfolio)', url: 'https://step.finance' },
          { label: 'Holder Verify (gating)', url: 'https://holderverify.com' },
        ],
      },
    ],
    tweets: [
      {
        type: 'Holder Reward Drop',
        category: 'campaign',
        hook: 'Surprise incoming for small holders',
        body: 'Rewarding our smallest $BONK holders this week.\n\nIf you hold under 1B — you\'re getting a surprise.\n\nDiamond hands beat whale hands.\n\nStay tuned. 👀',
      },
      {
        type: 'Weekly Airdrop Tease',
        category: 'campaign',
        hook: 'Create urgency before the drop',
        body: '48 hours left to qualify for the $BONK holder reward.\n\nRequirements:\n• Hold at least 500M $BONK\n• Wallet active in last 7 days\n\nSimple. Rewarding loyalty.',
      },
      {
        type: 'New Holder Welcome',
        category: 'community',
        hook: 'Make new buyers feel part of something',
        body: '50,000 new $BONK wallets in 48 hours.\n\nWelcome to the pack.\n\nHere\'s what you need to know:\n→ Diamond hands get rewarded\n→ The community moves together\n→ You got in early',
      },
      {
        type: 'Community Milestone',
        category: 'community',
        hook: 'Social proof + belonging',
        body: '284,701 wallets holding $BONK.\n\nNot because someone told them to.\n\nBecause the dog bites different.',
      },
      {
        type: 'Volume Spike Alert',
        category: 'announcement',
        hook: 'Ride the momentum publicly',
        body: '$BONK volume just hit $8.4M in 24 hours.\n\n+34% vs yesterday.\n\nSomething is building. Pay attention.',
      },
      {
        type: 'Price Breakout',
        category: 'announcement',
        hook: 'Capture FOMO at peak attention',
        body: '$BONK is up 5.2% in the last 24h while the market sleeps.\n\nWhales are quiet.\n\nThe small hands are running this one.',
      },
      {
        type: 'Engagement Rally',
        category: 'engagement',
        hook: 'Drive replies and shares',
        body: 'Drop your $BONK bag size below 👇\n\nNo judgment. Just vibes.\n\nWe\'re building a map of the pack.',
      },
      {
        type: 'Retention Hook',
        category: 'engagement',
        hook: 'Stop holders from selling',
        body: 'Before you sell your $BONK — ask yourself:\n\nWhy did you buy it?\n\nThe answer is still true.',
      },
      {
        type: 'Whale Watch',
        category: 'alpha',
        hook: 'On-chain intel builds credibility',
        body: 'On-chain data: top 2 $BONK wallets haven\'t moved in 72 hours.\n\n7.3% of supply. Sitting still.\n\nEither they know something — or they\'re waiting for you to sell.',
      },
      {
        type: 'Timing Alpha',
        category: 'alpha',
        hook: 'Share data-backed insights',
        body: '$BONK data drop:\n\nBest time to post about $BONK: Tue–Thu, 13:00 UTC\nVolume peak: 2.3× higher than weekends\nMost active segment: small wallets\n\nPost accordingly.',
      },
    ],
  },
  WIF: {
    name: 'dogwifhat',
    symbol: 'WIF',
    mint: 'WIF',
    holders: 91330,
    holdersChange: '+840',
    holdersUp: true,
    volume: '$21.7M',
    volumeChange: '+58%',
    volumeUp: true,
    price: '$2.14',
    priceChange: '+11.4%',
    priceUp: true,
    activeTraders: 4210,
    activeTradersChange: '+28%',
    activeTradersUp: true,
    wallets: [
      { addr: 'qBZ5...DFur', type: 'whale', pct: '3.14%', holdings: '31.37M WIF', last: '1h ago' },
      { addr: 'ps8Y...WZmK', type: 'whale', pct: '2.4%', holdings: '23.97M WIF', last: '3h ago' },
      { addr: 'qZhc...7RTu', type: 'whale', pct: '1.37%', holdings: '13.69M WIF', last: '6h ago' },
      { addr: 'XgBv...Qzaf', type: 'active', pct: '0.86%', holdings: '8.59M WIF', last: '4m ago' },
      { addr: 'r3MH...FtFw', type: 'active', pct: '0.74%', holdings: '7.39M WIF', last: '11m ago' },
      { addr: 'Q3kX...nsYR', type: 'active', pct: '0.7%', holdings: '6.99M WIF', last: '28m ago' },
      { addr: 'UmF5...cQTf', type: 'active', pct: '0.67%', holdings: '6.69M WIF', last: '47m ago' },
      { addr: 'Ehd5...FgL4', type: 'active', pct: '0.64%', holdings: '6.39M WIF', last: '1h ago' },
      { addr: 'xuxv...a47u', type: 'active', pct: '0.62%', holdings: '6.19M WIF', last: '2h ago' },
      { addr: 'pmNf...1jVC', type: 'new', pct: '0.6%', holdings: '5.99M WIF', last: '5m ago' },
      { addr: '2mv7...gnx3', type: 'new', pct: '0.57%', holdings: '5.69M WIF', last: '18m ago' },
      { addr: 'Vzau...Xq5w', type: 'new', pct: '0.57%', holdings: '5.69M WIF', last: '33m ago' },
      { addr: 'cv83...rc6W', type: 'new', pct: '0.56%', holdings: '5.59M WIF', last: '51m ago' },
      { addr: 'x8Zt...WRu3', type: 'new', pct: '0.54%', holdings: '5.39M WIF', last: '1h ago' },
      { addr: 'j6gz...6cA4', type: 'new', pct: '0.5%', holdings: '4.99M WIF', last: '2h ago' },
      { addr: 'mQeB...hS9z', type: 'new', pct: '0.39%', holdings: '3.90M WIF', last: '3h ago' },
      { addr: 'PZ5V...MexA', type: 'dormant', pct: '0.38%', holdings: '3.80M WIF', last: '8d ago' },
      { addr: '6h2t...xZwy', type: 'dormant', pct: '0.38%', holdings: '3.80M WIF', last: '12d ago' },
      { addr: 'YLDn...gRfU', type: 'dormant', pct: '0.31%', holdings: '3.10M WIF', last: '15d ago' },
      { addr: 'CYnb...QKK9', type: 'dormant', pct: '0.3%', holdings: '3.00M WIF', last: '19d ago' },
      { addr: 'CMUA...ttMa', type: 'dormant', pct: '0.27%', holdings: '2.70M WIF', last: '22d ago' },
      { addr: 'bV3S...GbGL', type: 'dormant', pct: '0.27%', holdings: '2.70M WIF', last: '27d ago' },
      { addr: 'Zg7A...dFAv', type: 'dormant', pct: '0.22%', holdings: '2.20M WIF', last: '31d ago' },
      { addr: '8YAN...vQ38', type: 'dormant', pct: '0.21%', holdings: '2.10M WIF', last: '35d ago' },
      { addr: 'jcCT...eK6q', type: 'dormant', pct: '0.2%', holdings: '2.00M WIF', last: '42d ago' },
      { addr: 'MeKm...HkJ4', type: 'dormant', pct: '0.15%', holdings: '1.50M WIF', last: '48d ago' },
      { addr: '89Gf...jwBt', type: 'dormant', pct: '0.14%', holdings: '1.40M WIF', last: '55d ago' },
      { addr: 'bRXr...zvFT', type: 'dormant', pct: '0.13%', holdings: '1.30M WIF', last: '60d ago' },
      { addr: 'mCyR...Je4g', type: 'dormant', pct: '0.1%', holdings: '998.9K WIF', last: '72d ago' },
      { addr: 'ZdKR...Z1z5', type: 'dormant', pct: '0.08%', holdings: '799.1K WIF', last: '90d ago' },
    ],
    distribution: [
      { label: 'Whales',  pct: 38, color: '#4f6ef7' },
      { label: 'Active',  pct: 27, color: '#f0f0f4' },
      { label: 'New',     pct: 14, color: '#8a8a9a' },
      { label: 'Dormant', pct: 21, color: '#2a2a30' },
    ],
    volume7d: [12, 9.4, 11.2, 14.8, 18.6, 20.1, 21.7],
    marketCap: 2140000000,
    marketCap7d: [1920000000, 1980000000, 2050000000, 2100000000, 2090000000, 2120000000, 2140000000],
    heatPeak: 'Mon 16:00 UTC',
    insights: [
      {
        tag: 'Concentration Risk',
        text: 'Top 2 wallets hold 11.9% of supply — highest concentration in the top 10 meme tokens. A single exit equals a significant drawdown.',
        metric: 'Risk score',
        val: '8.4 / 10',
        sentiment: 'negative',
      },
      {
        tag: 'Momentum',
        text: 'You are in a volume breakout. 4,210 active traders today vs 3,289 trailing average. This window typically lasts 48–72 hours.',
        metric: 'Volume vs 7D avg',
        val: '+58% today',
        sentiment: 'positive',
      },
      {
        tag: 'Acquisition',
        text: 'New holders are arriving via CT viral loops, not organic search. Lean into meme content and influencer threads this week.',
        metric: 'Referral source',
        val: '~73% CT viral',
        sentiment: 'neutral',
      },
      {
        tag: 'Timing',
        text: 'Monday and Tuesday are your strongest trading days. Volume drops 44% from Thursday through Sunday.',
        metric: 'Mon/Tue vs weekend',
        val: '2.4× higher',
        sentiment: 'positive',
      },
    ],
    actions: [
      {
        title: 'Hedge whale concentration',
        desc: 'Create incentives for large holders to lock positions — staking, governance roles, or long-term holder tiers.',
        cta: 'Design lock mechanism',
        priority: 'high',
        steps: [
          { label: 'Identify top 10 whale wallets', detail: 'Pull the top 10 holders from the wallet table. Note which ones are CT-linked vs anonymous.' },
          { label: 'Design a locking incentive', detail: 'Offer exclusive rewards for locking: governance NFT, private channel access, or a dedicated allocation in the next drop.' },
          { label: 'Deploy a lock contract', detail: 'Use Streamflow Finance or a simple escrow program. Lock periods of 30, 60, or 90 days with tiered rewards.' },
          { label: 'Announce the programme', detail: 'Post publicly that whale wallets locking their position get named recognition + early access. This signals confidence to the market.' },
          { label: 'Track lock-up rate', detail: 'Monitor on-chain lock progress weekly. Report % of supply locked to the community as a confidence signal.' },
        ],
        resources: [
          { label: 'Streamflow Finance', url: 'https://streamflow.finance' },
          { label: 'Solscan token explorer', url: 'https://solscan.io' },
        ],
      },
      {
        title: 'Activate the breakout window',
        desc: 'Volume spike window: 48–72h. Front-load meme campaigns, partner announcements and CT threads today.',
        cta: 'Schedule posts',
        priority: 'high',
        steps: [
          { label: 'List all content assets', detail: 'Gather all pending announcements, memes, partnership reveals, and milestones. Rank by impact.' },
          { label: 'Build a 48h content calendar', detail: 'Post 3–5 times across the next 48h. Space them 8–10h apart. Start with the biggest news first to ride the initial spike.' },
          { label: 'Coordinate with influencers', detail: 'DM 3–5 CT accounts with WIF content already. Send them an embargoed brief so they can amplify at the right time.' },
          { label: 'Pin a thread on X', detail: 'Write a 5-tweet thread summarising the current momentum. Pin it to your profile for the duration of the breakout window.' },
          { label: 'Monitor and respond', detail: 'Stay online during peak hours. Reply to every significant post mentioning $WIF to extend reach algorithmically.' },
        ],
        resources: [
          { label: 'Buffer (scheduling)', url: 'https://buffer.com' },
          { label: 'TweetDeck (monitoring)', url: 'https://tweetdeck.twitter.com' },
        ],
      },
      {
        title: 'Engage viral amplifiers',
        desc: 'New holders arrive via CT loops. Identify the top 5 accounts posting $WIF content in the last 6h and engage.',
        cta: 'Find amplifiers',
        priority: 'medium',
        steps: [
          { label: 'Search recent $WIF posts', detail: 'Search "WIF" or "$WIF" on X sorted by Latest. Filter for accounts with >5K followers posting in the last 6h.' },
          { label: 'Rank by engagement rate', detail: 'Prioritise accounts whose WIF posts are getting high reply/retweet ratios relative to their follower count.' },
          { label: 'Engage authentically', detail: 'Reply with on-chain data or a fresh insight — not just emojis. Data-backed replies get pinned and shared more.' },
          { label: 'DM top 3 accounts', detail: 'Offer them early access to your next announcement in exchange for a scheduled post. Keep the ask simple.' },
          { label: 'Track referral wallets', detail: 'After the collab post, watch for new wallets that first buy within 24h. These are your attributable referrals.' },
        ],
        resources: [
          { label: 'X Advanced Search', url: 'https://twitter.com/search-advanced' },
          { label: 'Followerwonk (influencer search)', url: 'https://followerwonk.com' },
        ],
      },
    ],
    tweets: [
      {
        type: 'Breakout Signal',
        category: 'announcement',
        hook: 'Ride the volume momentum publicly',
        body: '$WIF volume just hit $21.7M in 24 hours.\n\n+58% vs yesterday.\n\nThe hat is moving. The market knows it.',
      },
      {
        type: 'New ATH Tease',
        category: 'announcement',
        hook: 'Build anticipation before a catalyst',
        body: 'Something is happening with $WIF.\n\nOn-chain data doesn\'t lie.\n\n4,210 active traders today.\n\nPay attention.',
      },
      {
        type: 'Holder Count Flex',
        category: 'community',
        hook: 'Social proof at scale',
        body: '91,330 wallets holding $WIF.\n\nEvery single one got in because someone told someone else.\n\nThe hat speaks for itself. 🎩',
      },
      {
        type: 'Origin Story',
        category: 'community',
        hook: 'Remind holders why this exists',
        body: '$WIF started as a photo of a dog.\n\nNow it\'s a $200M community.\n\nThe internet has never lied about what matters.',
      },
      {
        type: 'Whale Lock Campaign',
        category: 'campaign',
        hook: 'Incentivise long-term holding',
        body: 'Calling $WIF whales.\n\nLock your position for 30 days.\n\nWhat you get in return is being announced Thursday.\n\nDiamonds only.',
      },
      {
        type: 'New Buyer Onboard',
        category: 'campaign',
        hook: 'Convert new buyers into long-term holders',
        body: 'Just bought $WIF for the first time?\n\nHere\'s your starter pack:\n→ Join the TG\n→ Follow the wallet trackers\n→ Set a price alert\n→ Don\'t panic sell\n\nWelcome.',
      },
      {
        type: 'Poll Drop',
        category: 'engagement',
        hook: 'Maximize replies and reach',
        body: 'How long have you held $WIF?\n\n🟦 Less than a week\n🟩 1–4 weeks\n🟨 1–3 months\n🟥 Since the beginning\n\nRT so we can map the community.',
      },
      {
        type: 'Conviction Post',
        category: 'engagement',
        hook: 'Build emotional attachment',
        body: 'The $WIF holders who haven\'t checked the price in a week are going to be the most surprised.\n\nStay off the charts. Stay convicted.',
      },
      {
        type: 'Concentration Warning',
        category: 'alpha',
        hook: 'Transparent on-chain data builds trust',
        body: 'Transparency on $WIF:\n\nTop 2 wallets = 11.9% of supply.\n\nWe\'re watching. We\'re building holder incentives.\n\nLong-term > short-term exits.',
      },
      {
        type: 'Peak Hours Alpha',
        category: 'alpha',
        hook: 'Data-driven credibility',
        body: '$WIF is most active Mon/Tue before 17:00 UTC.\n\n2.4× more volume than weekends.\n\nIf you\'re going to trade — know when the market is watching.',
      },
    ],
  },
  POPCAT: {
    name: 'POPCAT',
    symbol: 'POPCAT',
    mint: 'POPCAT',
    holders: 52400,
    holdersChange: '+310',
    holdersUp: true,
    volume: '$3.8M',
    volumeChange: '-8%',
    volumeUp: false,
    price: '$0.412',
    priceChange: '-2.1%',
    priceUp: false,
    activeTraders: 730,
    activeTradersChange: '-6%',
    activeTradersUp: false,
    wallets: [
      { addr: 'UxeK...Y5RU', type: 'whale', pct: '2.67%', holdings: '26.17M POPCAT', last: '1h ago' },
      { addr: '4Kjc...S3Z7', type: 'whale', pct: '2.36%', holdings: '23.13M POPCAT', last: '3h ago' },
      { addr: 'Buju...NYuZ', type: 'whale', pct: '2.16%', holdings: '21.17M POPCAT', last: '6h ago' },
      { addr: 'eQCV...trYM', type: 'active', pct: '0.86%', holdings: '8.43M POPCAT', last: '4m ago' },
      { addr: 'sWu9...PN6G', type: 'active', pct: '0.84%', holdings: '8.23M POPCAT', last: '11m ago' },
      { addr: 'apjv...Uhdd', type: 'active', pct: '0.79%', holdings: '7.74M POPCAT', last: '28m ago' },
      { addr: 'AFdH...2csz', type: 'active', pct: '0.77%', holdings: '7.55M POPCAT', last: '47m ago' },
      { addr: 'ZD4r...x3uC', type: 'active', pct: '0.75%', holdings: '7.35M POPCAT', last: '1h ago' },
      { addr: 'PeNm...9ehH', type: 'active', pct: '0.72%', holdings: '7.06M POPCAT', last: '2h ago' },
      { addr: 'L7rg...wRFR', type: 'new', pct: '0.7%', holdings: '6.86M POPCAT', last: '5m ago' },
      { addr: 'xbWz...LHMw', type: 'new', pct: '0.64%', holdings: '6.27M POPCAT', last: '18m ago' },
      { addr: 'UTuS...2jJN', type: 'new', pct: '0.56%', holdings: '5.49M POPCAT', last: '33m ago' },
      { addr: 'wzH5...HH81', type: 'new', pct: '0.48%', holdings: '4.70M POPCAT', last: '51m ago' },
      { addr: 'SbZC...hm2d', type: 'new', pct: '0.4%', holdings: '3.92M POPCAT', last: '1h ago' },
      { addr: '46wD...FKED', type: 'new', pct: '0.38%', holdings: '3.72M POPCAT', last: '2h ago' },
      { addr: 'gpG9...prKm', type: 'new', pct: '0.37%', holdings: '3.63M POPCAT', last: '3h ago' },
      { addr: 'nV4y...6d6f', type: 'dormant', pct: '0.37%', holdings: '3.63M POPCAT', last: '8d ago' },
      { addr: 'zxPR...5VfR', type: 'dormant', pct: '0.37%', holdings: '3.63M POPCAT', last: '12d ago' },
      { addr: 'vJTY...xvwu', type: 'dormant', pct: '0.35%', holdings: '3.43M POPCAT', last: '15d ago' },
      { addr: '7zPW...mVaM', type: 'dormant', pct: '0.34%', holdings: '3.33M POPCAT', last: '19d ago' },
      { addr: 'cKeq...wEaK', type: 'dormant', pct: '0.33%', holdings: '3.23M POPCAT', last: '22d ago' },
      { addr: 'rnFF...BTSF', type: 'dormant', pct: '0.29%', holdings: '2.84M POPCAT', last: '27d ago' },
      { addr: '5nKP...7Ekk', type: 'dormant', pct: '0.28%', holdings: '2.74M POPCAT', last: '31d ago' },
      { addr: 'ZafX...Lb7d', type: 'dormant', pct: '0.28%', holdings: '2.74M POPCAT', last: '35d ago' },
      { addr: 'vPQa...sYmE', type: 'dormant', pct: '0.26%', holdings: '2.55M POPCAT', last: '42d ago' },
      { addr: '41Yx...r8Q1', type: 'dormant', pct: '0.18%', holdings: '1.76M POPCAT', last: '48d ago' },
      { addr: 'KywR...YrqX', type: 'dormant', pct: '0.16%', holdings: '1.57M POPCAT', last: '55d ago' },
      { addr: 'uH1B...3Uya', type: 'dormant', pct: '0.06%', holdings: '588.0K POPCAT', last: '60d ago' },
      { addr: 'VBGm...M9WN', type: 'dormant', pct: '0.04%', holdings: '392.0K POPCAT', last: '72d ago' },
      { addr: '4Rhq...R9ua', type: 'dormant', pct: '0.03%', holdings: '294.0K POPCAT', last: '90d ago' },
    ],
    distribution: [
      { label: 'Whales',  pct: 19, color: '#4f6ef7' },
      { label: 'Active',  pct: 16, color: '#f0f0f4' },
      { label: 'New',     pct: 7,  color: '#8a8a9a' },
      { label: 'Dormant', pct: 58, color: '#2a2a30' },
    ],
    volume7d: [7.2, 6.1, 5.4, 4.8, 4.2, 4.1, 3.8],
    marketCap: 412000000,
    marketCap7d: [480000000, 460000000, 445000000, 430000000, 420000000, 415000000, 412000000],
    heatPeak: 'Wed 11:00 UTC',
    insights: [
      {
        tag: 'Critical',
        text: '58% of holders are dormant — they bought during a previous pump and have since disengaged. Volume has declined 7 consecutive days.',
        metric: 'Dormant holder rate',
        val: '58% (critical)',
        sentiment: 'negative',
      },
      {
        tag: 'Opportunity',
        text: 'Only 7% new buyer inflow this week. A viral moment or cross-community drop could re-ignite the growth cycle.',
        metric: 'New wallet inflow',
        val: '↓ 7% this week',
        sentiment: 'warning',
      },
      {
        tag: 'Core Base',
        text: 'Your 16% active traders are maintaining volume despite the downtrend. Reward them before attrition accelerates.',
        metric: 'Active trader stability',
        val: 'Holding steady',
        sentiment: 'neutral',
      },
      {
        tag: 'Pattern',
        text: 'Wednesday mornings 09–12 UTC are your only consistent activity spike. Use this window for every community touchpoint.',
        metric: 'Reliable engagement window',
        val: 'Wed 09–12 UTC',
        sentiment: 'neutral',
      },
    ],
    actions: [
      {
        title: 'Wake dormant holders',
        desc: 'Run a re-engagement campaign targeting wallets silent for 14+ days. Small airdrop with a CTA to return.',
        cta: 'Build segment',
        priority: 'high',
        steps: [
          { label: 'Segment dormant wallets', detail: 'Filter all POPCAT holders for wallets with zero transactions in the last 14 days. This is your target list.' },
          { label: 'Design the wake-up hook', detail: 'Prepare a small airdrop (even symbolic amounts work). The goal is to trigger a wallet notification and remind them they hold POPCAT.' },
          { label: 'Set a response window', detail: 'Give a 72h window: wallets that interact (swap, transfer, or vote) after receiving the airdrop qualify for a second, larger reward.' },
          { label: 'Broadcast the campaign', detail: 'Announce on X and Telegram: "Dormant POPCAT wallets — check your wallet. Something just landed." Create urgency without revealing the full reward.' },
          { label: 'Measure reactivation rate', detail: 'Track how many dormant wallets show on-chain activity within 7 days. Aim for 15–20% reactivation rate as success.' },
        ],
        resources: [
          { label: 'Streamflow Finance', url: 'https://streamflow.finance' },
          { label: 'Helius wallet data', url: 'https://helius.dev' },
        ],
      },
      {
        title: 'Cross-community drop',
        desc: 'Partner with an active Solana project for a joint token distribution. Target 10K+ fresh wallets in one event.',
        cta: 'Find partners',
        priority: 'high',
        steps: [
          { label: 'Identify partner candidates', detail: 'Look for Solana projects with active communities, 20K+ token holders, and complementary audiences. Meme tokens and gaming projects work well.' },
          { label: 'Pitch the collab', detail: 'Reach out to their team: propose a mutual token swap airdrop. Both communities receive a small allocation of the other token. Low cost, high reach.' },
          { label: 'Define eligibility rules', detail: 'Agree on holder minimums for both sides. Example: hold ≥100 POPCAT AND ≥X of partner token to qualify. Drives cross-holding.' },
          { label: 'Co-create the announcement', detail: 'Draft a joint announcement post. Both projects post simultaneously to maximise reach. Share meme assets for the community to amplify.' },
          { label: 'Execute and track', detail: 'Run the airdrop on the agreed date. Track net new POPCAT wallets acquired within 48h as your conversion metric.' },
        ],
        resources: [
          { label: 'Solana project directory', url: 'https://solana.com/ecosystem' },
          { label: 'Streamflow batch airdrop', url: 'https://streamflow.finance' },
        ],
      },
      {
        title: 'Protect your core traders',
        desc: '16% active traders kept volume alive. Give them exclusive roles, governance power, or early access before the next cycle.',
        cta: 'Design tier system',
        priority: 'medium',
        steps: [
          { label: 'Define your tiers', detail: 'Create 3 tiers based on holding amount and activity: Bronze (any holder), Silver (hold >30 days), Gold (top 5% by volume traded).' },
          { label: 'Set up a verification gate', detail: 'Use Holder Verify or Grape Protocol to create a wallet-gated Discord role. Members prove their tier by signing a message.' },
          { label: 'Define tier benefits', detail: 'Gold: private channel + early access to announcements. Silver: exclusive role + monthly AMA. Bronze: community badge.' },
          { label: 'Announce the tier system', detail: 'Post the tier breakdown publicly. Include a "check your tier" link. This drives dormant holders to reconnect and check their status.' },
          { label: 'Maintain the system', detail: 'Snapshot tiers weekly. Publicly celebrate tier upgrades to incentivise continued activity.' },
        ],
        resources: [
          { label: 'Grape Protocol (gating)', url: 'https://grapes.network' },
          { label: 'Holder Verify', url: 'https://holderverify.com' },
          { label: 'Guild.xyz (role management)', url: 'https://guild.xyz' },
        ],
      },
    ],
    tweets: [
      {
        type: 'Wake-Up Drop',
        category: 'campaign',
        hook: 'Re-activate dormant holders',
        body: 'If you\'ve been sleeping on $POPCAT — this is your signal.\n\nHolders from day one are being recognised this week.\n\nCheck your wallet. 🐱',
      },
      {
        type: 'Re-entry Incentive',
        category: 'campaign',
        hook: 'Pull dormant buyers back in',
        body: '$POPCAT snapshot incoming.\n\nWallets that held through the last 30 days qualify.\n\nDormant holders: you have 48 hours to reactivate.\n\nDon\'t sleep twice.',
      },
      {
        type: 'Loyal Core Recognition',
        category: 'community',
        hook: 'Reward your most loyal segment',
        body: '16% of $POPCAT holders have been trading every single week.\n\nThrough the dips. Through the silence.\n\nYou\'re the foundation. You\'ll be rewarded for it.',
      },
      {
        type: 'Origin Reminder',
        category: 'community',
        hook: 'Emotional nostalgia hook',
        body: 'Every cycle has a core that stays.\n\nYou\'re ours.\n\n$POPCAT is not just a trade.\n\nIt\'s the original pop.',
      },
      {
        type: 'Collab Announcement',
        category: 'announcement',
        hook: 'Create anticipation for a partnership',
        body: '$POPCAT x [partner] is coming.\n\nFresh wallets incoming.\n\nIf you\'re already in — you\'re early to what\'s next.',
      },
      {
        type: 'Volume Floor',
        category: 'announcement',
        hook: 'Signal stability during downtrend',
        body: '$POPCAT daily volume holding at $3.8M.\n\nDown from the peak — but the floor is holding.\n\n730 active traders didn\'t get the memo to leave.',
      },
      {
        type: 'Wednesday Rally',
        category: 'engagement',
        hook: 'Activate peak engagement window',
        body: 'It\'s Wednesday.\n\nHistorically the most active day for $POPCAT.\n\nWhat are you doing with your bag today?\n\nDrop it below 👇',
      },
      {
        type: 'Holder Conviction',
        category: 'engagement',
        hook: 'Keep holders from panic selling',
        body: 'The $POPCAT holders who bought in cycle one and are still here are the ones who understand this.\n\nEveryone else is just passing through.',
      },
      {
        type: 'Dormant Wallet Data',
        category: 'alpha',
        hook: 'Transparent on-chain reality check',
        body: 'Real talk on $POPCAT:\n\n58% of holders haven\'t moved in weeks.\n\nThat\'s not bearish — that\'s a coiled spring.\n\nOne catalyst. One wake-up.',
      },
      {
        type: 'Wednesday Window',
        category: 'alpha',
        hook: 'On-chain timing insight',
        body: '$POPCAT on-chain data:\n\nOnly consistent activity spike: Wed 09–12 UTC.\n\nEvery major announcement should happen in this window.\n\nSave this.',
      },
    ],
  },
}
