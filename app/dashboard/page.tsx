'use client'

import { useState, useRef, useEffect } from 'react'
import { TokenData } from '@/lib/data'
import { SearchBar } from '@/components/SearchBar'
import { Dashboard } from '@/components/Dashboard'
import { EmptyState } from '@/components/EmptyState'

export default function Home() {
  const [data, setData] = useState<TokenData | null>(null)
  const [seed, setSeed] = useState(1)
  const dashRef = useRef<HTMLDivElement>(null)


  // Restore last analyzed token on hard refresh
  // URL param (?token=) is the primary source; localStorage is the fallback
  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search)
      const token =
        params.get('token') ||
        window.localStorage.getItem('last_token_query') ||
        window.sessionStorage.getItem('last_token_query')
      if (!token) return

      const fetchOnce = async () => {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: token }),
        })
        const json = await res.json()
        return res.ok && json.data ? (json.data as TokenData) : null
      }

      try {
        let d = await fetchOnce()
        if (!d) return

        // Retry once if Birdeye returned zeros (cold start / rate limit).
        // Wait well past Birdeye's ~1s burst window so the retry actually
        // has a chance to succeed instead of colliding with the same limit.
        const hasZeroData = d.holders === 0 && d.price === '$0.00' && d.volume === '$0.00'
        if (hasZeroData) {
          await new Promise((r) => setTimeout(r, 6000))
          const retry = await fetchOnce()
          if (retry) d = retry
        }

        setData(d)
        const url = new URL(window.location.href)
        url.searchParams.set('token', d.mint)
        window.history.replaceState({}, '', url.toString())
      } catch { /* silent restore */ }
    }
    run()
  }, [])

  const handleResult = (d: TokenData) => {
    setData(d)
    window.sessionStorage.setItem('last_token_query', d.mint)
    window.localStorage.setItem('last_token_query', d.mint)
    const url = new URL(window.location.href)
    url.searchParams.set('token', d.mint)
    window.history.replaceState({}, '', url.toString())
    setSeed((s) => s + 1)
    setTimeout(() => {
      dashRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 sm:mb-10">
        <SearchBar onResult={handleResult} />
      </div>
      <div ref={dashRef}>
        {data ? <Dashboard data={data} seed={seed} /> : <EmptyState />}
      </div>
    </main>
  )
}
