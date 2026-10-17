import { isResourceCategory, RESOURCE_CATEGORIES, type ResourceCategory } from './categories'

/**
 * Ranks published resources from fields the directory actually stores.
 * Category names are the stored directory list. Older checkbox labels are
 * accepted and normalized to those names. Cost is free only when the text
 * says so explicitly. Listings do not record transportation or coordinates,
 * so those are never invented.
 */

export type Resource = {
  id: string
  name: string
  description: string | null
  category: string | null
  cost: string | null
  address: string | null
  city: string | null
  eligibility: string | null
  contact: string | null
  source_url: string | null
  last_verified: string | null
  published: boolean
}

export type MatchCriteria = {
  categories: ResourceCategory[]
  locationLabel: string
  city?: string
  cityLabel?: string
  zip?: string
  freeOnly: boolean
  transportation?: string
  description?: string
}

export type MatchFactor = {
  key: string
  label: string
  points: number
  explanation: string
}

export type RankedMatch = {
  resource: Resource
  score: number
  reasons: string[]
  factors: MatchFactor[]
}

export const RESULT_DISCLAIMER =
  'These results are informational. They do not confirm that anyone qualifies for a program, or that funding, space, or immediate availability exists. Confirm details with the provider before traveling or applying.'

const CATEGORY_POINTS = 50
const RELATED_CATEGORY_POINTS = 25
const CITY_MATCH_POINTS = 20
const FREE_COST_POINTS = 10
const ELIGIBILITY_DOCUMENTED_POINTS = 5
const FRESH_WITHIN_6_MONTHS_POINTS = 8
const FRESH_WITHIN_18_MONTHS_POINTS = 4
const KEYWORD_POINTS = 2
const KEYWORD_POINTS_CAP = 8
const MAX_LOCATION_LENGTH = 100
const MAX_DESCRIPTION_LENGTH = 2000
const RESULT_LIMIT = 10

const RELATED_CATEGORIES: Partial<Record<ResourceCategory, ResourceCategory[]>> = {
  'Financial assistance': ['Housing and shelter'],
  'Housing and shelter': ['Financial assistance'],
  'Mental health': ['Healthcare'],
  Healthcare: ['Mental health'],
}

const LEGACY_CATEGORY_LABELS: Record<string, ResourceCategory> = {
  'food and groceries': 'Food assistance',
  'housing or emergency shelter': 'Housing and shelter',
  'rent assistance': 'Financial assistance',
  'utilities and electricity bills': 'Utilities',
  'healthcare or medical costs': 'Healthcare',
  'mental health support': 'Mental health',
  'employment or job training': 'Employment',
  'childcare or family services': 'Childcare',
  other: 'Other community services',
}

const CATEGORY_ALIASES: Record<string, ResourceCategory> = {}
for (const category of RESOURCE_CATEGORIES) {
  CATEGORY_ALIASES[category.toLowerCase()] = category
}
Object.assign(CATEGORY_ALIASES, LEGACY_CATEGORY_LABELS)

const TRANSPORTATION_PREFERENCES = new Set([
  'public transportation or walking',
  'access to a car',
  'wheelchair-accessible services',
  'transit',
  'car',
  'wheelchair',
])

const STOPWORDS = new Set([
  'about', 'also', 'and', 'any', 'are', 'been', 'but', 'else', 'for', 'from',
  'has', 'have', 'help', 'into', 'just', 'looking', 'lost', 'need', 'not',
  'one', 'our', 'please', 'recently', 'something', 'that', 'the', 'them',
  'they', 'this', 'two', 'was', 'were', 'will', 'with', 'you', 'your',
])

/** Seattle ZIP codes, used only to treat the ZIP as the city name Seattle. */
export const SEATTLE_ZIPS = new Set([
  '98101', '98102', '98103', '98104', '98105', '98106', '98107', '98108', '98109',
  '98112', '98115', '98116', '98117', '98118', '98119', '98121', '98122', '98125',
  '98126', '98133', '98134', '98136', '98144', '98154', '98164', '98174', '98177',
  '98195', '98199',
])

export type ParseSuccess = { ok: true; request: MatchCriteria }
export type ParseFailure = { ok: false; error: string; details?: string[]; categories?: string[] }
export type ParseResult = ParseSuccess | ParseFailure

export function canonicalizeCategory(value: string): ResourceCategory | null {
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (isResourceCategory(trimmed)) return trimmed
  return CATEGORY_ALIASES[trimmed.toLowerCase()] ?? null
}

export function normalizeCity(value: string): string {
  return value
    .trim()
    .replace(/,?\s*(wa|washington)\.?$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function isExplicitlyFree(cost: string | null | undefined): boolean {
  if (typeof cost !== 'string') return false
  const normalized = cost.trim().toLowerCase()
  if (!normalized) return false
  if (/\b(unknown|n\/a|varies|low[- ]cost|sliding|reduced|discounted|fee|copay|co-pay|not free)\b/.test(normalized)) {
    return false
  }
  if (/\bor\b/.test(normalized)) return false
  return /^(free|no cost|no charge|complimentary|\$0(?:\.00)?)([.\s].*)?$/.test(normalized)
}

export function candidateCategories(categories: ResourceCategory[]): ResourceCategory[] {
  const values = new Set<ResourceCategory>(categories)
  for (const category of categories) {
    for (const related of RELATED_CATEGORIES[category] ?? []) values.add(related)
  }
  return [...values]
}

export function resourceFromRow(row: unknown): Resource | null {
  if (typeof row !== 'object' || row === null) return null
  const record = row as Record<string, unknown>
  if (typeof record.id !== 'string' || !record.id.trim()) return null
  if (typeof record.name !== 'string' || !record.name.trim()) return null

  return {
    id: record.id,
    name: record.name.trim(),
    description: readNullableString(record.description),
    category: readNullableString(record.category),
    cost: readNullableString(record.cost),
    address: readNullableString(record.address),
    city: readNullableString(record.city),
    eligibility: readNullableString(record.eligibility),
    contact: readNullableString(record.contact),
    source_url: readNullableString(record.source_url),
    last_verified: record.last_verified == null || record.last_verified === '' ? null : String(record.last_verified),
    published: record.published === true,
  }
}

export function parseMatchRequest(body: unknown): ParseResult {
  if (!isPlainObject(body)) {
    return { ok: false, error: 'Request body must be a JSON object.' }
  }

  if (body.categories == null) {
    return { ok: false, error: 'categories must be an array of category names.' }
  }

  const categoryInput = Array.isArray(body.categories) ? body.categories : [body.categories]
  if (categoryInput.length === 0) {
    return { ok: false, error: 'Select at least one category.' }
  }

  const details: string[] = []
  const unknown: string[] = []
  const categories: ResourceCategory[] = []
  for (const item of categoryInput) {
    if (typeof item !== 'string' || !item.trim()) {
      details.push('Each category must be a non-empty string.')
      continue
    }
    const canonical = canonicalizeCategory(item)
    if (!canonical) {
      unknown.push(item.trim())
      details.push(`Unsupported category: ${item.trim()}`)
      continue
    }
    if (!categories.includes(canonical)) categories.push(canonical)
  }
  if (details.length > 0) {
    return { ok: false, error: 'One or more categories are invalid.', details, categories: unknown }
  }

  const location = parseLocation(body)
  if ('error' in location) return { ok: false, error: location.error }

  const freeOnly = parseFreeOnly(body.freeOnly ?? body.free_only)
  if (freeOnly === 'invalid') return { ok: false, error: 'freeOnly must be a boolean.' }

  const transportation = parseTransportation(body.transportation)
  if (transportation === 'invalid') return { ok: false, error: 'Unsupported transportation preference.' }

  const descriptionResult = parseDescription(body)
  if ('error' in descriptionResult) return { ok: false, error: descriptionResult.error }

  return {
    ok: true,
    request: {
      categories,
      locationLabel: location.locationLabel,
      city: location.city,
      cityLabel: location.cityLabel,
      zip: location.zip,
      freeOnly,
      transportation,
      description: descriptionResult.description,
    },
  }
}

export function matchResources(resources: Resource[], criteria: MatchCriteria): RankedMatch[] {
  return resources
    .filter((resource) => resource.published)
    .map((resource) => scoreResource(resource, criteria))
    .filter((match): match is RankedMatch => match !== null)
    .sort((a, b) => b.score - a.score || a.resource.name.localeCompare(b.resource.name))
    .slice(0, RESULT_LIMIT)
}

export function buildActionPlan(criteria: MatchCriteria): string[] {
  const needs = criteria.categories.join(', ')
  const steps = [
    `Review the best-matching options for ${needs}.`,
    'Confirm the provider service area and current hours on the official website.',
    'Check whether any identification or documentation is required. A listed eligibility note is not a decision that you qualify.',
    'Contact the provider before traveling. This search cannot confirm space, funding, or same-day availability.',
  ]

  if (criteria.freeOnly) {
    steps.push('You asked for completely free services. Listings without a clearly free cost were left out, including unknown, discounted, or mixed cost.')
  }
  if (criteria.transportation) {
    steps.push('Your transportation preference was not used for ranking because listings do not record transportation or wheelchair access.')
  }
  if (criteria.description) {
    steps.push('Your extra details were used only to look for matching words in published listings. They were not used to decide eligibility.')
  }
  return steps
}

function scoreResource(resource: Resource, criteria: MatchCriteria): RankedMatch | null {
  const category = categoryFactor(resource, criteria)
  if (!category) return null

  const location = locationFactor(resource, criteria)
  if (location === 'exclude') return null

  const cost = costFactor(resource, criteria)
  if (cost === 'exclude') return null

  const factors = [
    category,
    location,
    cost,
    eligibilityFactor(resource),
    freshnessFactor(resource.last_verified),
  ]
  const keywords = keywordFactor(resource, criteria.description)
  if (keywords) factors.push(keywords)

  const score = factors.reduce((sum, factor) => sum + factor.points, 0)
  return {
    resource,
    score,
    reasons: factors.filter((factor) => factor.points > 0).map((factor) => factor.explanation),
    factors,
  }
}

function categoryFactor(resource: Resource, criteria: MatchCriteria): MatchFactor | null {
  const category = resource.category
  if (!category || !isResourceCategory(category)) return null
  if (criteria.categories.includes(category)) {
    return {
      key: 'category',
      label: 'Category',
      points: CATEGORY_POINTS,
      explanation: `Matches ${category}.`,
    }
  }

  const relatedTo = criteria.categories.find((selected) => (RELATED_CATEGORIES[selected] ?? []).includes(category))
  if (!relatedTo) return null
  return {
    key: 'category',
    label: 'Related category',
    points: RELATED_CATEGORY_POINTS,
    explanation: `Related to ${relatedTo}: this listing is ${category}.`,
  }
}

function locationFactor(resource: Resource, criteria: MatchCriteria): MatchFactor | 'exclude' {
  if (!criteria.city) {
    const explanation = criteria.zip
      ? `ZIP ${criteria.zip} is outside the mapped Seattle ZIP list, so city was not used to filter results.`
      : 'No city was available to compare.'
    return { key: 'location', label: 'Location', points: 0, explanation }
  }

  if (!resource.city || !resource.city.trim()) {
    return {
      key: 'location',
      label: 'Location',
      points: 0,
      explanation: 'Service area is not listed, so location could not be confirmed.',
    }
  }

  if (normalizeCity(resource.city) !== criteria.city) return 'exclude'

  const explanation = criteria.zip
    ? `ZIP ${criteria.zip} is in ${criteria.cityLabel}, and this listing is in ${resource.city}.`
    : `Listed in ${resource.city}.`
  return { key: 'location', label: 'Location', points: CITY_MATCH_POINTS, explanation }
}

function costFactor(resource: Resource, criteria: MatchCriteria): MatchFactor | 'exclude' {
  if (isExplicitlyFree(resource.cost)) {
    return {
      key: 'cost',
      label: 'Cost',
      points: FREE_COST_POINTS,
      explanation: `Cost is listed as "${resource.cost}", which is explicitly free.`,
    }
  }
  if (criteria.freeOnly) return 'exclude'
  if (!resource.cost || !resource.cost.trim()) {
    return {
      key: 'cost',
      label: 'Cost',
      points: 0,
      explanation: 'Cost is not listed, so it was not treated as free.',
    }
  }
  return {
    key: 'cost',
    label: 'Cost',
    points: 0,
    explanation: `Cost is listed as "${resource.cost}", which is not treated as completely free.`,
  }
}

function eligibilityFactor(resource: Resource): MatchFactor {
  if (resource.eligibility && resource.eligibility.trim()) {
    return {
      key: 'eligibility',
      label: 'Eligibility',
      points: ELIGIBILITY_DOCUMENTED_POINTS,
      explanation: 'Eligibility information is listed. This is not a decision that you qualify.',
    }
  }
  return {
    key: 'eligibility',
    label: 'Eligibility',
    points: 0,
    explanation: 'Eligibility is not listed.',
  }
}

function freshnessFactor(lastVerified: string | null): MatchFactor {
  const label = 'Information freshness'
  if (!lastVerified || !lastVerified.trim()) {
    return {
      key: 'freshness',
      label,
      points: 0,
      explanation: 'No last-verified date is listed, so information freshness is unknown.',
    }
  }

  const timestamp = Date.parse(lastVerified)
  if (Number.isNaN(timestamp)) {
    return {
      key: 'freshness',
      label,
      points: 0,
      explanation: 'A last-verified value is present but could not be read as a date.',
    }
  }

  const ageDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24)
  if (ageDays < 0) {
    return {
      key: 'freshness',
      label,
      points: 0,
      explanation: 'The last-verified date is in the future and was not used for ranking.',
    }
  }
  if (ageDays <= 180) {
    return {
      key: 'freshness',
      label,
      points: FRESH_WITHIN_6_MONTHS_POINTS,
      explanation: 'Last verified within the past 6 months.',
    }
  }
  if (ageDays <= 548) {
    return {
      key: 'freshness',
      label,
      points: FRESH_WITHIN_18_MONTHS_POINTS,
      explanation: 'Last verified within the past 18 months.',
    }
  }
  return {
    key: 'freshness',
    label,
    points: 0,
    explanation: 'The last-verified date is older than 18 months.',
  }
}

function keywordFactor(resource: Resource, description: string | undefined): MatchFactor | null {
  if (!description) return null
  const keywords = extractKeywords(description)
  if (keywords.length === 0) return null

  const haystack = [resource.name, resource.description, resource.eligibility, resource.category]
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .toLowerCase()
  const hits = keywords.filter((word) => haystack.includes(word))
  if (hits.length === 0) return null

  return {
    key: 'keywords',
    label: 'Extra details',
    points: Math.min(KEYWORD_POINTS_CAP, hits.length * KEYWORD_POINTS),
    explanation: `Extra details match words on this listing: ${hits.slice(0, 4).join(', ')}.`,
  }
}

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/[^a-z0-9]+/)
  return [...new Set(words.filter((word) => word.length >= 4 && !STOPWORDS.has(word)))]
}

function parseLocation(body: Record<string, unknown>): {
  locationLabel: string
  city?: string
  cityLabel?: string
  zip?: string
} | { error: string } {
  const location = readOptionalString(body.location)
  const cityInput = readOptionalString(body.city)
  const zipInput = readOptionalString(body.zip)
  const pieces = [cityInput, zipInput, location].filter((value): value is string => Boolean(value))
  if (pieces.length === 0) return { error: 'A city or ZIP code is required.' }
  if (pieces.some((value) => value.length > MAX_LOCATION_LENGTH)) {
    return { error: `City or ZIP must be at most ${MAX_LOCATION_LENGTH} characters.` }
  }

  let zip = zipInput && /^\d{5}$/.test(zipInput) ? zipInput : undefined
  let cityLabel = cityInput ? stripState(cityInput) : undefined
  const leftover = location && location !== cityInput && location !== zipInput ? location : undefined
  if (leftover) {
    const zipMatch = leftover.match(/^(\d{5})(?:-\d{4})?$/)
    if (zipMatch) zip = zipMatch[1]
    else cityLabel = stripState(leftover)
  }

  if (!cityLabel && !zip) return { error: 'Enter a city name or a 5-digit ZIP code.' }

  if (zip && !cityLabel && SEATTLE_ZIPS.has(zip)) cityLabel = 'Seattle'
  const city = cityLabel ? normalizeCity(cityLabel) : undefined
  const locationLabel = cityLabel || zip || pieces[0]
  return { locationLabel, city, cityLabel, zip }
}

function parseFreeOnly(value: unknown): boolean | 'invalid' {
  if (value === undefined || value === null || value === '') return false
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return 'invalid'
}

function parseTransportation(value: unknown): string | undefined | 'invalid' {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string') return 'invalid'
  const normalized = value.trim().toLowerCase()
  if (!TRANSPORTATION_PREFERENCES.has(normalized)) return 'invalid'
  return value.trim()
}

function parseDescription(body: Record<string, unknown>): { description?: string } | { error: string } {
  if (body.description != null && body.description !== '' && typeof body.description !== 'string') {
    return { error: 'description must be a string.' }
  }
  if (body.text != null && body.text !== '' && typeof body.text !== 'string') {
    return { error: 'text must be a string.' }
  }
  const description = readOptionalString(body.description) ?? readOptionalString(body.text)
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    return { error: `description must be at most ${MAX_DESCRIPTION_LENGTH} characters.` }
  }
  return { description }
}

function stripState(value: string): string {
  return value.trim().replace(/,?\s*(wa|washington)\.?$/i, '').replace(/\s+/g, ' ').trim()
}

function readOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function readNullableString(value: unknown): string | null {
  return readOptionalString(value) ?? null
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
