'use client'

import { useEffect, useState, useRef } from 'react'
import { TrendingUp, Zap, Users, BarChart2, ArrowRight, Shield, Activity, ChevronDown } from 'lucide-react'
import Link from 'next/link'

// Animated counter hook
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
      if (current >= target) {
        setValue(target)
        clearInterval(timer)
      } else {
        setValue(Math.floor(current))
      }
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
      <div className="stat-value">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc, accent }: {
  icon: React.ElementType; title: string; desc: string; accent: string
}) {
  return (
    <div className="feature-card" style={{ '--accent': accent } as React.CSSProperties}>
      <div className="feature-icon">
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{desc}</p>
    </div>
  )
}

function TokenTicker() {
  const tokens = [
    { sym: 'BONK', price: '$0.0000182', change: '+5.2%', up: true },
    { sym: 'WIF',  price: '$2.485',     change: '+3.5%', up: true },
    { sym: 'JUP',  price: '$0.512',     change: '-1.2%', up: false },
    { sym: 'PYTH', price: '$0.318',     change: '+8.7%', up: true },
    { sym: 'RNDR', price: '$6.24',      change: '+2.1%', up: true },
    { sym: 'POPCAT', price: '$0.412',   change: '-0.8%', up: false },
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
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div className={`wallet-row ${visible ? 'visible' : ''}`}>
      <span className="wallet-rank">{rank}</span>
      <span className="wallet-addr">{addr}</span>
      <span className={`wallet-badge ${type}`}>{type}</span>
      <span className="wallet-pct">{pct}</span>
    </div>
  )
}

export default function LandingPage() {
  const [heroVisible, setHeroVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:      #080810;
          --bg2:     #0e0e1a;
          --bg3:     #141422;
          --border:  rgba(255,255,255,0.07);
          --border2: rgba(255,255,255,0.14);
          --ink:     #eeeef8;
          --muted:   #6868a0;
          --faint:   #3a3a60;
          --brand:   #5b6ef5;
          --brand2:  #00d4aa;
          --warn:    #f59e0b;
          --neg:     #ef4444;
          --mono:    'Space Mono', monospace;
          --sans:    'Syne', sans-serif;
        }

        html { scroll-behavior: smooth; }

        body {
          background: var(--bg);
          color: var(--ink);
          font-family: var(--sans);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        /* NAV */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 40px;
          background: rgba(8,8,16,0.8);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
        }
        .nav-logo {
          display: flex; align-items: center; gap: 10px;
          font-family: var(--sans); font-size: 15px; font-weight: 800;
          letter-spacing: -0.5px; color: var(--ink); text-decoration: none;
        }
        .nav-dot {
          width: 28px; height: 28px;
          background: var(--brand);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }
        .nav-links {
          display: flex; align-items: center; gap: 32px;
          list-style: none;
        }
        .nav-links a {
          font-family: var(--mono); font-size: 12px;
          color: var(--muted); text-decoration: none;
          transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--ink); }
        .nav-cta {
          background: var(--brand);
          color: white !important;
          padding: 8px 18px;
          border-radius: 8px;
          font-family: var(--mono) !important;
          font-size: 12px !important;
          transition: opacity 0.2s !important;
        }
        .nav-cta:hover { opacity: 0.85; color: white !important; }

        /* TICKER */
        .ticker-wrap {
          background: var(--bg2);
          border-bottom: 1px solid var(--border);
          padding: 10px 0;
          overflow: hidden;
          position: fixed; top: 65px; left: 0; right: 0; z-index: 99;
        }
        .ticker-track {
          display: flex; gap: 48px;
          animation: ticker 30s linear infinite;
          width: max-content;
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .ticker-item {
          display: flex; align-items: center; gap: 10px;
          flex-shrink: 0;
        }
        .ticker-sym  { font-family: var(--mono); font-size: 11px; color: var(--ink); font-weight: 700; }
        .ticker-price{ font-family: var(--mono); font-size: 11px; color: var(--muted); }
        .ticker-change{ font-family: var(--mono); font-size: 11px; font-weight: 700; }
        .ticker-change.up  { color: var(--brand2); }
        .ticker-change.down{ color: var(--neg); }

        /* HERO */
        .hero {
          min-height: 100vh;
          padding: 160px 40px 80px;
          display: flex; flex-direction: column; align-items: center;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .hero::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(91,110,245,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 80% 60%, rgba(0,212,170,0.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .hero-grid {
          position: absolute; inset: 0; z-index: 0;
          background-image:
            linear-gradient(rgba(91,110,245,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(91,110,245,0.06) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 70% at 50% 0%, black 0%, transparent 100%);
        }
        .hero-content { position: relative; z-index: 1; max-width: 860px; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(91,110,245,0.12);
          border: 1px solid rgba(91,110,245,0.3);
          border-radius: 100px;
          padding: 6px 16px;
          font-family: var(--mono); font-size: 11px; color: var(--brand);
          margin-bottom: 32px;
          opacity: 0; transform: translateY(12px);
          transition: all 0.6s ease;
        }
        .hero-badge.visible { opacity: 1; transform: translateY(0); }
        .hero-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--brand2); animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }

        .hero-title {
          font-size: clamp(42px, 7vw, 88px);
          font-weight: 800;
          line-height: 1.0;
          letter-spacing: -3px;
          margin-bottom: 28px;
          opacity: 0; transform: translateY(20px);
          transition: all 0.7s ease 0.15s;
        }
        .hero-title.visible { opacity: 1; transform: translateY(0); }
        .hero-title .accent { color: var(--brand); }
        .hero-title .accent2 { color: var(--brand2); }

        .hero-sub {
          font-family: var(--mono); font-size: 15px; line-height: 1.8;
          color: var(--muted); max-width: 540px; margin: 0 auto 48px;
          opacity: 0; transform: translateY(16px);
          transition: all 0.7s ease 0.3s;
        }
        .hero-sub.visible { opacity: 1; transform: translateY(0); }

        .hero-actions {
          display: flex; align-items: center; justify-content: center; gap: 16px;
          flex-wrap: wrap;
          opacity: 0; transform: translateY(16px);
          transition: all 0.7s ease 0.45s;
        }
        .hero-actions.visible { opacity: 1; transform: translateY(0); }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--brand);
          color: white; text-decoration: none;
          padding: 14px 28px; border-radius: 10px;
          font-family: var(--sans); font-size: 14px; font-weight: 700;
          transition: all 0.2s;
          box-shadow: 0 0 40px rgba(91,110,245,0.3);
        }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 0 60px rgba(91,110,245,0.5); }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent;
          color: var(--muted); text-decoration: none;
          padding: 14px 28px; border-radius: 10px;
          font-family: var(--mono); font-size: 13px;
          border: 1px solid var(--border2);
          transition: all 0.2s;
        }
        .btn-ghost:hover { color: var(--ink); border-color: rgba(255,255,255,0.25); }

        /* DASHBOARD PREVIEW */
        .preview-wrap {
          position: relative; z-index: 1;
          margin-top: 64px; width: 100%; max-width: 900px;
          opacity: 0; transform: translateY(40px);
          transition: all 0.9s ease 0.6s;
        }
        .preview-wrap.visible { opacity: 1; transform: translateY(0); }
        .preview-glow {
          position: absolute; inset: -2px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(91,110,245,0.4), rgba(0,212,170,0.2), transparent);
          z-index: -1; filter: blur(1px);
        }
        .preview-box {
          background: var(--bg2);
          border: 1px solid var(--border2);
          border-radius: 16px;
          overflow: hidden;
        }
        .preview-header {
          background: var(--bg3);
          border-bottom: 1px solid var(--border);
          padding: 12px 16px;
          display: flex; align-items: center; gap: 8px;
        }
        .preview-dot { width: 10px; height: 10px; border-radius: 50%; }
        .preview-title { font-family: var(--mono); font-size: 11px; color: var(--muted); margin-left: 8px; }
        .preview-metrics {
          display: grid; grid-template-columns: repeat(4, 1fr);
          border-bottom: 1px solid var(--border);
        }
        .preview-metric {
          padding: 20px;
          border-right: 1px solid var(--border);
        }
        .preview-metric:last-child { border-right: none; }
        .pm-label { font-family: var(--mono); font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .pm-value { font-size: 22px; font-weight: 800; letter-spacing: -1px; color: var(--ink); margin-bottom: 4px; }
        .pm-change { font-family: var(--mono); font-size: 10px; color: var(--brand2); }
        .pm-change.neg { color: var(--neg); }

        .preview-wallets { padding: 16px; }
        .pw-header { font-family: var(--mono); font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
        .wallet-row {
          display: flex; align-items: center; gap: 16px;
          padding: 8px 12px; border-radius: 8px;
          border: 1px solid transparent;
          font-family: var(--mono); font-size: 11px;
          opacity: 0; transform: translateX(-8px);
          transition: all 0.4s ease;
          margin-bottom: 4px;
        }
        .wallet-row.visible {
          opacity: 1; transform: translateX(0);
          background: rgba(255,255,255,0.02);
          border-color: var(--border);
        }
        .wallet-rank { color: var(--faint); width: 16px; }
        .wallet-addr { color: var(--muted); flex: 1; }
        .wallet-badge {
          font-size: 9px; padding: 2px 8px; border-radius: 4px;
          text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;
        }
        .wallet-badge.whale   { background: rgba(91,110,245,0.15); color: #7b8ff7; border: 1px solid rgba(91,110,245,0.3); }
        .wallet-badge.active  { background: rgba(0,212,170,0.1);  color: var(--brand2); border: 1px solid rgba(0,212,170,0.2); }
        .wallet-badge.new     { background: rgba(245,158,11,0.1); color: var(--warn); border: 1px solid rgba(245,158,11,0.2); }
        .wallet-badge.dormant { background: rgba(104,104,160,0.1); color: var(--muted); border: 1px solid rgba(104,104,160,0.15); }
        .wallet-pct { color: var(--ink); font-weight: 700; text-align: right; }

        /* STATS */
        .stats-section {
          padding: 80px 40px;
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 1px; background: var(--border);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .stat-card {
          background: var(--bg);
          padding: 48px 32px;
          text-align: center;
        }
        .stat-value {
          font-size: clamp(32px, 4vw, 52px);
          font-weight: 800;
          letter-spacing: -2px;
          color: var(--ink);
          margin-bottom: 8px;
          background: linear-gradient(135deg, var(--ink), var(--brand));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .stat-label { font-family: var(--mono); font-size: 12px; color: var(--muted); }

        /* FEATURES */
        .features-section {
          padding: 100px 40px;
          max-width: 1200px; margin: 0 auto;
        }
        .section-label {
          font-family: var(--mono); font-size: 11px; color: var(--brand);
          text-transform: uppercase; letter-spacing: 2px;
          margin-bottom: 16px;
        }
        .section-title {
          font-size: clamp(28px, 4vw, 48px);
          font-weight: 800; letter-spacing: -2px;
          line-height: 1.1; margin-bottom: 16px;
        }
        .section-sub {
          font-family: var(--mono); font-size: 14px;
          color: var(--muted); line-height: 1.8;
          max-width: 480px; margin-bottom: 64px;
        }
        .features-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
        }
        .feature-card {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 16px; padding: 32px;
          position: relative; overflow: hidden;
          transition: border-color 0.3s, transform 0.3s;
          cursor: default;
        }
        .feature-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: var(--accent, var(--brand));
          opacity: 0; transition: opacity 0.3s;
        }
        .feature-card:hover { border-color: var(--border2); transform: translateY(-4px); }
        .feature-card:hover::before { opacity: 1; }
        .feature-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: rgba(91,110,245,0.1);
          border: 1px solid rgba(91,110,245,0.2);
          display: flex; align-items: center; justify-content: center;
          color: var(--brand);
          margin-bottom: 20px;
        }
        .feature-title { font-size: 16px; font-weight: 700; margin-bottom: 10px; }
        .feature-desc { font-family: var(--mono); font-size: 12px; color: var(--muted); line-height: 1.8; }

        /* HOW IT WORKS */
        .how-section {
          padding: 100px 40px;
          background: var(--bg2);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .how-inner { max-width: 1000px; margin: 0 auto; }
        .steps-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px;
          margin-top: 64px; position: relative;
        }
        .steps-grid::before {
          content: '';
          position: absolute; top: 28px; left: calc(16.66% + 16px); right: calc(16.66% + 16px);
          height: 1px; background: linear-gradient(90deg, var(--brand), var(--brand2));
        }
        .step { text-align: center; }
        .step-num {
          width: 56px; height: 56px; border-radius: 50%;
          background: var(--bg); border: 2px solid var(--brand);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px;
          font-family: var(--mono); font-size: 18px; font-weight: 700;
          color: var(--brand);
          position: relative; z-index: 1;
        }
        .step-title { font-size: 16px; font-weight: 700; margin-bottom: 10px; }
        .step-desc { font-family: var(--mono); font-size: 12px; color: var(--muted); line-height: 1.8; }

        /* CTA */
        .cta-section {
          padding: 120px 40px;
          text-align: center;
          position: relative; overflow: hidden;
        }
        .cta-section::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 60% 80% at 50% 50%, rgba(91,110,245,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .cta-inner { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; }
        .cta-title { font-size: clamp(32px, 5vw, 60px); font-weight: 800; letter-spacing: -2px; line-height: 1.05; margin-bottom: 24px; }
        .cta-sub { font-family: var(--mono); font-size: 14px; color: var(--muted); line-height: 1.8; margin-bottom: 48px; }

        /* FOOTER */
        .footer {
          border-top: 1px solid var(--border);
          padding: 32px 40px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .footer-copy { font-family: var(--mono); font-size: 11px; color: var(--faint); }
        .footer-links { display: flex; gap: 24px; }
        .footer-links a { font-family: var(--mono); font-size: 11px; color: var(--faint); text-decoration: none; transition: color 0.2s; }
        .footer-links a:hover { color: var(--muted); }

        /* SCROLL */
        .scroll-hint {
          position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          opacity: 0.4; z-index: 1;
          animation: bounce 2s ease-in-out infinite;
        }
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
          .footer { flex-direction: column; gap: 16px; text-align: center; }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <Link href="/" className="nav-logo">
          <div className="nav-dot">
            <TrendingUp size={14} color="white" strokeWidth={2.5} />
          </div>
          Growth Engine
        </Link>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="#stats">Stats</a></li>
          <li><Link href="/dashboard" className="nav-cta">Launch App →</Link></li>
        </ul>
      </nav>

      {/* TICKER */}
      <TokenTicker />

      {/* HERO */}
      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-content">
          <div className={`hero-badge ${heroVisible ? 'visible' : ''}`}>
            <div className="hero-badge-dot" />
            Live on Solana · Powered by Helius + Birdeye
          </div>

          <h1 className={`hero-title ${heroVisible ? 'visible' : ''}`}>
            Know Your<br />
            <span className="accent">Holders.</span>{' '}
            <span className="accent2">Grow</span><br />
            Smarter.
          </h1>

          <p className={`hero-sub ${heroVisible ? 'visible' : ''}`}>
            On-chain analytics for Solana creator tokens.<br />
            Classify wallets, track market cap, and get AI-powered growth strategies — in seconds.
          </p>

          <div className={`hero-actions ${heroVisible ? 'visible' : ''}`}>
            <Link href="/dashboard" className="btn-primary">
              Analyze Your Token <ArrowRight size={16} />
            </Link>
            <a href="#how" className="btn-ghost">
              See how it works <ChevronDown size={14} />
            </a>
          </div>
        </div>

        {/* Dashboard preview */}
        <div className={`preview-wrap ${heroVisible ? 'visible' : ''}`}>
          <div className="preview-glow" />
          <div className="preview-box">
            <div className="preview-header">
              <div className="preview-dot" style={{ background: '#ff5f57' }} />
              <div className="preview-dot" style={{ background: '#ffbd2e' }} />
              <div className="preview-dot" style={{ background: '#28ca41' }} />
              <span className="preview-title">Growth Engine — BONK / $BONK</span>
            </div>
            <div className="preview-metrics">
              <div className="preview-metric">
                <div className="pm-label">Total Holders</div>
                <div className="pm-value">999K</div>
                <div className="pm-change">+2,310 24h</div>
              </div>
              <div className="preview-metric">
                <div className="pm-label">24h Volume</div>
                <div className="pm-value">$8.4M</div>
                <div className="pm-change">+34.2%</div>
              </div>
              <div className="preview-metric">
                <div className="pm-label">Token Price</div>
                <div className="pm-value">$0.0000182</div>
                <div className="pm-change">+5.2%</div>
              </div>
              <div className="preview-metric">
                <div className="pm-label">Market Cap</div>
                <div className="pm-value">$596M</div>
                <div className="pm-change neg">−0.3%</div>
              </div>
            </div>
            <div className="preview-wallets">
              <div className="pw-header">Top 10 Holders</div>
              {[
                { rank: 1, addr: '9WzD...AWWM', pct: '7.95%', type: 'whale' },
                { rank: 2, addr: '51yZ...QU5j', pct: '5.36%', type: 'whale' },
                { rank: 3, addr: 'AgkG...L9kn', pct: '5.03%', type: 'whale' },
                { rank: 4, addr: 'Bz4Q...jP2x', pct: '0.31%', type: 'active' },
                { rank: 5, addr: 'K6AK...bP4s', pct: '0.18%', type: 'new' },
              ].map((w, i) => (
                <WalletRow key={i} {...w} delay={800 + i * 120} />
              ))}
            </div>
          </div>
        </div>

        <div className="scroll-hint">
          <span>scroll</span>
          <ChevronDown size={14} color="var(--muted)" />
        </div>
      </section>

      {/* STATS */}
      <section className="stats-section" id="stats">
        <StatCard value={2800000} label="Wallets Analyzed" prefix="" suffix="+" delay={0} />
        <StatCard value={147} label="Tokens Tracked" suffix="+" delay={100} />
        <StatCard value={99} label="Uptime %" suffix="%" delay={200} />
        <StatCard value={12} label="Avg. Load Time (s)" delay={300} />
      </section>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div className="section-label">Features</div>
        <h2 className="section-title">Everything your<br />token needs to grow</h2>
        <p className="section-sub">
          Real on-chain data from Helius. Live market data from Birdeye. AI insights that actually help.
        </p>
        <div className="features-grid">
          <FeatureCard
            icon={Users}
            title="Wallet Clustering"
            desc="Automatically segment holders into Whales, Active Traders, New Buyers, and Dormant wallets based on on-chain behaviour."
            accent="#5b6ef5"
          />
          <FeatureCard
            icon={BarChart2}
            title="Market Cap History"
            desc="7-day market cap line chart computed from real OHLCV price data × circulating supply. Not just a flat line."
            accent="#00d4aa"
          />
          <FeatureCard
            icon={Zap}
            title="AI Growth Actions"
            desc="Step-by-step action plans with resource links. Click any action to get a full execution guide with progress tracking."
            accent="#f59e0b"
          />
          <FeatureCard
            icon={Activity}
            title="Live Stat Updates"
            desc="Auto-refreshes every 90 seconds. Manual refresh button. Never overwrites good data with zeros."
            accent="#5b6ef5"
          />
          <FeatureCard
            icon={Shield}
            title="Content Generator"
            desc="10 AI-drafted posts across 5 categories. Switch tones: Hype, Professional, Community, or Data-driven."
            accent="#00d4aa"
          />
          <FeatureCard
            icon={TrendingUp}
            title="CSV Export"
            desc="Download your top holder list as a CSV with wallet address, segment, holdings, supply %, and last active time."
            accent="#f59e0b"
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section" id="how">
        <div className="how-inner">
          <div className="section-label">How it works</div>
          <h2 className="section-title">Three steps to clarity</h2>
          <div className="steps-grid">
            {[
              { n: '01', title: 'Paste your token address', desc: 'Enter any Solana SPL token mint address. We instantly fetch metadata, market data, and the top holder wallets.' },
              { n: '02', title: 'We analyze on-chain data', desc: 'Helius RPC resolves wallet owners. Birdeye provides price history. We classify every wallet into its behaviour segment.' },
              { n: '03', title: 'Get actionable output', desc: 'See your market cap trend, download holder CSVs, run AI insights, and generate content with tone control.' },
            ].map((s) => (
              <div key={s.n} className="step">
                <div className="step-num">{s.n}</div>
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
          <h2 className="cta-title">Ready to understand<br />your holders?</h2>
          <p className="cta-sub">
            Free to use. No wallet required. Just paste your token address and go.
          </p>
          <Link href="/dashboard" className="btn-primary" style={{ fontSize: '16px', padding: '16px 36px' }}>
            Launch Growth Engine <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-copy">© 2025 Growth Engine · Built on Solana</div>
        <div className="footer-links">
          <a href="https://helius.dev" target="_blank" rel="noopener noreferrer">Helius</a>
          <a href="https://birdeye.so" target="_blank" rel="noopener noreferrer">Birdeye</a>
          <a href="https://docs.helius.dev" target="_blank" rel="noopener noreferrer">Docs</a>
          <Link href="/dashboard">App →</Link>
        </div>
      </footer>
    </>
  )
}
