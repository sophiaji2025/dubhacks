import Head from 'next/head'
import { useState } from 'react'
import ResourceCard, { type ResourceMatchView } from '../components/ResourceCard'
import SearchForm, { type SearchPayload } from '../components/SearchForm'
import SiteHeader from '../components/SiteHeader'

type MatchSuccess = {
  count: number
  matches: ResourceMatchView[]
  disclaimer?: string
  action_plan?: string[]
}

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<MatchSuccess | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const onSearch = async (payload: SearchPayload) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setHasSearched(true)
    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => null) as ({ error?: string; details?: string[] } & Partial<MatchSuccess>) | null
      if (!response.ok) {
        const details = Array.isArray(data?.details) ? data.details.filter((item) => typeof item === 'string').join(' ') : ''
        const message = data?.error || 'Search failed. Try again.'
        throw new Error(details ? `${message} ${details}` : message)
      }
      setResult({
        count: typeof data?.count === 'number' ? data.count : 0,
        matches: Array.isArray(data?.matches) ? data.matches : [],
        disclaimer: data?.disclaimer,
        action_plan: Array.isArray(data?.action_plan) ? data.action_plan : [],
      })
    } catch (err) {
      setResult(null)
      setError(err instanceof Error ? err.message : 'Search failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 max-w-3xl mx-auto">
      <Head>
        <title>NeighborAid — Find local help</title>
        <meta name="description" content="Find published Seattle-area community resources for food, housing, healthcare, and more." />
      </Head>

      <SiteHeader>
        <p className="mt-2 text-sm text-gray-600">
          Choose what you need help with, then a city or ZIP code. Results come from published listings.
          This search does not decide eligibility, funding, or whether a program has space.
        </p>
      </SiteHeader>

      <SearchForm loading={loading} onSearch={onSearch} />

      <section className="mt-8" aria-live="polite">
        <h2 className="text-xl font-semibold mb-3">Results</h2>

        {!hasSearched && (
          <p className="text-sm text-gray-600">Select at least one need and search to see published resources.</p>
        )}

        {loading && <p className="text-sm text-gray-600">Searching published listings…</p>}

        {error && (
          <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
        )}

        {!loading && result && result.matches.length === 0 && (
          <div className="text-sm text-gray-700 bg-white border border-gray-200 rounded-md p-4">
            <p>No published listings matched those selections.</p>
            <p className="mt-2 text-gray-600">Try another category, turn off the free-only filter, or use a different city or ZIP.</p>
          </div>
        )}

        {!loading && result && result.matches.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {result.matches.length} published listing{result.matches.length === 1 ? '' : 's'}.
            </p>
            {result.matches.map((match) => (
              <ResourceCard key={match.resource.id || match.resource.name} match={match} />
            ))}
          </div>
        )}

        {result?.action_plan && result.action_plan.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">Suggested next steps</h3>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-700">
              {result.action_plan.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {result?.disclaimer && (
          <p className="mt-6 text-xs text-gray-500">{result.disclaimer}</p>
        )}
      </section>
    </div>
  )
}
