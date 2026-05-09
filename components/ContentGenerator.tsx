'use client'

import { useState, useCallback } from 'react'
import { Tweet } from '@/lib/data'
import { Copy, Check, RefreshCw, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

interface ContentGeneratorProps {
  tweets: Tweet[]
  symbol: string
}

type Category = Tweet['category']
type Tone     = 'hype' | 'professional' | 'community' | 'data'

const CATEGORY_CONFIG: Record<Category, { label: string; desc: string }> = {
  announcement: { label: 'Announcements', desc: 'Volume signals and price moves'   },
  community:    { label: 'Community',     desc: 'Social proof and belonging'        },
  campaign:     { label: 'Campaigns',     desc: 'Rewards, drops and incentives'     },
  engagement:   { label: 'Engagement',    desc: 'Drive replies, polls and shares'   },
  alpha:        { label: 'Alpha',         desc: 'On-chain data and timing insights' },
}

const TONE_CONFIG: Record<Tone, { label: string; desc: string; emoji: string }> = {
  hype:         { label: 'Hype',         desc: 'High energy, FOMO-driven',     emoji: '🔥' },
  professional: { label: 'Professional', desc: 'Measured, credible tone',       emoji: '📊' },
  community:    { label: 'Community',    desc: 'Warm, inclusive language',      emoji: '🤝' },
  data:         { label: 'Data-driven',  desc: 'Numbers and on-chain facts',    emoji: '🔬' },
}

function applyTone(body: string, tone: Tone, symbol: string): string {
  if (tone === 'professional') {
    return body
      .replace(/🔥|👀|🚀|💎|🐕|🎩|🐱|🐕|⚡|📈|👇|🍳/g, '')
      .replace(/\n\n/g, '\n')
      .trim()
  }
  if (tone === 'data') {
    return `On-chain update for $${symbol}:\n\n` + body
      .replace(/🔥|👀|🚀|💎|👇|🍳/g, '')
      .trim()
  }
  if (tone === 'community') {
    return body.replace(/\.\n/g, '.\n\n') + '\n\nShare this with someone who needs to know. 🤝'
  }
  // hype — add urgency
  return body + '\n\nDon\'t say we didn\'t tell you. 🔥'
}

function generateBonusContent(symbol: string, category: Category, seed: number, tone: Tone): Tweet[] {
  const s = symbol.toUpperCase()
  const r = (n: number) => {
    const x = Math.sin(seed * 9301 + n * 49297) * 49297
    return Math.abs(x - Math.floor(x))
  }

  const pools: Record<Category, { type: string; hook: string; body: string }[]> = {
    announcement: [
      { type: 'Market Update',    hook: 'Keep holders informed',      body: `Weekly $${s} update:\n\nPrice action consolidating.\nHolder count growing.\nSmart money watching.\n\nMore to come.` },
      { type: 'Liquidity Signal', hook: 'Signal market stability',     body: `$${s} liquidity is deeper than it looks.\n\nOrder book holding on both sides.\n\nHealthy market structure.` },
      { type: 'Catalyst Hint',    hook: 'Build anticipation',          body: `Something is being finalised for $${s}.\n\nWe can't say more yet.\n\nBe in position when we do.` },
      { type: 'Volume Data',      hook: 'Lead with on-chain proof',    body: `$${s} active trader count at a new weekly high.\n\nNot bots.\n\nReal wallets with conviction.` },
    ],
    community: [
      { type: 'OG Recognition',  hook: 'Honour early holders',        body: `If you've held $${s} since the beginning —\n\nYou didn't miss it.\n\nYou ARE it.` },
      { type: 'Builder Signal',  hook: 'Show long-term intent',       body: `We're not here to hype $${s}.\n\nWe're here to build something that outlasts every cycle.` },
      { type: 'Gratitude Post',  hook: 'Strengthen community bonds',  body: `To every $${s} holder who never panicked:\n\nThank you.\n\nYou are why this works.` },
      { type: 'Question Thread', hook: 'Drive genuine engagement',    body: `What made you buy $${s}?\n\nHonestly curious.\n\nDrop it below 👇` },
    ],
    campaign: [
      { type: 'Referral Drive',  hook: 'Viral growth loop',           body: `$${s} referral programme live.\n\nBring a new holder → both wallets get rewarded.\n\nLink in bio.` },
      { type: 'Hold Campaign',   hook: 'Reduce sell pressure',        body: `Snapshot in 7 days.\n\nHold $${s} continuously to qualify.\n\nSell and you're out.` },
      { type: 'Merch Tease',    hook: 'Build brand identity',         body: `$${s} merch almost ready.\n\nHolders only.\n\nProof of hold = proof of belonging.` },
      { type: 'Trading Comp',   hook: 'Drive volume via competition', body: `$${s} Trading Competition — starts Monday.\n\nTop 20 volumes win.\n\nDetails in 24h.` },
    ],
    engagement: [
      { type: 'Price Poll',     hook: 'Maximise comment reach',       body: `Where does $${s} end the month?\n\nReply with your honest target.\n\nNo hopium — just your read.` },
      { type: 'Vibe Check',    hook: 'Community temperature check',   body: `$${s} vibe check.\n\n🟢 Bullish and adding\n🟡 Holding and watching\n🔴 Waiting for dip` },
      { type: 'Hot Take',      hook: 'Spark debate',                  body: `Hot take: $${s} holders are the most patient community in this entire ecosystem.\n\nProve me wrong.` },
      { type: 'Screenshot Drop', hook: 'FOMO participation',          body: `Drop your $${s} wallet screenshot (balance hidden, gains visible).\n\nLet's see who's been cooking. 🍳` },
    ],
    alpha: [
      { type: 'Cohort Analysis', hook: 'Deep on-chain credibility',   body: `$${s} cohort data:\n\nMonth 1 holders: 74% still holding\nMonth 2: 61% holding\nNew (30d): 18%\n\nRetention is strong.` },
      { type: 'Smart Money',    hook: 'Highlight whale behaviour',    body: `On-chain: wallets that front-ran previous pumps just added $${s} in the last 6h.\n\nDraw your own conclusions.` },
      { type: 'Volume Pattern', hook: 'Pattern recognition',          body: `$${s} volume pattern:\n\nEvery significant move preceded by 48h quiet period.\n\nWe're in one right now.` },
      { type: 'Exchange Flow',  hook: 'Sophisticated tracking',       body: `Net $${s} exchange flow this week: negative.\n\nMore leaving exchanges than arriving.\n\nAccumulation, not distribution.` },
    ],
  }

  const pool = pools[category]
  const idx1 = Math.floor(r(seed + 1) * pool.length)
  const idx2 = (idx1 + 1 + Math.floor(r(seed + 2) * (pool.length - 1))) % pool.length
  return [pool[idx1], pool[idx2]].map((p) => ({
    type:     p.type,
    category,
    hook:     p.hook,
    body:     applyTone(p.body, tone, s),
  }))
}

function TweetCard({ tweet, isNew, tone, symbol }: { tweet: Tweet; isNew?: boolean; tone: Tone; symbol: string }) {
  const [copied, setCopied] = useState(false)
  const body = applyTone(tweet.body, tone, symbol)

  const copy = async () => {
    await navigator.clipboard.writeText(body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={clsx(
      'card flex flex-col p-4 transition-all sm:p-5',
      isNew ? 'border-brand/40 bg-brand-dim' : 'hover:border-surface-muted'
    )}>
      <div className="mb-1 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-ink">{tweet.type}</span>
            {isNew && (
              <span className="rounded bg-brand/20 px-1.5 py-0.5 font-mono text-[9px] text-brand">NEW</span>
            )}
          </div>
          {tweet.hook && (
            <p className="mt-0.5 font-mono text-[10px] text-ink-tertiary">{tweet.hook}</p>
          )}
        </div>
        <button
          onClick={copy}
          className="flex flex-shrink-0 items-center gap-1.5 rounded border border-surface-border bg-surface-overlay px-2.5 py-1 font-mono text-[11px] text-ink-secondary transition-colors hover:text-ink"
        >
          {copied
            ? <Check className="h-3 w-3 text-positive" strokeWidth={2} />
            : <Copy className="h-3 w-3" strokeWidth={1.5} />
          }
          <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <p className="mt-3 flex-1 whitespace-pre-line text-sm leading-relaxed text-ink-secondary">
        {body}
      </p>
    </div>
  )
}

export function ContentGenerator({ tweets, symbol }: ContentGeneratorProps) {
  const categoryOrder: Category[] = ['announcement', 'community', 'campaign', 'engagement', 'alpha']
  const presentCats = categoryOrder.filter((c) => tweets.some((t) => t.category === c))

  const [active, setActive]         = useState<Category>(presentCats[0] ?? 'announcement')
  const [tone, setTone]             = useState<Tone>('hype')
  const [toneOpen, setToneOpen]     = useState(false)
  const [refreshSeed, setRefresh]   = useState(0)
  const [isRefreshing, setRefreshing] = useState(false)
  const [newCards, setNewCards]     = useState<Tweet[]>([])
  const [showNew, setShowNew]       = useState(false)

  const baseTweets = tweets.filter((t) => t.category === active)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    setShowNew(false)
    await new Promise((r) => setTimeout(r, 600))
    const next = refreshSeed + 1
    setRefresh(next)
    setNewCards(generateBonusContent(symbol, active, next * 13 + active.length, tone))
    setShowNew(true)
    setRefreshing(false)
  }, [active, refreshSeed, symbol, tone])

  const handleTab = (cat: Category) => {
    setActive(cat)
    setShowNew(false)
    setNewCards([])
    setRefresh(0)
  }

  const displayed = showNew ? newCards : baseTweets

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Content Generator</h2>
          <p className="mt-0.5 text-xs text-ink-secondary">
            {tweets.length} posts · {presentCats.length} categories · ${symbol}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tone selector */}
          <div className="relative">
            <button
              onClick={() => setToneOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded border border-surface-border bg-surface-raised px-3 py-1.5 font-mono text-[11px] text-ink-secondary transition-colors hover:border-surface-muted hover:text-ink"
            >
              <span>{TONE_CONFIG[tone].emoji}</span>
              <span className="hidden sm:inline">{TONE_CONFIG[tone].label}</span>
              <ChevronDown className={clsx('h-3 w-3 transition-transform', toneOpen && 'rotate-180')} strokeWidth={1.5} />
            </button>

            {toneOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-surface-border bg-surface-raised shadow-xl">
                {(Object.entries(TONE_CONFIG) as [Tone, typeof TONE_CONFIG[Tone]][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => { setTone(key); setToneOpen(false) }}
                    className={clsx(
                      'flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors first:rounded-t-lg last:rounded-b-lg',
                      tone === key ? 'bg-brand-dim' : 'hover:bg-surface-overlay'
                    )}
                  >
                    <span className="text-sm">{cfg.emoji}</span>
                    <div>
                      <p className={clsx('text-xs font-medium', tone === key ? 'text-brand' : 'text-ink')}>
                        {cfg.label}
                      </p>
                      <p className="font-mono text-[10px] text-ink-tertiary">{cfg.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded border border-surface-border bg-surface-raised px-3 py-1.5 font-mono text-[11px] text-ink-secondary transition-colors hover:border-surface-muted hover:text-ink disabled:opacity-50"
          >
            <RefreshCw className={clsx('h-3.5 w-3.5', isRefreshing && 'animate-spin')} strokeWidth={1.5} />
            <span className="hidden sm:inline">{isRefreshing ? 'Generating…' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1.5 pb-1" style={{ width: 'max-content', minWidth: '100%' }}>
          {presentCats.map((cat) => {
            const count = tweets.filter((t) => t.category === cat).length
            const cfg   = CATEGORY_CONFIG[cat]
            return (
              <button
                key={cat}
                onClick={() => handleTab(cat)}
                className={clsx(
                  'flex flex-shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-[11px] transition-colors sm:text-xs',
                  active === cat
                    ? 'border-brand bg-brand-dim text-ink'
                    : 'border-surface-border bg-surface-raised text-ink-secondary hover:border-surface-muted hover:text-ink'
                )}
              >
                <span className="font-medium">{cfg.label}</span>
                <span className={clsx(
                  'rounded px-1.5 py-0.5 font-mono text-[9px]',
                  active === cat ? 'bg-brand/20 text-brand' : 'bg-surface-overlay text-ink-tertiary'
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Status */}
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[11px] text-ink-tertiary">
          {CATEGORY_CONFIG[active].desc} · Tone: {TONE_CONFIG[tone].label}
        </p>
        {showNew && (
          <button
            onClick={() => { setShowNew(false); setNewCards([]) }}
            className="font-mono text-[11px] text-ink-tertiary underline underline-offset-2 hover:text-ink"
          >
            Show originals
          </button>
        )}
      </div>

      {/* Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {isRefreshing
          ? Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="card flex h-40 animate-pulse items-center justify-center p-5">
                <div className="w-full space-y-2">
                  <div className="h-3 w-1/3 rounded bg-surface-muted" />
                  <div className="h-2 w-full rounded bg-surface-muted/60" />
                  <div className="h-2 w-4/5 rounded bg-surface-muted/60" />
                </div>
              </div>
            ))
          : displayed.map((t, i) => (
              <TweetCard
                key={`${active}-${refreshSeed}-${i}`}
                tweet={t}
                tone={tone}
                symbol={symbol}
                isNew={showNew}
              />
            ))
        }
      </div>

      <p className="mt-4 text-center font-mono text-[10px] text-ink-tertiary">
        {showNew
          ? `Refreshed content · ${TONE_CONFIG[tone].label} tone`
          : 'Switch tone or hit Refresh for new variations'
        }
      </p>
    </div>
  )
}
