'use client'

import { useState, useRef } from 'react'
import { TokenData } from '@/lib/data'
import { SearchBar } from '@/components/SearchBar'
import { Dashboard } from '@/components/Dashboard'
import { EmptyState } from '@/components/EmptyState'

export default function Home() {
  const [data, setData] = useState<TokenData | null>(null)
  const [seed, setSeed] = useState(1)
  const dashRef = useRef<HTMLDivElement>(null)

  const handleResult = (d: TokenData) => {
    setData(d)
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
