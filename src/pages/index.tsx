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
  const [query, setQuery] = useState<SearchPayload | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const onSearch = async (payload: SearchPayload) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setQuery(payload)
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

  const searchedNeeds = query?.categories.join(', ')

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 max-w-3xl mx-auto">
      <Head>
        <title>NeighborAid — Find help. Take the next step.</title>
        <meta name="description" content="A Seattle directory of published community resources for food, housing, healthcare, and more." />
      </Head>

      <SiteHeader />

      <p className="text-[11px] uppercase tracking-[0.16em] text-terracotta">Your Seattle resource guide</p>
      <h2 className="mt-2 max-w-xl font-serif text-4xl leading-tight text-forest">Let&apos;s find the help you need.</h2>
      <p className="mt-3 max-w-xl text-charcoal">
        Choose a few options to get started. Results come from published listings.
        This search does not decide eligibility, funding, or whether a program has space.
      </p>

      <div className="mt-6">
        <SearchForm loading={loading} onSearch={onSearch} />
      </div>

      <section className="mt-10" aria-live="polite">
        <p className="text-[11px] uppercase tracking-[0.16em] text-leaf">Your search</p>
        <h2 className="mt-1 font-serif text-3xl text-forest">Places to start</h2>

        {!hasSearched && (
          <p className="note mt-3">Select at least one need, then search the published directory.</p>
        )}

        {hasSearched && query && (
          <p className="note mt-3">
            Based on {searchedNeeds} in {query.location}.
          </p>
        )}

        {query?.asSoonAsPossible && (
          <p className="mt-3 border-l-2 border-terracotta pl-3 text-sm text-charcoal">
            You asked for help as soon as possible. Contact the provider before you go. This list cannot confirm space today.
          </p>
        )}

        {loading && <p className="note mt-4">Finding resources…</p>}

        {error && (
          <p role="alert" className="alert mt-4">{error}</p>
        )}

        {!loading && result && result.matches.length === 0 && (
          <div className="panel mt-4 p-4 text-sm text-charcoal">
            <p>We couldn&apos;t find a close match.</p>
            <p className="note mt-2">Try another category, turn off the free-only filter, or use a different city or ZIP.</p>
          </div>
        )}

        {!loading && result && result.matches.length > 0 && (
          <div className="mt-4 space-y-4">
            <p className="note">
              {result.matches.length} published listing{result.matches.length === 1 ? '' : 's'}.
            </p>
            {result.matches.map((match) => (
              <ResourceCard key={match.resource.id || match.resource.name} match={match} />
            ))}
          </div>
        )}

        {result?.action_plan && result.action_plan.length > 0 && (
          <div className="mt-8 rounded-md border border-line bg-sage p-4 sm:p-5">
            <h3 className="font-serif text-2xl text-forest">What to do next</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-charcoal">
              {result.action_plan.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {result?.disclaimer && (
          <p className="note mt-6">{result.disclaimer}</p>
        )}
      </section>
    </div>
  )
}
