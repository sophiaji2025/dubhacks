import {
  centerGeocodeQuery,
  distanceLabel,
  distanceMiles,
  isInKingCounty,
  locationDetail,
  readCoordinatePair,
  resourceGeocodeRequest,
  searchAreaCenter,
  type GeoPoint,
  type MapPlace,
  type ResourceGeocodeRequest,
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
const REQUEST_TIMEOUT_MS = 4000
const AREA_TYPES = new Set([
  'administrative',
  'city',
  'country',
  'county',
  'municipality',
  'neighbourhood',
  'postcode',
  'quarter',
  'state',
  'suburb',
  'town',
  'village',
])
const STREET_TYPES = new Set([
  'amenity',
  'building',
  'house',
  'office',
  'place_of_worship',
  'shop',
  'social_facility',
])

type CacheEntry = {
  point: GeoPoint | null
  expiresAt: number
}

type NominatimAddress = {
  house_number?: string
  road?: string
  pedestrian?: string
  building?: string
  amenity?: string
  office?: string
  shop?: string
  house?: string
}

type NominatimHit = {
  lat?: string
  lon?: string
  addresstype?: string
  class?: string
  type?: string
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
  for (const item of payload) {
    const hit = item as NominatimHit
    const point = readCoordinatePair(hit?.lat, hit?.lon)
    if (!point) continue
    if (requireStreet) {
      if (!isStreetLevelHit(hit)) continue
      if (!isInKingCounty(point)) continue
    }
    return point
  }
  return null
}

export async function geocodePlace(query: string, requireStreet = false): Promise<GeoPoint | null> {
  const normalized = query.trim().replace(/\s+/g, ' ').toLowerCase()
  if (!normalized) return null
  const key = `${requireStreet ? 'street' : 'area'}|${normalized}`
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.point

  const existing = inflight.get(key)
  if (existing) return existing

  const promise = schedule(() => fetchPlace({ text: query.trim() }, requireStreet))
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
      const request = resourceGeocodeRequest(resource)
      point = request ? await geocodeStructured(request, true) : null
      approximate = point != null
    }
    if (!point) {
      unmapped += 1
      continue
    }
    places.push(placeFromPoint(resource, point, center, approximate))
  }

  return { center, places, unmapped_count: unmapped }
}

/** Pins listings that already have coordinates. Street geocoding stays on search. */
export function mapFromSavedCoordinates(
  resources: Resource[],
  criteria: { city?: string; cityLabel?: string; zip?: string; locationLabel: string },
): ResourceMapView {
  const center = searchAreaCenter(criteria)
  const places: MapPlace[] = []
  let unmapped = 0
  for (const resource of resources) {
    const saved = readCoordinatePair(resource.latitude, resource.longitude)
    if (!saved) {
      unmapped += 1
      continue
    }
    places.push(placeFromPoint(resource, saved, center, false))
  }
  return { center, places, unmapped_count: unmapped }
}

function placeFromPoint(
  resource: Resource,
  point: GeoPoint,
  center: { latitude: number; longitude: number; label: string } | null,
  approximate: boolean,
): MapPlace {
  return {
    id: resource.id,
    name: resource.name,
    category: resource.category,
    latitude: point.latitude,
    longitude: point.longitude,
    detail: locationDetail(resource),
    distance_label: center ? distanceLabel(distanceMiles(center, point), center.label) : null,
    approximate,
  }
}

async function geocodeStructured(request: ResourceGeocodeRequest, requireStreet: boolean): Promise<GeoPoint | null> {
  const key = `${requireStreet ? 'street' : 'area'}|${request.text.trim().replace(/\s+/g, ' ').toLowerCase()}`
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.point

  const existing = inflight.get(key)
  if (existing) return existing

  const promise = schedule(() => fetchPlace(request, requireStreet))
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

async function fetchPlace(
  request: { text: string; street?: string; city?: string; state?: string; postalcode?: string },
  requireStreet: boolean,
): Promise<GeoPoint | null> {
  const url = new URL(NOMINATIM_URL)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '5')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('countrycodes', 'us')
  url.searchParams.set('viewbox', '-122.55,47.78,-121.06,47.15')
  url.searchParams.set('bounded', '0')

  if (request.street && request.city) {
    url.searchParams.set('street', request.street)
    url.searchParams.set('city', request.city)
    url.searchParams.set('state', request.state || 'Washington')
    if (request.postalcode) url.searchParams.set('postalcode', request.postalcode)
  } else {
    url.searchParams.set('q', request.text)
  }

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

function isStreetLevelHit(hit: NominatimHit): boolean {
  const kind = (hit.addresstype || hit.type || '').toLowerCase()
  if (AREA_TYPES.has(kind)) return false
  if (hit.class === 'boundary' || (hit.class === 'place' && AREA_TYPES.has(kind))) return false
  if (hasStreet(hit.address)) return true
  if (STREET_TYPES.has(kind) || STREET_TYPES.has((hit.class || '').toLowerCase())) return true
  return false
}

function hasStreet(address: NominatimAddress | undefined): boolean {
  if (!address) return false
  return Boolean(
    address.house_number
    || address.road
    || address.pedestrian
    || address.building
    || address.amenity
    || address.office
    || address.shop
    || address.house,
  )
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
