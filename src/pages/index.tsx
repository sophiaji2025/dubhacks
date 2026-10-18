import Head from 'next/head'
import { useState } from 'react'
import NearbyMap from '../components/NearbyMap'
import PageShell from '../components/PageShell'
import ResourceCard, { type ResourceMatchView } from '../components/ResourceCard'
import SearchForm, { type SearchPayload } from '../components/SearchForm'
import type { ResourceMapView } from '../lib/geo'
import { requestMatches } from '../lib/matchClient'

type MatchSuccess = {
  count: number
  matches: ResourceMatchView[]
  map: ResourceMapView | null
  disclaimer?: string
  action_plan?: string[]
}

const HOW_IT_WORKS = [
  { title: 'Tell us what you need', body: 'Pick food, housing, healthcare, or any mix of needs. You do not have to write a long story.' },
  { title: 'See published listings', body: 'We rank programs that are already in the Seattle directory and explain why each one appeared.' },
  { title: 'Take the next step', body: 'Open the official site, confirm hours, and contact the provider. This tool does not decide eligibility or space.' },
]

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<MatchSuccess | null>(null)
  const [query, setQuery] = useState<SearchPayload | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const onSearch = async (payload: SearchPayload) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setQuery(payload)
    setSelectedId(null)
    setHasSearched(true)
    try {
      const data = await requestMatches(payload)
      setResult({
        count: typeof data.count === 'number' ? data.count : 0,
        matches: Array.isArray(data.matches) ? data.matches : [],
        map: isMapView(data.map) ? data.map : null,
        disclaimer: data.disclaimer,
        action_plan: Array.isArray(data.action_plan) ? data.action_plan : [],
      })
    } catch (err) {
      setResult(null)
      setError(err instanceof Error ? err.message : 'Search failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const searchedNeeds = query?.categories.join(', ')
  const pinById = new Map(
    (result?.map?.places ?? []).map((place, index) => [
      place.id,
      { number: index + 1, distanceLabel: place.distance_label },
    ]),
  )

  const showListing = (id: string) => {
    setSelectedId(id)
    const card = document.getElementById(`resource-${id}`)
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    card?.focus()
  }

  const showOnMap = (id: string) => {
    setSelectedId(id)
    document.getElementById('resource-map')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <PageShell>
      <Head>
        <title>NeighborAid — Find help. Take the next step.</title>
        <meta name="description" content="A Seattle directory of published community resources, with a map of listings near the city or ZIP you enter." />
      </Head>

      <div className="grid items-start gap-8 xl:grid-cols-12 xl:gap-12">
        <section className="xl:sticky xl:top-28 xl:col-span-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-terracotta">Your Seattle resource guide</p>
          <h2 className="mt-3 max-w-xl font-serif text-4xl leading-tight text-forest sm:text-5xl">
            Find local help without guessing where to start.
          </h2>
          <p className="mt-4 max-w-xl text-lg text-charcoal">
            Choose a few options. Results come from published listings.
            This search does not decide eligibility, funding, or whether a program has space.
          </p>

          <div className="mt-8">
            <SearchForm loading={loading} onSearch={onSearch} />
          </div>
        </section>

        <section className="min-h-[28rem] xl:col-span-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-leaf">Your search</p>
              <h2 className="mt-1 font-serif text-3xl text-forest sm:text-4xl">Places to start</h2>
            </div>
            {!loading && result && result.matches.length > 0 && (
              <p className="note">{result.matches.length} listing{result.matches.length === 1 ? '' : 's'}</p>
            )}
          </div>

          {!hasSearched && (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {HOW_IT_WORKS.map((step, index) => (
                <article key={step.title} className="panel overflow-hidden p-5">
                  <p className="font-serif text-4xl text-terracotta/80">{index + 1}</p>
                  <h3 className="mt-2 font-serif text-xl text-forest">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-charcoal">{step.body}</p>
                </article>
              ))}
            </div>
          )}

          {hasSearched && query && (
            <p className="note mt-4" aria-live="polite">
              Based on {searchedNeeds} in {query.location}.
            </p>
          )}

          {query?.asSoonAsPossible && (
            <p className="mt-3 border-l-2 border-terracotta pl-3 text-sm text-charcoal">
              You asked for help as soon as possible. Contact the provider before you go. This list cannot confirm space today.
            </p>
          )}

          {loading && <p className="note mt-4" aria-live="polite">Finding resources…</p>}

          {!loading && result?.map && (result.map.center || result.map.places.length > 0) && (
            <div className="mt-4">
              <NearbyMap
                map={result.map}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onShowListing={showListing}
              />
            </div>
          )}

          {error && (
            <p role="alert" className="alert mt-4">{error}</p>
          )}

          {!loading && result && result.matches.length === 0 && (
            <div className="panel mt-4 p-5 text-sm text-charcoal">
              <p>We couldn&apos;t find a close match.</p>
              <p className="note mt-2">Try another category, turn off the free-only filter, or use a different city or ZIP.</p>
            </div>
          )}

          {!loading && result && result.matches.length > 0 && (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {result.matches.map((match) => {
                const pin = pinById.get(match.resource.id)
                return (
                  <ResourceCard
                    key={match.resource.id || match.resource.name}
                    match={match}
                    pinNumber={pin?.number}
                    distanceLabel={pin?.distanceLabel}
                    selected={selectedId === match.resource.id}
                    onShowOnMap={pin ? () => showOnMap(match.resource.id) : undefined}
                  />
                )
              })}
            </div>
          )}

          {result?.action_plan && result.action_plan.length > 0 && (
            <div className="mt-8 rounded-2xl border border-line bg-sage/80 p-5 sm:p-6">
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
    </PageShell>
  )
}

function isMapView(value: unknown): value is ResourceMapView {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  if (!Array.isArray(record.places) || typeof record.unmapped_count !== 'number') return false
  const placesOk = record.places.every((place) => {
    if (typeof place !== 'object' || place === null) return false
    const point = place as Record<string, unknown>
    return typeof point.id === 'string'
      && typeof point.name === 'string'
      && typeof point.latitude === 'number'
      && typeof point.longitude === 'number'
  })
  if (!placesOk) return false
  if (record.center == null) return true
  if (typeof record.center !== 'object') return false
  const center = record.center as Record<string, unknown>
  return typeof center.latitude === 'number'
    && typeof center.longitude === 'number'
    && typeof center.label === 'string'
}
