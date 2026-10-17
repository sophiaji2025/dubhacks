import {
  cityForZip,
  isAcceptedCategory,
  normalizeCategory,
  normalizeCity,
  type CanonicalCategory,
  type MatchCriteria,
  type TransportationPreference,
} from './matching'

export type ParseSuccess = {
  ok: true
  request: MatchCriteria
}

export type ParseFailure = {
  ok: false
  error: string
  details?: string[]
}

export type ParseResult = ParseSuccess | ParseFailure

const MAX_LOCATION_LENGTH = 100
const MAX_DESCRIPTION_LENGTH = 2000
const ZIP_PATTERN = /^\d{5}$/

const TRANSPORTATION_ALIASES: Record<string, TransportationPreference> = {
  public_or_walking: 'public_or_walking',
  'public transportation or walking': 'public_or_walking',
  walking: 'public_or_walking',
  transit: 'public_or_walking',
  car: 'car',
  'access to a car': 'car',
  wheelchair_accessible: 'wheelchair_accessible',
  'wheelchair-accessible services': 'wheelchair_accessible',
  'wheelchair accessible': 'wheelchair_accessible',
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function parseTransportation(value: unknown): TransportationPreference | undefined | 'invalid' {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string') return 'invalid'
  const normalized = value.trim().toLowerCase()
  return TRANSPORTATION_ALIASES[normalized] ?? 'invalid'
}

function parseFreeOnly(body: Record<string, unknown>): boolean | 'invalid' {
  const value = body.freeOnly ?? body.free_only ?? body.free
  if (value === undefined || value === null || value === '') return false
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return 'invalid'
}

function parseLocation(body: Record<string, unknown>): {
  city?: string
  zip?: string
  citySource?: 'entered' | 'zip'
  locationLabel: string
} | { error: string } {
  const location = readString(body.location)
  const cityInput = readString(body.city)
  const zipInput = readString(body.zip)

  const rawPieces = [cityInput, zipInput, location].filter((value): value is string => Boolean(value))
  if (rawPieces.length === 0) {
    return { error: 'A city or ZIP code is required.' }
  }

  const tooLong = rawPieces.find((value) => value.length > MAX_LOCATION_LENGTH)
  if (tooLong) {
    return { error: `City or ZIP must be at most ${MAX_LOCATION_LENGTH} characters.` }
  }

  let zip = zipInput && ZIP_PATTERN.test(zipInput) ? zipInput : undefined
  let city = cityInput ? normalizeCity(cityInput) : undefined

  const leftover = location && location !== cityInput && location !== zipInput ? location : undefined
  if (leftover) {
    if (ZIP_PATTERN.test(leftover)) {
      zip = leftover
    } else {
      city = normalizeCity(leftover)
    }
  }

  if (!city && !zip) {
    return { error: 'Enter a city name or a 5-digit ZIP code.' }
  }

  let citySource: 'entered' | 'zip' | undefined = city ? 'entered' : undefined
  if (zip && !city) {
    const mapped = cityForZip(zip)
    if (mapped) {
      city = mapped
      citySource = 'zip'
    }
  }

  const locationLabel = cityInput || zipInput || location || 'the location you entered'
  return { city, zip, citySource, locationLabel }
}

export function parseMatchRequest(body: unknown): ParseResult {
  if (!isPlainObject(body)) {
    return { ok: false, error: 'Request body must be a JSON object.' }
  }

  if (!Array.isArray(body.categories)) {
    return { ok: false, error: 'categories must be an array of category labels.' }
  }

  const rawCategories = body.categories
  if (rawCategories.length === 0) {
    return { ok: false, error: 'Select at least one category.' }
  }

  const details: string[] = []
  const categories: string[] = []
  const canonicalCategories: CanonicalCategory[] = []

  for (const item of rawCategories) {
    if (typeof item !== 'string' || !item.trim()) {
      details.push('Each category must be a non-empty string.')
      continue
    }
    if (!isAcceptedCategory(item)) {
      details.push(`Unsupported category: ${item}`)
      continue
    }
    const canonical = normalizeCategory(item)
    if (!canonical) continue
    if (!canonicalCategories.includes(canonical)) {
      canonicalCategories.push(canonical)
      categories.push(item.trim())
    }
  }

  if (details.length > 0) {
    return { ok: false, error: 'One or more categories are invalid.', details }
  }
  if (canonicalCategories.length === 0) {
    return { ok: false, error: 'Select at least one category.' }
  }

  const location = parseLocation(body)
  if ('error' in location) {
    return { ok: false, error: location.error }
  }

  const freeOnly = parseFreeOnly(body)
  if (freeOnly === 'invalid') {
    return { ok: false, error: 'freeOnly must be a boolean.' }
  }

  const transportation = parseTransportation(body.transportation)
  if (transportation === 'invalid') {
    return { ok: false, error: 'Unsupported transportation preference.' }
  }

  const description = readString(body.description) ?? readString(body.text)
  if (body.description !== undefined && body.description !== null && body.description !== '' && typeof body.description !== 'string') {
    return { ok: false, error: 'description must be a string.' }
  }
  if (body.text !== undefined && body.text !== null && body.text !== '' && typeof body.text !== 'string') {
    return { ok: false, error: 'description must be a string.' }
  }
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    return { ok: false, error: `description must be at most ${MAX_DESCRIPTION_LENGTH} characters.` }
  }

  return {
    ok: true,
    request: {
      categories,
      canonicalCategories,
      city: location.city,
      zip: location.zip,
      citySource: location.citySource,
      locationLabel: location.locationLabel,
      freeOnly,
      transportation,
      description,
    },
  }
}
