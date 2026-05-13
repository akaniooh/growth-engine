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
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: token }),
        })
        const json = await res.json()
        if (res.ok && json.data) {
          setData(json.data as TokenData)
          // Ensure URL param is set so future refreshes also restore correctly
          const url = new URL(window.location.href)
          url.searchParams.set('token', (json.data as TokenData).mint)
          window.history.replaceState({}, '', url.toString())
        }
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
