/**
 * NeighborAid matching engine.
 *
 * Ranking uses only fields that exist on a resource record. The current
 * schema has no coordinates, transportation, or live availability, so this
 * module never invents distances or claims that a caller qualifies or that
 * space/funding is confirmed.
 */

export type CanonicalCategory =
  | 'food'
  | 'housing'
  | 'rent'
  | 'utilities'
  | 'healthcare'
  | 'mental_health'
  | 'employment'
  | 'financial'
  | 'transportation'
  | 'childcare'
  | 'legal'
  | 'other'

export type TransportationPreference =
  | 'public_or_walking'
  | 'car'
  | 'wheelchair_accessible'

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
  categories: string[]
  canonicalCategories: CanonicalCategory[]
  city?: string
  zip?: string
  citySource?: 'entered' | 'zip'
  locationLabel: string
  freeOnly: boolean
  transportation?: TransportationPreference
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

const CATEGORY_ALIASES: Record<string, CanonicalCategory> = {
  food: 'food',
  'food assistance': 'food',
  'food and groceries': 'food',
  groceries: 'food',
  housing: 'housing',
  'housing and shelter': 'housing',
  'housing or emergency shelter': 'housing',
  'emergency shelter': 'housing',
  shelter: 'housing',
  rent: 'rent',
  'rent assistance': 'rent',
  utilities: 'utilities',
  'utilities and electricity bills': 'utilities',
  electricity: 'utilities',
  healthcare: 'healthcare',
  'healthcare or medical costs': 'healthcare',
  medical: 'healthcare',
  'mental health': 'mental_health',
  'mental health support': 'mental_health',
  employment: 'employment',
  'employment or job training': 'employment',
  'job training': 'employment',
  jobs: 'employment',
  financial: 'financial',
  'financial assistance': 'financial',
  transportation: 'transportation',
  childcare: 'childcare',
  'childcare or family services': 'childcare',
  'family services': 'childcare',
  legal: 'legal',
  'legal assistance': 'legal',
  other: 'other',
  'other community services': 'other',
}

const RELATED_CATEGORIES: Partial<Record<CanonicalCategory, CanonicalCategory[]>> = {
  rent: ['housing', 'financial'],
  housing: ['rent'],
  financial: ['rent'],
  mental_health: ['healthcare'],
  healthcare: ['mental_health'],
}

const CATEGORY_POINTS = 50
const RELATED_CATEGORY_POINTS = 25
const CITY_MATCH_POINTS = 20
const ZIP_CITY_MATCH_POINTS = 15
const CITY_MISMATCH_POINTS = -5
const FREE_COST_POINTS = 10
const ELIGIBILITY_DOCUMENTED_POINTS = 5
const FRESH_WITHIN_6_MONTHS_POINTS = 8
const FRESH_WITHIN_18_MONTHS_POINTS = 4
const KEYWORD_POINTS = 2
const KEYWORD_POINTS_CAP = 8

const STOPWORDS = new Set([
  'about', 'also', 'and', 'any', 'are', 'been', 'but', 'else', 'for', 'from',
  'has', 'have', 'help', 'into', 'just', 'looking', 'lost', 'need', 'not',
  'one', 'our', 'please', 'recently', 'something', 'that', 'the', 'them',
  'they', 'this', 'two', 'was', 'were', 'will', 'with', 'you', 'your',
])

/** Seattle ZIP codes used only to map a ZIP to the city name "Seattle". */
export const SEATTLE_ZIPS = new Set([
  '98101', '98102', '98103', '98104', '98105', '98106', '98107', '98108', '98109',
  '98112', '98115', '98116', '98117', '98118', '98119', '98121', '98122', '98125',
  '98126', '98133', '98134', '98136', '98144', '98154', '98164', '98174', '98177',
  '98195', '98199',
])

export function normalizeCategoryLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function normalizeCategory(value: string): CanonicalCategory | null {
  return CATEGORY_ALIASES[normalizeCategoryLabel(value)] ?? null
}

export function isAcceptedCategory(value: string): boolean {
  return normalizeCategory(value) !== null
}

export function normalizeCity(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/,?\s*(wa|washington)\.?$/i, '')
    .replace(/\s+/g, ' ')
}

/**
 * Strict free-cost check. Unknown, empty, mixed, or discounted cost is not free.
 */
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

export function cityForZip(zip: string): string | undefined {
  if (SEATTLE_ZIPS.has(zip)) return 'seattle'
  return undefined
}

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/[^a-z0-9]+/)
  const unique = new Set(words.filter((word) => word.length >= 4 && !STOPWORDS.has(word)))
  return [...unique]
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
      explanation: 'A last-verified value is present but could not be parsed as a date.',
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
      explanation: `Listing was last verified on ${lastVerified} (within 6 months). Confirm current details with the provider.`,
    }
  }
  if (ageDays <= 547) {
    return {
      key: 'freshness',
      label,
      points: FRESH_WITHIN_18_MONTHS_POINTS,
      explanation: `Listing was last verified on ${lastVerified} (within 18 months). Confirm current details with the provider.`,
    }
  }
  return {
    key: 'freshness',
    label,
    points: 0,
    explanation: `Listing was last verified on ${lastVerified}, which is more than 18 months ago. Confirm current details with the provider.`,
  }
}

function categoryFactor(resource: Resource, criteria: MatchCriteria): MatchFactor | null {
  const resourceCategory = resource.category ? normalizeCategory(resource.category) : null
  if (!resourceCategory) {
    return {
      key: 'category',
      label: 'Category',
      points: 0,
      explanation: 'This listing has no recognized category, so it was not treated as a category match.',
    }
  }

  if (criteria.canonicalCategories.includes(resourceCategory)) {
    const matched = criteria.categories.filter((label) => normalizeCategory(label) === resourceCategory)
    return {
      key: 'category',
      label: 'Category',
      points: CATEGORY_POINTS,
      explanation: `Listed category "${resource.category}" matches selected need${matched.length === 1 ? '' : 's'}: ${matched.join(', ') || resourceCategory}.`,
    }
  }

  const relatedHits = criteria.canonicalCategories.filter((selected) => {
    return RELATED_CATEGORIES[selected]?.includes(resourceCategory)
      || RELATED_CATEGORIES[resourceCategory]?.includes(selected)
  })
  if (relatedHits.length > 0) {
    return {
      key: 'category',
      label: 'Category',
      points: RELATED_CATEGORY_POINTS,
      explanation: `Listed category "${resource.category}" is related to a selected need, but is not an exact category match. Confirm the program type with the provider.`,
    }
  }

  return null
}

function locationFactor(resource: Resource, criteria: MatchCriteria): MatchFactor {
  const resourceCity = resource.city ? normalizeCity(resource.city) : ''
  const zipCity = criteria.zip ? cityForZip(criteria.zip) : undefined

  if (!resourceCity) {
    return {
      key: 'location',
      label: 'Location',
      points: 0,
      explanation: 'City or service area is not listed. This is not a distance estimate.',
    }
  }

  if (zipCity && resourceCity === zipCity && criteria.citySource === 'zip') {
    return {
      key: 'location',
      label: 'Location',
      points: ZIP_CITY_MATCH_POINTS,
      explanation: `ZIP ${criteria.zip} is associated with ${zipCity}, which matches this listing's city. This is not a proximity or distance calculation.`,
    }
  }

  if (criteria.city && resourceCity === criteria.city && criteria.citySource !== 'zip') {
    return {
      key: 'location',
      label: 'Location',
      points: CITY_MATCH_POINTS,
      explanation: `Listing city "${resource.city}" matches the city you entered. This is a city-name match, not a calculated distance.`,
    }
  }

  if (criteria.city || zipCity) {
    return {
      key: 'location',
      label: 'Location',
      points: CITY_MISMATCH_POINTS,
      explanation: `This listing is in ${resource.city}, which does not match ${criteria.locationLabel}. Confirm the service area before traveling. No distance was calculated.`,
    }
  }

  return {
    key: 'location',
    label: 'Location',
    points: 0,
    explanation: `Listing city is ${resource.city}. No comparable city or ZIP mapping was available to score location.`,
  }
}

function costFactor(resource: Resource, criteria: MatchCriteria): MatchFactor {
  if (isExplicitlyFree(resource.cost)) {
    return {
      key: 'cost',
      label: 'Cost',
      points: FREE_COST_POINTS,
      explanation: `Cost is listed as "${resource.cost}", which is treated as completely free.`,
    }
  }
  if (!resource.cost || !resource.cost.trim() || /unknown|n\/a/i.test(resource.cost)) {
    return {
      key: 'cost',
      label: 'Cost',
      points: 0,
      explanation: criteria.freeOnly
        ? 'Cost is unknown, so this listing cannot be treated as free.'
        : 'Cost is not listed or is marked unknown.',
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
      label: 'Eligibility information',
      points: ELIGIBILITY_DOCUMENTED_POINTS,
      explanation: 'This listing includes eligibility notes to review. That is not a determination that anyone qualifies.',
    }
  }
  return {
    key: 'eligibility',
    label: 'Eligibility information',
    points: 0,
    explanation: 'Eligibility requirements are not listed.',
  }
}

function keywordFactor(resource: Resource, description: string): MatchFactor | null {
  const keywords = extractKeywords(description)
  if (keywords.length === 0) return null

  const haystack = [resource.name, resource.description, resource.category, resource.eligibility]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase()

  const hits = keywords.filter((word) => haystack.includes(word))
  if (hits.length === 0) {
    return {
      key: 'keywords',
      label: 'Optional description overlap',
      points: 0,
      explanation: 'Optional description keywords did not overlap with this listing. Checkbox categories remain the primary match signal.',
    }
  }

  const points = Math.min(KEYWORD_POINTS_CAP, hits.length * KEYWORD_POINTS)
  return {
    key: 'keywords',
    label: 'Optional description overlap',
    points,
    explanation: `Optional description shared ${hits.length} keyword${hits.length === 1 ? '' : 's'} with this listing (${hits.slice(0, 5).join(', ')}). This only refines ranking and does not invent resources.`,
  }
}

function scoreResource(resource: Resource, criteria: MatchCriteria): RankedMatch | null {
  const category = categoryFactor(resource, criteria)
  if (!category || category.points <= 0) return null

  if (criteria.freeOnly && !isExplicitlyFree(resource.cost)) return null

  const factors: MatchFactor[] = [
    category,
    locationFactor(resource, criteria),
    costFactor(resource, criteria),
    eligibilityFactor(resource),
    freshnessFactor(resource.last_verified),
  ]

  if (criteria.description && criteria.description.trim()) {
    const keywords = keywordFactor(resource, criteria.description)
    if (keywords) factors.push(keywords)
  }

  if (criteria.transportation) {
    factors.push({
      key: 'transportation',
      label: 'Transportation',
      points: 0,
      explanation: 'Transportation access is not stored on resource records, so this preference could not be applied.',
    })
  }

  const score = factors.reduce((sum, factor) => sum + factor.points, 0)
  return {
    resource,
    score,
    reasons: factors.map((factor) => factor.explanation),
    factors,
  }
}

export function matchResources(resources: Resource[], criteria: MatchCriteria): RankedMatch[] {
  return resources
    .filter((resource) => resource.published === true)
    .map((resource) => scoreResource(resource, criteria))
    .filter((match): match is RankedMatch => match !== null)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.resource.name.localeCompare(b.resource.name)
    })
}

export function buildActionPlan(criteria: MatchCriteria): string[] {
  const steps = [
    'Review the ranked resources and their listed categories, cost, and location.',
    'Open each official source link and confirm hours, service area, and application steps.',
    'Review any listed eligibility notes with the provider. This tool does not determine that you qualify.',
    'Contact the provider before traveling. Listings do not confirm space, funding, or same-day availability.',
  ]

  if (criteria.freeOnly) {
    steps.push('You asked for free-only services. Listings without a clearly free cost were excluded, including unknown cost.')
  }
  if (criteria.transportation) {
    steps.push('Transportation access is not recorded in the current resource data. Confirm access with the provider.')
  }
  return steps
}
