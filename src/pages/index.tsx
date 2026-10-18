import Head from 'next/head'
import { useState } from 'react'
import ResourceCard from '../components/ResourceCard'
import SearchForm from '../components/SearchForm'
import { requestMatches, type MatchSuccess, type SearchPayload } from '../lib/matchClient'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<MatchSuccess | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const onSearch = async (payload: SearchPayload) => {
    setLoading(true)
    setError(null)
    setHasSearched(true)
    try {
      const data = await requestMatches(payload)
      setResult(data)
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

      <header className="mb-6">
        <h1 className="text-3xl font-bold">NeighborAid</h1>
        <p className="mt-2 text-sm text-gray-600">
          Choose what you need help with. We search published community listings and explain why each one appeared.
          This tool does not decide eligibility, funding, or same-day availability.
        </p>
      </header>

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

        {!loading && result && result.count === 0 && (
          <div className="text-sm text-gray-700 bg-white border border-gray-200 rounded-md p-4">
            <p>No published listings matched those selections.</p>
            {result.notice && <p className="mt-2 text-gray-600">{result.notice}</p>}
            <p className="mt-2 text-gray-600">Try another category, turn off the free-only filter, or confirm the city or ZIP. If this keeps happening, the directory may be empty or the database may not be connected.</p>
          </div>
        )}

        {!loading && result && result.count > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{result.count} published listing{result.count === 1 ? '' : 's'}.</p>
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
