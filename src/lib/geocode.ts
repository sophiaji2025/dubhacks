import {
  centerGeocodeQuery,
  distanceLabel,
  distanceMiles,
  locationDetail,
  readCoordinatePair,
  resourceGeocodeQuery,
  searchAreaCenter,
  type GeoPoint,
  type MapPlace,
  type ResourceMapView,
} from './geo'
import type { Resource } from './matching'

/**
 * OpenStreetMap Nominatim is used only when a listing or search area has no
 * saved point. The public service allows about one request per second and
 * asks callers to cache results and identify the application.
 * https://operations.osmfoundation.org/policies/nominatim/
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'NeighborAid/0.1 (Seattle community resource directory)'
const MIN_INTERVAL_MS = 1100
const FAILURE_TTL_MS = 5 * 60 * 1000
const SUCCESS_TTL_MS = 7 * 24 * 60 * 60 * 1000
const REQUEST_TIMEOUT_MS = 2500

type CacheEntry = {
  point: GeoPoint | null
  expiresAt: number
}

type NominatimAddress = {
  house_number?: string
  road?: string
  pedestrian?: string
  building?: string
}

type NominatimHit = {
  lat?: string
  lon?: string
  address?: NominatimAddress
}

const cache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<GeoPoint | null>>()
let lastRequestAt = 0
let pending: Promise<void> = Promise.resolve()

export function resetGeocoder(): void {
  cache.clear()
  inflight.clear()
  lastRequestAt = 0
  pending = Promise.resolve()
}

export function pointFromNominatim(payload: unknown, requireStreet: boolean): GeoPoint | null {
  if (!Array.isArray(payload) || payload.length === 0) return null
  const hit = payload[0] as NominatimHit
  if (requireStreet && !hasStreet(hit.address)) return null
  return readCoordinatePair(hit?.lat, hit?.lon)
}

export async function geocodePlace(query: string, requireStreet = false): Promise<GeoPoint | null> {
  const normalized = query.trim().replace(/\s+/g, ' ').toLowerCase()
  if (!normalized) return null
  const key = `${requireStreet ? 'street' : 'area'}|${normalized}`
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.point

  const existing = inflight.get(key)
  if (existing) return existing

  const promise = schedule(() => fetchPlace(normalized, requireStreet))
    .then((point) => {
      cache.set(key, {
        point,
        expiresAt: Date.now() + (point ? SUCCESS_TTL_MS : FAILURE_TTL_MS),
      })
      return point
    })
    .finally(() => {
      inflight.delete(key)
    })
  inflight.set(key, promise)
  return promise
}

export async function resolveResourceMap(
  resources: Resource[],
  criteria: { city?: string; cityLabel?: string; zip?: string; locationLabel: string },
): Promise<ResourceMapView> {
  let center = searchAreaCenter(criteria)
  if (!center) {
    const point = await geocodePlace(centerGeocodeQuery(criteria), false)
    if (point) {
      center = { ...point, label: criteria.locationLabel, approximate: true }
    }
  }

  const places: MapPlace[] = []
  let unmapped = 0

  for (const resource of resources) {
    const saved = readCoordinatePair(resource.latitude, resource.longitude)
    let point = saved
    let approximate = false
    if (!point) {
      const query = resourceGeocodeQuery(resource)
      point = query ? await geocodePlace(query, true) : null
      approximate = point != null
    }
    if (!point) {
      unmapped += 1
      continue
    }
    places.push({
      id: resource.id,
      name: resource.name,
      category: resource.category,
      latitude: point.latitude,
      longitude: point.longitude,
      detail: locationDetail(resource),
      distance_label: center ? distanceLabel(distanceMiles(center, point), center.label) : null,
      approximate,
    })
  }

  return { center, places, unmapped_count: unmapped }
}

async function fetchPlace(query: string, requireStreet: boolean): Promise<GeoPoint | null> {
  const url = new URL(NOMINATIM_URL)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('countrycodes', 'us')
  url.searchParams.set('q', query)
  // Bias results toward the Seattle area without hiding matches outside it.
  url.searchParams.set('viewbox', '-122.6,47.8,-122.1,47.4')
  url.searchParams.set('bounded', '0')

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (!response.ok) return null
    const payload = await response.json() as unknown
    return pointFromNominatim(payload, requireStreet)
  } catch (error) {
    console.error('geocode failed', error instanceof Error ? error.message : 'unknown error')
    return null
  }
}

function schedule<T>(task: () => Promise<T>): Promise<T> {
  const run = pending.then(async () => {
    const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastRequestAt))
    if (wait > 0) await delay(wait)
    lastRequestAt = Date.now()
    return task()
  })
  pending = run.then(() => undefined, () => undefined)
  return run
}

function hasStreet(address: NominatimAddress | undefined): boolean {
  if (!address) return false
  return Boolean(address.house_number || address.road || address.pedestrian || address.building)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
