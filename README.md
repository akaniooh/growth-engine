# Growth Engine

On-chain creator growth intelligence for Solana tokens. Pulls wallet and token activity, classifies holders, and delivers AI-powered growth strategies.

## Stack

- **Framework** — Next.js 15 (App Router)
- **Styling** — Tailwind CSS + Geist font
- **Charts** — Recharts
- **Icons** — Lucide React
- **Data** — Helius (wallets), Birdeye (market), OpenAI (insights)

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/your-username/growth-engine.git
cd growth-engine

# 2. Install dependencies
npm install

# 3. Add environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# 4. Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

### Option A — Vercel CLI (fastest)

```bash
npm i -g vercel
vercel
```

Follow the prompts. Vercel auto-detects Next.js.

### Option B — GitHub + Vercel Dashboard

1. Push to GitHub:

```bash
git init
git add .
git commit -m "init: growth engine"
git remote add origin https://github.com/your-username/growth-engine.git
git push -u origin main
```

2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repo
4. Add environment variables in the Vercel dashboard under **Settings → Environment Variables**
5. Click **Deploy**

### Environment Variables (Vercel Dashboard)

| Key | Source |
|-----|--------|
| `HELIUS_API_KEY` | [helius.dev](https://helius.dev) |
| `BIRDEYE_API_KEY` | [birdeye.so](https://birdeye.so) |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) |

## Wiring Real APIs

The app currently uses mock data from `lib/data.ts`. To connect live data, edit `app/api/analyze/route.ts`:

### 1. Helius — Wallet & Token Data

```ts
const holdersRes = await fetch(
  `https://api.helius.xyz/v0/token-accounts?api-key=${process.env.HELIUS_API_KEY}`,
  {
    method: 'POST',
    body: JSON.stringify({ mint: tokenAddress }),
  }
)
```

### 2. Birdeye — Price & Volume

```ts
const priceRes = await fetch(
  `https://public-api.birdeye.so/defi/token_overview?address=${tokenAddress}`,
  { headers: { 'X-API-KEY': process.env.BIRDEYE_API_KEY! } }
)
```

### 3. OpenAI — Insights & Content

```ts
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    {
      role: 'user',
      content: `You are a crypto growth strategist.

Token data:
- Holders: ${holders}
- Whale wallets (>1%): ${whaleCount}
- New buyers (48h): ${newBuyers}
- Dormant wallets: ${dormant}
- Volume 24h: ${volume}
- Price change: ${priceChange}

Return JSON with:
1. insights: array of {tag, text, metric, val, sentiment}
2. actions: array of {title, desc, cta, priority}
3. tweets: array of {type, body}`,
    },
  ],
})
```

## Wallet Classification Logic

```ts
// in lib/classify.ts
function classifyWallet(wallet: WalletAccount, totalSupply: number) {
  const pct = wallet.amount / totalSupply

  if (pct > 0.01) return 'whale'

  const lastTx = wallet.lastTransaction
  const hoursSince = (Date.now() - lastTx) / 3_600_000

  if (hoursSince < 48) return 'new'
  if (hoursSince < 72) return 'active'
  return 'dormant'
}
```

## Project Structure

```
growth-engine/
├── app/
│   ├── api/analyze/route.ts   # API endpoint (swap mock → real APIs here)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ActionEngine.tsx
│   ├── ActivityHeatmap.tsx
│   ├── AIInsights.tsx
│   ├── ContentGenerator.tsx
│   ├── Dashboard.tsx
│   ├── EmptyState.tsx
│   ├── Header.tsx
│   ├── HolderBreakdown.tsx
│   ├── MetricCards.tsx
│   ├── SearchBar.tsx
│   ├── VolumeChart.tsx
│   └── WalletTable.tsx
├── lib/
│   └── data.ts                # Types + mock data
└── ...config files
```
