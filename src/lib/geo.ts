/**
 * Map geometry for the Seattle directory.
 *
 * ZIP and city centers frame the map. They are not resource locations and
 * they are not the person's exact address. A listing is pinned only from
 * saved coordinates or a street address.
 */

export type GeoPoint = {
  latitude: number
  longitude: number
}

export type MapCenter = GeoPoint & {
  label: string
  approximate: boolean
}

export type MapPlace = GeoPoint & {
  id: string
  name: string
  category: string | null
  detail: string | null
  distance_label: string | null
  approximate: boolean
}

export type ResourceMapView = {
  center: MapCenter | null
  places: MapPlace[]
  unmapped_count: number
}

export const SEATTLE_CENTER: GeoPoint = {
  latitude: 47.6062,
  longitude: -122.3321,
}

/** Approximate centers of Seattle ZIP codes, used only to frame a search. */
export const SEATTLE_ZIP_CENTERS: Record<string, GeoPoint> = {
  '98101': { latitude: 47.6108, longitude: -122.334 },
  '98102': { latitude: 47.6348, longitude: -122.322 },
  '98103': { latitude: 47.673, longitude: -122.342 },
  '98104': { latitude: 47.6021, longitude: -122.3284 },
  '98105': { latitude: 47.6636, longitude: -122.3015 },
  '98106': { latitude: 47.5354, longitude: -122.3552 },
  '98107': { latitude: 47.6685, longitude: -122.376 },
  '98108': { latitude: 47.5494, longitude: -122.31 },
  '98109': { latitude: 47.6295, longitude: -122.3465 },
  '98112': { latitude: 47.6295, longitude: -122.2965 },
  '98115': { latitude: 47.685, longitude: -122.301 },
  '98116': { latitude: 47.5735, longitude: -122.3925 },
  '98117': { latitude: 47.687, longitude: -122.3785 },
  '98118': { latitude: 47.5415, longitude: -122.2755 },
  '98119': { latitude: 47.639, longitude: -122.3675 },
  '98121': { latitude: 47.6155, longitude: -122.3465 },
  '98122': { latitude: 47.611, longitude: -122.303 },
  '98125': { latitude: 47.7165, longitude: -122.3015 },
  '98126': { latitude: 47.5445, longitude: -122.3755 },
  '98133': { latitude: 47.7375, longitude: -122.3445 },
  '98134': { latitude: 47.579, longitude: -122.334 },
  '98136': { latitude: 47.5385, longitude: -122.3875 },
  '98144': { latitude: 47.585, longitude: -122.299 },
  '98154': { latitude: 47.6062, longitude: -122.3321 },
  '98164': { latitude: 47.6055, longitude: -122.333 },
  '98174': { latitude: 47.6045, longitude: -122.335 },
  '98177': { latitude: 47.7465, longitude: -122.3705 },
  '98195': { latitude: 47.655, longitude: -122.3035 },
  '98199': { latitude: 47.649, longitude: -122.4 },
}

const EARTH_MILES = 3958.7613

export function readCoordinatePair(latitude: unknown, longitude: unknown): GeoPoint | null {
  const lat = readNumber(latitude)
  const lng = readNumber(longitude)
  if (lat == null || lng == null) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { latitude: lat, longitude: lng }
}

export function searchAreaCenter(input: {
  city?: string
  zip?: string
  locationLabel: string
}): MapCenter | null {
  if (input.zip) {
    const point = SEATTLE_ZIP_CENTERS[input.zip]
    if (point) return { ...point, label: `ZIP ${input.zip}`, approximate: true }
  }
  if (input.city === 'seattle') {
    return { ...SEATTLE_CENTER, label: 'Seattle', approximate: true }
  }
  return null
}

export function distanceMiles(from: GeoPoint, to: GeoPoint): number {
  const lat1 = toRadians(from.latitude)
  const lat2 = toRadians(to.latitude)
  const dLat = toRadians(to.latitude - from.latitude)
  const dLng = toRadians(to.longitude - from.longitude)
  const haversine = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_MILES * Math.asin(Math.min(1, Math.sqrt(haversine)))
}

export function formatMiles(miles: number): string {
  if (!Number.isFinite(miles) || miles < 0) return 'an unknown distance'
  if (miles < 0.1) return 'under 0.1 miles'
  const rounded = Math.round(miles * 10) / 10
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  return `${text} ${rounded === 1 ? 'mile' : 'miles'}`
}

export function distanceLabel(miles: number, centerLabel: string): string {
  return `About ${formatMiles(miles)} from the center of ${centerLabel}`
}

export function locationDetail(resource: {
  address: string | null
  city: string | null
  service_area: string | null
}): string | null {
  const parts = [resource.address, resource.city, resource.service_area]
    .map((value) => value?.trim() ?? '')
    .filter((value) => value.length > 0)
  return parts.length > 0 ? parts.join(', ') : null
}

export function resourceGeocodeQuery(resource: {
  address: string | null
  city: string | null
}): string | null {
  const address = resource.address?.trim() ?? ''
  if (address.length < 4) return null
  if (/^(n\/a|na|none|unknown|tbd|varies)$/i.test(address)) return null
  const city = resource.city?.trim()
  return city ? `${address}, ${city}, Washington` : `${address}, Washington`
}

export function centerGeocodeQuery(input: {
  cityLabel?: string
  zip?: string
  locationLabel: string
}): string {
  if (input.zip && input.cityLabel) return `${input.zip}, ${input.cityLabel}, Washington`
  if (input.zip) return `${input.zip}, Washington`
  return `${input.cityLabel || input.locationLabel}, Washington`
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim())
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function toRadians(degrees: number): number {
  return degrees * Math.PI / 180
}
