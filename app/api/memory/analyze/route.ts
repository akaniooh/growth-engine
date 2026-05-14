import { NextRequest, NextResponse } from 'next/server'
import { loadMemory } from '@/lib/memory'

export async function POST(req: NextRequest) {
  const { mint } = await req.json()
  if (!mint) return NextResponse.json({ error: 'mint required' }, { status: 400 })

  const mem = loadMemory(mint)
  const eventsWithOutcome = mem.events.filter((e) => e.outcome || e.negative_effect)

  if (eventsWithOutcome.length === 0) {
    return NextResponse.json({
      patterns: [],
      summary: null,
      message: 'No outcomes recorded yet. Add outcomes to your decisions to unlock AI analysis.',
    })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    // No API key — run local rule-based analysis as fallback
    return NextResponse.json(runLocalAnalysis(mem.founder_goals, eventsWithOutcome))
  }

  const decisionLog = eventsWithOutcome.map((e, i) => {
    const lines = [`Decision ${i + 1} (${e.date})`]
    lines.push(`  Action: ${e.action_taken}`)
    if (e.reason) lines.push(`  Reason: ${e.reason}`)
    lines.push(`  Category: ${e.tags.join(', ')}`)
    if (e.outcome) lines.push(`  What worked: ${e.outcome}`)
    if (e.negative_effect) lines.push(`  Downside: ${e.negative_effect}`)
    return lines.join('\n')
  }).join('\n\n')

  const goalContext = mem.founder_goals
    ? `The founder's primary goal is: ${mem.founder_goals.primary.replace(/_/g, ' ')}.${
        mem.founder_goals.secondary.length > 0
          ? ` Secondary goals: ${mem.founder_goals.secondary.map(g => g.replace(/_/g, ' ')).join(', ')}.`
          : ''
      }`
    : 'No founder goals set.'

  const prompt = `You are an expert token strategy analyst with deep knowledge of crypto tokenomics, community dynamics, and on-chain behavior.

A token founder has recorded the following decisions and outcomes for their token:

${goalContext}

DECISION HISTORY:
${decisionLog}

Analyze this history like a senior strategist. Your job:
1. Identify 2-4 REAL patterns, risks, or strategic insights from this specific history
2. Point out what is working and what is not — based on their actual outcomes
3. Warn about recurring mistakes or emerging risks
4. Connect decisions to their stated goals — are they aligned?

Rules:
- Be direct and specific. Reference their actual decisions and outcomes by name.
- Do NOT be generic. Ground everything in their real data.
- Each insight should be 1-3 sharp sentences.

Respond with valid JSON only. No markdown. Format:
{
  "patterns": [
    {
      "title": "Short title (3-6 words)",
      "insight": "1-3 sentence strategic insight grounded in their actual data",
      "type": "risk" | "strength" | "warning" | "opportunity",
      "confidence": 0.0-1.0
    }
  ],
  "summary": "One sentence overall strategic read on where this token stands."
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error(`[memory/analyze] Anthropic ${response.status}:`, errText)
      // Fall back to local analysis rather than showing an error
      return NextResponse.json(runLocalAnalysis(mem.founder_goals, eventsWithOutcome))
    }

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json({
      patterns: parsed.patterns ?? [],
      summary: parsed.summary ?? null,
      event_count: eventsWithOutcome.length,
      source: 'ai',
    })
  } catch (err) {
    console.error('[memory/analyze] error:', err)
    // Fall back to local analysis
    return NextResponse.json(runLocalAnalysis(mem.founder_goals, eventsWithOutcome))
  }
}

// ── Local rule-based fallback (no API key needed) ─────────────────────────────
// Produces meaningful analysis from the actual decision data without calling Claude

function runLocalAnalysis(
  goals: ReturnType<typeof loadMemory>['founder_goals'],
  events: ReturnType<typeof loadMemory>['events']
) {
  const patterns: { title: string; insight: string; type: string; confidence: number }[] = []

  const withPositive = events.filter((e) => e.outcome)
  const withDownside = events.filter((e) => e.negative_effect)
  const allTags = events.flatMap((e) => e.tags)

  // Count tag frequency
  const tagCount: Record<string, number> = {}
  for (const t of allTags) tagCount[t] = (tagCount[t] ?? 0) + 1
  const topTag = Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0]

  // Pattern: what's your most repeated action type
  if (topTag && topTag[1] >= 2) {
    const tagEvents = events.filter((e) => e.tags.includes(topTag[0] as never))
    const tagOutcomes = tagEvents.filter((e) => e.outcome).map((e) => e.outcome!)
    const tagDownsides = tagEvents.filter((e) => e.negative_effect).map((e) => e.negative_effect!)
    patterns.push({
      title: `Heavy reliance on ${topTag[0]}`,
      insight: `You've used "${topTag[0]}" as your primary lever ${topTag[1]} times. ${
        tagOutcomes.length > 0 ? `It has produced: ${tagOutcomes[0]}.` : ''
      } ${tagDownsides.length > 0 ? `Watch out for: ${tagDownsides[0]}.` : ''}`.trim(),
      type: tagDownsides.length >= tagOutcomes.length ? 'warning' : 'strength',
      confidence: 0.72,
    })
  }

  // Pattern: recurring downsides
  const allDownsides = withDownside.map((e) => e.negative_effect!.toLowerCase())
  const keywords = ['sell', 'dump', 'retention', 'drop', 'exit', 'slow', 'pressure']
  for (const kw of keywords) {
    const hits = allDownsides.filter((d) => d.includes(kw))
    if (hits.length >= 2) {
      patterns.push({
        title: `Recurring "${kw}" risk`,
        insight: `"${kw}" has shown up as a negative effect in ${hits.length} of your decisions. This is not a coincidence — it's a structural pattern in how your community responds to your actions. Address the root cause, not the symptoms.`,
        type: 'risk',
        confidence: 0.78,
      })
      break // one recurring downside pattern is enough
    }
  }

  // Pattern: goal alignment check
  if (goals && withPositive.length > 0) {
    const goalWord = goals.primary.replace(/_/g, ' ')
    const aligned = withPositive.filter((e) =>
      (e.outcome ?? '').toLowerCase().includes(goalWord.split(' ')[0])
    )
    if (aligned.length === 0) {
      patterns.push({
        title: `Goal misalignment detected`,
        insight: `Your stated goal is "${goalWord}" but none of your recorded positive outcomes directly mention it. Your actions may be optimizing for visibility or short-term metrics rather than ${goalWord}. Consider whether your decisions are actually moving the needle on what matters most.`,
        type: 'warning',
        confidence: 0.65,
      })
    } else {
      patterns.push({
        title: `Decisions aligned with goal`,
        insight: `${aligned.length} of your decisions have produced outcomes that support your "${goalWord}" goal. You're building in the right direction — the key now is consistency and avoiding decisions that contradict this trajectory.`,
        type: 'strength',
        confidence: 0.70,
      })
    }
  }

  // Pattern: tradeoff awareness
  const bothSides = events.filter((e) => e.outcome && e.negative_effect)
  if (bothSides.length >= 2) {
    patterns.push({
      title: `Every action has had tradeoffs`,
      insight: `${bothSides.length} of your decisions produced both a positive outcome and a downside. This is normal, but it means you need to be deliberate about which tradeoffs are acceptable. Define your non-negotiables before your next major decision.`,
      type: 'opportunity',
      confidence: 0.68,
    })
  }

  const summary = events.length >= 3
    ? `With ${events.length} decisions recorded, ${withDownside.length > withPositive.length ? 'downsides are outpacing positives — the strategy needs rebalancing' : 'more outcomes are positive than negative — maintain discipline on what is working'}.`
    : `Early stage memory — keep logging decisions and outcomes to build a clearer strategic picture.`

  return {
    patterns: patterns.slice(0, 4),
    summary,
    event_count: events.length,
    source: 'local',
  }
}
