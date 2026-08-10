'use client'

import { useEffect, useState, useRef } from 'react'
import { Zap, Users, BarChart2, ArrowRight, Shield, Activity, ChevronDown, Brain, Clock, Copy, Check } from 'lucide-react'
import { RoverLogo } from '@/components/RoverLogo'
import Link from 'next/link'

function useCounter(target: number, duration = 2000, start = false) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!start) return
    const steps = 60
    const step = target / steps
    const interval = duration / steps
    let current = 0
    const timer = setInterval(() => {
      current += step
      if (current >= target) { setValue(target); clearInterval(timer) }
      else setValue(Math.floor(current))
    }, interval)
    return () => clearInterval(timer)
  }, [target, duration, start])
  return value
}

function StatCard({ value, label, prefix = '', suffix = '', delay = 0 }: {
  value: number; label: string; prefix?: string; suffix?: string; delay?: number
}) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { setVisible(true); observer.disconnect() }
      }, { threshold: 0.3 })
      if (ref.current) observer.observe(ref.current)
      return () => observer.disconnect()
    }, delay)
    return () => clearTimeout(timer)
  }, [delay])
  const count = useCounter(value, 2000, visible)
  return (
    <div ref={ref} className="stat-card">
      <div className="stat-value">{prefix}{count.toLocaleString()}{suffix}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc, accent, badge }: {
  icon: React.ElementType; title: string; desc: string; accent: string; badge?: string
}) {
  return (
    <div className="feature-card" style={{ '--accent': accent } as React.CSSProperties}>
      {badge && <div className="feature-badge">{badge}</div>}
      <div className="feature-icon" style={{ background: `${accent}18`, borderColor: `${accent}33`, color: accent }}>
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{desc}</p>
    </div>
  )
}

function TokenTicker() {
  const tokens = [
    { sym: 'BONK',   price: '$0.0000182', change: '+5.2%',  up: true  },
    { sym: 'WIF',    price: '$2.485',     change: '+3.5%',  up: true  },
    { sym: 'JUP',    price: '$0.512',     change: '-1.2%',  up: false },
    { sym: 'PYTH',   price: '$0.318',     change: '+8.7%',  up: true  },
    { sym: 'RNDR',   price: '$6.24',      change: '+2.1%',  up: true  },
    { sym: 'POPCAT', price: '$0.412',     change: '-0.8%',  up: false },
  ]
  return (
    <div className="ticker-wrap">
      <div className="ticker-track">
        {[...tokens, ...tokens].map((t, i) => (
          <div key={i} className="ticker-item">
            <span className="ticker-sym">{t.sym}</span>
            <span className="ticker-price">{t.price}</span>
            <span className={`ticker-change ${t.up ? 'up' : 'down'}`}>{t.change}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function WalletRow({ rank, addr, pct, type, delay }: {
  rank: number; addr: string; pct: string; type: string; delay: number
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t) }, [delay])
  return (
    <div className={`wallet-row ${visible ? 'visible' : ''}`}>
      <span className="wallet-rank">{rank}</span>
      <span className="wallet-addr">{addr}</span>
      <span className={`wallet-badge ${type}`}>{type}</span>
      <span className="wallet-pct">{pct}</span>
    </div>
  )
}

// Memory preview component — shows a mini version of the founder memory timeline
function MemoryPreview() {
  const [active, setActive] = useState(0)
  const events = [
    { tag: 'rewards',     action: 'Airdrop 5% to holders',       outcome: 'New investors +18%',   downside: 'Sell pressure +12%' },
    { tag: 'liquidity',   action: 'Expanded LP on Raydium',       outcome: 'Retention up 9%',      downside: null },
    { tag: 'partnership', action: 'Partnership with PumpFun',     outcome: 'Volume +34%',          downside: 'Mercenary buyers' },
  ]
  const tagColors: Record<string, string> = {
    rewards: '#5b6ef5', liquidity: '#00d4aa', partnership: '#f59e0b'
  }

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % events.length), 2400)
    return () => clearInterval(id)
  }, []) // eslint-disable-line

  return (
    <div className="memory-preview">
      <div className="memory-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={14} color="#5b6ef5" strokeWidth={1.5} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#eeeef8', fontWeight: 700 }}>Founder Memory</span>
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#6868a0', padding: '2px 10px', background: 'rgba(91,110,245,0.1)', borderRadius: 20, border: '1px solid rgba(91,110,245,0.2)' }}>
          Goal: Growth
        </span>
      </div>

      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#6868a0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Decision Timeline</div>
        <div style={{ position: 'relative', paddingLeft: 20 }}>
          <div style={{ position: 'absolute', left: 4, top: 6, bottom: 6, width: 1, background: 'rgba(255,255,255,0.07)' }} />
          {events.map((ev, i) => (
            <div key={i} style={{
              position: 'relative', marginBottom: 10, opacity: active === i ? 1 : 0.4,
              transition: 'opacity 0.4s ease',
            }}>
              <div style={{
                position: 'absolute', left: -20, top: 4,
                width: 9, height: 9, borderRadius: '50%',
                background: ev.downside ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.2)',
                border: `2px solid ${ev.downside ? '#22c55e' : '#22c55e'}`,
              }} />
              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8, padding: '8px 10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 9, padding: '1px 6px', borderRadius: 3,
                    background: `${tagColors[ev.tag]}18`, color: tagColors[ev.tag],
                    border: `1px solid ${tagColors[ev.tag]}33`, textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>{ev.tag}</span>
                  {ev.downside === null && (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#22c55e' }}>✓ outcome logged</span>
                  )}
                  {ev.downside && (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#22c55e' }}>✓ outcome logged</span>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#eeeef8', marginBottom: 4 }}>{ev.action}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#00d4aa' }}>↑ {ev.outcome}</div>
                {ev.downside && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#f59e0b' }}>↓ {ev.downside}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#6868a0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>AI Pattern Detected</div>
        <div style={{
          background: 'rgba(91,110,245,0.07)', border: '1px solid rgba(91,110,245,0.2)',
          borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <RoverLogo size={50} color="#5b6ef5" />
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#8888c0', lineHeight: 1.6, margin: 0 }}>
            Liquidity actions have produced stronger retention than reward-based incentives for this token.
          </p>
        </div>
      </div>
    </div>
  )
}

// TODO: set the live contract address here once available
const ROVER_CA = ''

function TokenBanner() {
  const [copied, setCopied] = useState(false)

  if (!ROVER_CA) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ROVER_CA)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API unavailable — no-op
    }
  }

  const short = `${ROVER_CA.slice(0, 4)}...${ROVER_CA.slice(-4)}`

  return (
    <section className="token-section">
      <div className="token-card">
        <div className="token-ticker-badge">
          <span className="token-ticker-dot" />
          $ROVER
        </div>
        <div className="token-divider" />
        <div className="token-ca">
          <span className="token-ca-label">CA</span>
          <span title={ROVER_CA}>{short}</span>
          <button
            className={`token-ca-copy ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            aria-label="Copy contract address"
          >
            {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  const [heroVisible, setHeroVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setHeroVisible(true), 100); return () => clearTimeout(t) }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #080810; --bg2: #0e0e1a; --bg3: #141422;
          --border: rgba(255,255,255,0.07); --border2: rgba(255,255,255,0.14);
          --ink: #eeeef8; --muted: #6868a0; --faint: #3a3a60;
          --brand: #5b6ef5; --brand2: #00d4aa; --warn: #f59e0b; --neg: #ef4444;
          --mono: 'Space Mono', monospace; --sans: 'Syne', sans-serif;
        }
        html { scroll-behavior: smooth; }
        body { background: var(--bg); color: var(--ink); font-family: var(--sans); -webkit-font-smoothing: antialiased; overflow-x: hidden; }

        /* NAV */
        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 18px 40px; background: rgba(8,8,16,0.8); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border); }
        .nav-logo { display: flex; align-items: center; gap: 10px; font-family: var(--sans); font-size: 15px; font-weight: 800; letter-spacing: -0.5px; color: var(--ink); text-decoration: none; }
        .nav-dot { width: 32px; height: 32px; background: #000; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .nav-links { display: flex; align-items: center; gap: 32px; list-style: none; }
        .nav-links a { font-family: var(--mono); font-size: 12px; color: var(--muted); text-decoration: none; transition: color 0.2s; }
        .nav-links a:hover { color: var(--ink); }
        .nav-cta { background: var(--brand); color: white !important; padding: 8px 18px; border-radius: 8px; font-family: var(--mono) !important; font-size: 12px !important; transition: opacity 0.2s !important; }
        .nav-cta:hover { opacity: 0.85; color: white !important; }

        /* TICKER */
        .ticker-wrap { background: var(--bg2); border-bottom: 1px solid var(--border); padding: 10px 0; overflow: hidden; position: fixed; top: 65px; left: 0; right: 0; z-index: 99; }
        .ticker-track { display: flex; gap: 48px; animation: ticker 30s linear infinite; width: max-content; }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ticker-item { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .ticker-sym  { font-family: var(--mono); font-size: 11px; color: var(--ink); font-weight: 700; }
        .ticker-price{ font-family: var(--mono); font-size: 11px; color: var(--muted); }
        .ticker-change{ font-family: var(--mono); font-size: 11px; font-weight: 700; }
        .ticker-change.up { color: var(--brand2); }
        .ticker-change.down { color: var(--neg); }

        /* HERO */
        .hero { min-height: 100vh; padding: 160px 40px 80px; display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; overflow: hidden; }
        .hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(91,110,245,0.18) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 60%, rgba(0,212,170,0.08) 0%, transparent 60%); pointer-events: none; }
        .hero-grid { position: absolute; inset: 0; z-index: 0; background-image: linear-gradient(rgba(91,110,245,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(91,110,245,0.06) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse 80% 70% at 50% 0%, black 0%, transparent 100%); }
        .hero-content { position: relative; z-index: 1; max-width: 860px; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(91,110,245,0.12); border: 1px solid rgba(91,110,245,0.3); border-radius: 100px; padding: 6px 16px; font-family: var(--mono); font-size: 11px; color: var(--brand); margin-bottom: 32px; opacity: 0; transform: translateY(12px); transition: all 0.6s ease; }
        .hero-badge.visible { opacity: 1; transform: translateY(0); }
        .hero-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--brand2); animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
        .hero-title { font-size: clamp(42px, 7vw, 88px); font-weight: 800; line-height: 1.0; letter-spacing: -3px; margin-bottom: 28px; opacity: 0; transform: translateY(20px); transition: all 0.7s ease 0.15s; }
        .hero-title.visible { opacity: 1; transform: translateY(0); }
        .hero-title .accent { color: var(--brand); }
        .hero-title .accent2 { color: var(--brand2); }
        .hero-sub { font-family: var(--mono); font-size: 15px; line-height: 1.8; color: var(--muted); max-width: 560px; margin: 0 auto 48px; opacity: 0; transform: translateY(16px); transition: all 0.7s ease 0.3s; }
        .hero-sub.visible { opacity: 1; transform: translateY(0); }
        .hero-actions { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; opacity: 0; transform: translateY(16px); transition: all 0.7s ease 0.45s; }
        .hero-actions.visible { opacity: 1; transform: translateY(0); }
        .btn-primary { display: inline-flex; align-items: center; gap: 8px; background: var(--brand); color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-family: var(--sans); font-size: 14px; font-weight: 700; transition: all 0.2s; box-shadow: 0 0 40px rgba(91,110,245,0.3); }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 0 60px rgba(91,110,245,0.5); }
        .btn-ghost { display: inline-flex; align-items: center; gap: 8px; background: transparent; color: var(--muted); text-decoration: none; padding: 14px 28px; border-radius: 10px; font-family: var(--mono); font-size: 13px; border: 1px solid var(--border2); transition: all 0.2s; }
        .btn-ghost:hover { color: var(--ink); border-color: rgba(255,255,255,0.25); }

        /* DASHBOARD PREVIEW */
        .preview-wrap { position: relative; z-index: 1; margin-top: 64px; width: 100%; max-width: 900px; opacity: 0; transform: translateY(40px); transition: all 0.9s ease 0.6s; }
        .preview-wrap.visible { opacity: 1; transform: translateY(0); }
        .preview-glow { position: absolute; inset: -2px; border-radius: 18px; background: linear-gradient(135deg, rgba(91,110,245,0.4), rgba(0,212,170,0.2), transparent); z-index: -1; filter: blur(1px); }
        .preview-box { background: var(--bg2); border: 1px solid var(--border2); border-radius: 16px; overflow: hidden; }
        .preview-header { background: var(--bg3); border-bottom: 1px solid var(--border); padding: 12px 16px; display: flex; align-items: center; gap: 8px; }
        .preview-dot { width: 10px; height: 10px; border-radius: 50%; }
        .preview-title { font-family: var(--mono); font-size: 11px; color: var(--muted); margin-left: 8px; }
        .preview-metrics { display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 1px solid var(--border); }
        .preview-metric { padding: 20px; border-right: 1px solid var(--border); }
        .preview-metric:last-child { border-right: none; }
        .pm-label { font-family: var(--mono); font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .pm-value { font-size: 22px; font-weight: 800; letter-spacing: -1px; color: var(--ink); margin-bottom: 4px; }
        .pm-change { font-family: var(--mono); font-size: 10px; color: var(--brand2); }
        .pm-change.neg { color: var(--neg); }
        .preview-wallets { padding: 16px; }
        .pw-header { font-family: var(--mono); font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
        .wallet-row { display: flex; align-items: center; gap: 16px; padding: 8px 12px; border-radius: 8px; border: 1px solid transparent; font-family: var(--mono); font-size: 11px; opacity: 0; transform: translateX(-8px); transition: all 0.4s ease; margin-bottom: 4px; }
        .wallet-row.visible { opacity: 1; transform: translateX(0); background: rgba(255,255,255,0.02); border-color: var(--border); }
        .wallet-rank { color: var(--faint); width: 16px; }
        .wallet-addr { color: var(--muted); flex: 1; }
        .wallet-badge { font-size: 9px; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
        .wallet-badge.whale   { background: rgba(91,110,245,0.15); color: #7b8ff7; border: 1px solid rgba(91,110,245,0.3); }
        .wallet-badge.active  { background: rgba(0,212,170,0.1);  color: var(--brand2); border: 1px solid rgba(0,212,170,0.2); }
        .wallet-badge.new     { background: rgba(245,158,11,0.1); color: var(--warn); border: 1px solid rgba(245,158,11,0.2); }
        .wallet-badge.dormant { background: rgba(104,104,160,0.1); color: var(--muted); border: 1px solid rgba(104,104,160,0.15); }
        .wallet-pct { color: var(--ink); font-weight: 700; text-align: right; }

        /* TOKEN / CA */
        .token-section { padding: 56px 40px; display: flex; justify-content: center; position: relative; z-index: 1; }
        .token-card { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; justify-content: center; background: var(--bg2); border: 1px solid var(--border2); border-radius: 100px; padding: 14px 14px 14px 28px; box-shadow: 0 0 50px rgba(91,110,245,0.1); }
        .token-ticker-badge { font-family: var(--sans); font-size: 18px; font-weight: 800; letter-spacing: -0.5px; color: var(--brand2); display: flex; align-items: center; gap: 8px; }
        .token-ticker-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--brand2); animation: pulse 2s infinite; }
        .token-divider { width: 1px; height: 24px; background: var(--border2); }
        .token-ca-label { font-family: var(--mono); font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-right: 4px; }
        .token-ca { font-family: var(--mono); font-size: 12px; color: var(--ink); background: var(--bg3); border: 1px solid var(--border); border-radius: 100px; padding: 8px 8px 8px 16px; display: flex; align-items: center; gap: 10px; }
        .token-ca-copy { display: flex; align-items: center; gap: 6px; background: var(--brand); color: white; border: none; border-radius: 100px; padding: 6px 14px; font-family: var(--mono); font-size: 11px; font-weight: 700; cursor: pointer; transition: opacity 0.2s; }
        .token-ca-copy:hover { opacity: 0.85; }
        .token-ca-copy.copied { background: var(--brand2); }
        @media (max-width: 640px) {
          .token-card { padding: 20px; border-radius: 20px; flex-direction: column; align-items: stretch; }
          .token-divider { display: none; }
          .token-ca { flex-wrap: wrap; justify-content: space-between; }
        }

        /* STATS */
        .stats-section { padding: 80px 40px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .stat-card { background: var(--bg); padding: 48px 32px; text-align: center; }
        .stat-value { font-size: clamp(32px, 4vw, 52px); font-weight: 800; letter-spacing: -2px; color: var(--ink); margin-bottom: 8px; background: linear-gradient(135deg, var(--ink), var(--brand)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .stat-label { font-family: var(--mono); font-size: 12px; color: var(--muted); }

        /* FEATURES */
        .features-section { padding: 100px 40px; max-width: 1200px; margin: 0 auto; }
        .section-label { font-family: var(--mono); font-size: 11px; color: var(--brand); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; }
        .section-title { font-size: clamp(28px, 4vw, 48px); font-weight: 800; letter-spacing: -2px; line-height: 1.1; margin-bottom: 16px; }
        .section-sub { font-family: var(--mono); font-size: 14px; color: var(--muted); line-height: 1.8; max-width: 480px; margin-bottom: 64px; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .feature-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; padding: 32px; position: relative; overflow: hidden; transition: border-color 0.3s, transform 0.3s; cursor: default; }
        .feature-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--accent, var(--brand)); opacity: 0; transition: opacity 0.3s; }
        .feature-card:hover { border-color: var(--border2); transform: translateY(-4px); }
        .feature-card:hover::before { opacity: 1; }
        .feature-badge { position: absolute; top: 16px; right: 16px; font-family: var(--mono); font-size: 9px; color: var(--brand2); background: rgba(0,212,170,0.1); border: 1px solid rgba(0,212,170,0.2); border-radius: 100px; padding: 3px 10px; text-transform: uppercase; letter-spacing: 1px; }
        .feature-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; border: 1px solid; }
        .feature-title { font-size: 16px; font-weight: 700; margin-bottom: 10px; }
        .feature-desc { font-family: var(--mono); font-size: 12px; color: var(--muted); line-height: 1.8; }

        /* MEMORY SECTION */
        .memory-section { padding: 100px 40px; background: var(--bg2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .memory-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .memory-preview { background: var(--bg); border: 1px solid var(--border2); border-radius: 16px; overflow: hidden; box-shadow: 0 0 60px rgba(91,110,245,0.08); }
        .memory-header { background: var(--bg3); border-bottom: 1px solid var(--border); padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; }
        .memory-points { display: flex; flex-direction: column; gap: 28px; }
        .memory-point { display: flex; gap: 20px; align-items: flex-start; }
        .memory-point-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .memory-point-title { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
        .memory-point-desc { font-family: var(--mono); font-size: 12px; color: var(--muted); line-height: 1.8; }

        /* HOW IT WORKS */
        .how-section { padding: 100px 40px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .how-inner { max-width: 1100px; margin: 0 auto; }
        .steps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px; margin-top: 64px; position: relative; }
        .steps-grid::before { content: ''; position: absolute; top: 28px; left: calc(12.5% + 16px); right: calc(12.5% + 16px); height: 1px; background: linear-gradient(90deg, var(--brand), var(--brand2)); }
        .step { text-align: center; }
        .step-num { width: 56px; height: 56px; border-radius: 50%; background: var(--bg); border: 2px solid var(--brand); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-family: var(--mono); font-size: 18px; font-weight: 700; color: var(--brand); position: relative; z-index: 1; }
        .step-num.memory { border-color: var(--brand2); color: var(--brand2); }
        .step-title { font-size: 15px; font-weight: 700; margin-bottom: 10px; }
        .step-desc { font-family: var(--mono); font-size: 12px; color: var(--muted); line-height: 1.8; }

        /* CTA */
        .cta-section { padding: 120px 40px; text-align: center; position: relative; overflow: hidden; }
        .cta-section::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 80% at 50% 50%, rgba(91,110,245,0.12) 0%, transparent 70%); pointer-events: none; }
        .cta-inner { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; }
        .cta-title { font-size: clamp(32px, 5vw, 60px); font-weight: 800; letter-spacing: -2px; line-height: 1.05; margin-bottom: 24px; }
        .cta-sub { font-family: var(--mono); font-size: 14px; color: var(--muted); line-height: 1.8; margin-bottom: 48px; }

        /* FOOTER */
        .footer { border-top: 1px solid var(--border); padding: 32px 40px; display: flex; align-items: center; justify-content: space-between; }
        .footer-copy { font-family: var(--mono); font-size: 11px; color: var(--faint); }
        .footer-links { display: flex; gap: 24px; }
        .footer-links a { font-family: var(--mono); font-size: 11px; color: var(--faint); text-decoration: none; transition: color 0.2s; }
        .footer-links a:hover { color: var(--muted); }

        /* SCROLL */
        .scroll-hint { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; opacity: 0.4; z-index: 1; animation: bounce 2s ease-in-out infinite; }
        @keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(6px)} }
        .scroll-hint span { font-family: var(--mono); font-size: 10px; color: var(--muted); }

        @media (max-width: 900px) {
          .nav { padding: 16px 20px; }
          .nav-links { display: none; }
          .hero { padding: 140px 20px 60px; }
          .stats-section { grid-template-columns: repeat(2, 1fr); }
          .features-grid { grid-template-columns: 1fr; }
          .steps-grid { grid-template-columns: 1fr; }
          .steps-grid::before { display: none; }
          .preview-metrics { grid-template-columns: repeat(2, 1fr); }
          .memory-inner { grid-template-columns: 1fr; gap: 48px; }
          .footer { flex-direction: column; gap: 16px; text-align: center; }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <Link href="/" className="nav-logo">
          <div className="nav-dot"><RoverLogo size={32} /></div>
          ROVER
        </Link>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#memory">Memory</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="https://x.com/roversolai" target="_blank" rel="noopener noreferrer">X</a></li>
          <li><Link href="/dashboard" className="nav-cta">Launch App →</Link></li>
        </ul>
      </nav>

      <TokenTicker />

      {/* HERO */}
      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-content">
          <div className={`hero-badge ${heroVisible ? 'visible' : ''}`}>
            <div className="hero-badge-dot" />
            Live on Solana · Powered by Helius + Birdeye + AI
          </div>

          <h1 className={`hero-title ${heroVisible ? 'visible' : ''}`}>
            Token Intel<br />
            That <span className="accent">Remembers</span><br />
            <span className="accent2">Everything.</span>
          </h1>

          <p className={`hero-sub ${heroVisible ? 'visible' : ''}`}>
            On-chain analytics, AI growth actions, content generation,<br />
            and a memory layer that makes every recommendation smarter over time.
          </p>

          <div className={`hero-actions ${heroVisible ? 'visible' : ''}`}>
            <Link href="/dashboard" className="btn-primary">
              Analyze Your Token <ArrowRight size={16} />
            </Link>
            <a href="#memory" className="btn-ghost">
              See Founder Memory <ChevronDown size={14} />
            </a>
          </div>
        </div>

        <div className={`preview-wrap ${heroVisible ? 'visible' : ''}`}>
          <div className="preview-glow" />
          <div className="preview-box">
            <div className="preview-header">
              <div className="preview-dot" style={{ background: '#ff5f57' }} />
              <div className="preview-dot" style={{ background: '#ffbd2e' }} />
              <div className="preview-dot" style={{ background: '#28ca41' }} />
              <span className="preview-title">ROVER — BONK / $BONK</span>
            </div>
            <div className="preview-metrics">
              {[
                { label: 'Total Holders', value: '999K',       change: '+2,310 24h', neg: false },
                { label: '24h Volume',    value: '$8.4M',      change: '+34.2%',     neg: false },
                { label: 'Token Price',   value: '$0.0000182', change: '+5.2%',      neg: false },
                { label: 'Market Cap',    value: '$596M',      change: '−0.3%',      neg: true  },
              ].map((m) => (
                <div key={m.label} className="preview-metric">
                  <div className="pm-label">{m.label}</div>
                  <div className="pm-value">{m.value}</div>
                  <div className={`pm-change${m.neg ? ' neg' : ''}`}>{m.change}</div>
                </div>
              ))}
            </div>
            <div className="preview-wallets">
              <div className="pw-header">Top Holders</div>
              {[
                { rank: 1, addr: '9WzD...AWWM', pct: '7.95%', type: 'whale'   },
                { rank: 2, addr: '51yZ...QU5j', pct: '5.36%', type: 'whale'   },
                { rank: 3, addr: 'AgkG...L9kn', pct: '5.03%', type: 'whale'   },
                { rank: 4, addr: 'Bz4Q...jP2x', pct: '0.31%', type: 'active'  },
                { rank: 5, addr: 'K6AK...bP4s', pct: '0.18%', type: 'new'     },
              ].map((w, i) => <WalletRow key={i} {...w} delay={800 + i * 120} />)}
            </div>
          </div>
        </div>

        <div className="scroll-hint">
          <span>scroll</span>
          <ChevronDown size={14} color="var(--muted)" />
        </div>
      </section>

      <TokenBanner />

      {/* STATS */}
      <section className="stats-section" id="stats">
        <StatCard value={2800000} label="Wallets Analyzed"   suffix="+" delay={0}   />
        <StatCard value={147}     label="Tokens Tracked"     suffix="+" delay={100} />
        <StatCard value={5}       label="AI Features"                   delay={200} />
        <StatCard value={99}      label="Uptime %"           suffix="%" delay={300} />
      </section>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div className="section-label">Features</div>
        <h2 className="section-title">Everything your<br />token needs to grow</h2>
        <p className="section-sub">
          Real on-chain data. Live market prices. AI that gets smarter the more you use it.
        </p>
        <div className="features-grid">
          <FeatureCard icon={Users}    title="Wallet Clustering"    accent="#5b6ef5"
            desc="Automatically segment holders into Whales, Active Traders, New Buyers, and Dormant wallets based on real on-chain behaviour." />
          <FeatureCard icon={BarChart2} title="Market Cap History"  accent="#00d4aa"
            desc="7-day market cap chart computed from real OHLCV price data × circulating supply via Birdeye and CoinGecko. Not a flat line." />
          <FeatureCard icon={Zap}      title="AI Growth Actions"    accent="#f59e0b"
            desc="Step-by-step action plans with execution guides. Click any action to get a full playbook with progress tracking." />
          <FeatureCard icon={Brain}    title="Founder Memory"       accent="#00d4aa" badge="New"
            desc="Log decisions and outcomes. The AI remembers your token's full history and uses it to make every recommendation smarter." />
          <FeatureCard icon={Shield}   title="Content Generator"    accent="#5b6ef5"
            desc="10 AI-drafted posts across 5 categories. Switch tones: Hype, Professional, Community, or Data-driven. One-click copy." />
          <FeatureCard icon={Activity} title="Live Data + CSV"      accent="#f59e0b"
            desc="Auto-refreshes every 90 seconds. Download your full holder list as a CSV with wallet address, segment, holdings, and last activity." />
        </div>
      </section>

      {/* FOUNDER MEMORY SPOTLIGHT */}
      <section className="memory-section" id="memory">
        <div className="memory-inner">
          <div>
            <div className="section-label">Founder Memory</div>
            <h2 className="section-title">An AI that never<br />forgets your token</h2>
            <p className="section-sub" style={{ marginBottom: 48 }}>
              Most tools give you the same generic advice every time. Founder Memory changes that — it learns from your actual decisions and builds a strategic history that makes every output smarter.
            </p>
            <div className="memory-points">
              {[
                {
                  icon: Clock,
                  color: '#5b6ef5',
                  title: 'Decision Timeline',
                  desc: 'Log every action you take — airdrops, partnerships, burns, lock-ups. Record what worked and what didn\'t.'
                },
                {
                  icon: Activity,
                  color: '#00d4aa',
                  title: 'Pattern Detection',
                  desc: 'AI analyzes your history and surfaces real behavioral patterns: recurring risks, what\'s working, and goal alignment.'
                },
                {
                  icon: Zap,
                  color: '#f59e0b',
                  title: 'Context-Aware AI',
                  desc: 'Insights and Action Engine check your memory before responding. Recommendations reference your actual past outcomes — not generic advice.'
                },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="memory-point">
                  <div className="memory-point-icon" style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
                    <Icon size={18} color={color} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="memory-point-title">{title}</div>
                    <div className="memory-point-desc">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <MemoryPreview />
        </div>
      </section>

      {/* HOW IT WORKS — now 4 steps */}
      <section className="how-section" id="how">
        <div className="how-inner">
          <div className="section-label">How it works</div>
          <h2 className="section-title">From address to strategy<br />in four steps</h2>
          <div className="steps-grid">
            {[
              { n: '01', title: 'Paste your token',       desc: 'Enter any Solana SPL token mint address. We fetch metadata, market data, and top holder wallets instantly.',          memory: false },
              { n: '02', title: 'We analyze on-chain',    desc: 'Helius resolves wallet owners. Birdeye provides price history. Every wallet is classified into its behaviour segment.', memory: false },
              { n: '03', title: 'Get AI-powered output',  desc: 'See your market cap trend, run AI insights, generate community content, and get a full action plan — in seconds.',       memory: false },
              { n: '04', title: 'Build your memory',      desc: 'Log decisions and outcomes over time. The AI learns your token\'s history and makes every future recommendation sharper.', memory: true  },
            ].map((s) => (
              <div key={s.n} className="step">
                <div className={`step-num${s.memory ? ' memory' : ''}`}>{s.n}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">Ready to build your<br />token's memory?</h2>
          <p className="cta-sub">
            Free to use. No wallet required. Paste your token address and start building intelligence that compounds over time.
          </p>
          <Link href="/dashboard" className="btn-primary" style={{ fontSize: '16px', padding: '16px 36px' }}>
            Launch ROVER <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-copy">© 2025 ROVER · Built on Solana</div>
        <div className="footer-links">
          <a href="https://x.com/roversolai" target="_blank" rel="noopener noreferrer">X</a>
          <a href="https://helius.dev" target="_blank" rel="noopener noreferrer">Helius</a>
          <a href="https://birdeye.so" target="_blank" rel="noopener noreferrer">Birdeye</a>
          <a href="https://docs.helius.dev" target="_blank" rel="noopener noreferrer">Docs</a>
          <Link href="/dashboard">App →</Link>
        </div>
      </footer>
    </>
  )
}

