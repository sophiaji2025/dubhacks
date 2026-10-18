/**
 * Curated Seattle programs from docs/SPEC.md.
 *
 * Used when the live directory is empty, unreadable, or still the example.org
 * seed. Street pins use official public addresses and Nominatim points checked
 * against those streets. Citywide programs stay unmapped.
 */

import { readCoordinatePair } from './geo'

export type CuratedResourceRow = {
  id: string
  name: string
  description: string
  category: string
  cost: string | null
  address: string | null
  city: string
  service_area: string | null
  zip_codes: string[] | null
  eligibility: string | null
  contact: string | null
  source_url: string
  application_instructions: string | null
  last_verified: string
  wheelchair_accessible: boolean | null
  serves_children_or_families: boolean | null
  appointment_required: boolean | null
  walk_in: boolean | null
  latitude: number | null
  longitude: number | null
  published: true
}

type DirectoryOpts = {
  categories?: string[]
  limit?: number
}

/** Nominatim points for the official street addresses, checked 2026-10-18. */
export const CURATED_PUBLISHED_RESOURCES: CuratedResourceRow[] = [
  {
    id: 'curated-afterschool-meals',
    name: 'Afterschool Meals Program',
    description: 'Free meal and snack sites for children and youth through Seattle Human Services.',
    category: 'Food assistance',
    cost: 'Free',
    address: null,
    city: 'Seattle',
    service_area: 'Seattle',
    zip_codes: null,
    eligibility: 'Ages 1–18, or 18+ with a documented disability.',
    contact: null,
    source_url: 'https://www.seattle.gov/human-services/services-and-programs/food-resources/afterschool-meals-program',
    application_instructions: 'Use the official site to find a meal site. This is a citywide program, not one street address.',
    last_verified: '2026-10-18',
    wheelchair_accessible: null,
    serves_children_or_families: true,
    appointment_required: null,
    walk_in: null,
    latitude: null,
    longitude: null,
    published: true,
  },
  {
    id: 'curated-seattle-fresh-bucks',
    name: 'Seattle Fresh Bucks',
    description: 'Monthly benefits to spend at participating farmers markets, independent grocers, and supermarkets with a Fresh Bucks Card or the HealthyBenefits+ app.',
    category: 'Food assistance',
    cost: 'Free',
    address: null,
    city: 'Seattle',
    service_area: 'Seattle city limits',
    zip_codes: null,
    eligibility: 'Must meet income requirements and live within Seattle city limits. A waitlist application is required.',
    contact: null,
    source_url: 'https://www.seattlefreshbucks.org/',
    application_instructions: 'Apply on the official Fresh Bucks site. Benefits are used at participating stores, not at one office.',
    last_verified: '2026-10-18',
    wheelchair_accessible: null,
    serves_children_or_families: null,
    appointment_required: null,
    walk_in: null,
    latitude: null,
    longitude: null,
    published: true,
  },
  {
    id: 'curated-marys-place-blanchard',
    name: "Mary's Place Family Shelter",
    description: 'Emergency housing and shelter for families and pregnant women. Confirm current intake steps before traveling.',
    category: 'Housing and shelter',
    cost: 'Free',
    address: '720 Blanchard St',
    city: 'Seattle',
    service_area: 'King County',
    zip_codes: null,
    eligibility: 'Families and pregnant women. Confirm current intake rules with Mary\'s Place.',
    contact: '206-245-1026',
    source_url: 'https://www.marysplaceseattle.org/get-help',
    application_instructions: 'Call 206-245-1026 for family shelter intake. Confirm this site is still in use before traveling.',
    last_verified: '2026-10-18',
    wheelchair_accessible: null,
    serves_children_or_families: true,
    appointment_required: null,
    walk_in: null,
    latitude: 47.617058,
    longitude: -122.3397722,
    published: true,
  },
  {
    id: 'curated-marys-place-allen-family-center',
    name: "Mary's Place Allen Family Center",
    description: 'Drop-in family resource center with basic needs, housing navigation, and family support in South Seattle.',
    category: 'Housing and shelter',
    cost: 'Free',
    address: '3190 S Martin Luther King Jr Way',
    city: 'Seattle',
    service_area: 'South Seattle',
    zip_codes: null,
    eligibility: 'Families with children. Confirm hours and current services before traveling.',
    contact: '206-584-2832',
    source_url: 'https://www.marysplaceseattle.org/get-help/family-resource-center',
    application_instructions: 'Open Monday–Friday. Call 206-584-2832 or email afc@marysplaceseattle.org for schedules.',
    last_verified: '2026-10-18',
    wheelchair_accessible: null,
    serves_children_or_families: true,
    appointment_required: false,
    walk_in: true,
    latitude: 47.5752369,
    longitude: -122.2968031,
    published: true,
  },
  {
    id: 'curated-roots-young-adult-shelter',
    name: 'ROOTS Young Adult Shelter',
    description: 'Overnight shelter for young adults, with meals and support services. Accommodates up to 45 people a night.',
    category: 'Housing and shelter',
    cost: 'Free',
    address: '207 10th Ave E',
    city: 'Seattle',
    service_area: 'King County',
    zip_codes: null,
    eligibility: 'Young adults ages 18–25. No proof of ID or income is required to stay.',
    contact: '206-632-1635',
    source_url: 'https://rootsinfo.org/',
    application_instructions: 'Call (206) 632-1635 or come to the door in the evening to ask to be placed on that night\'s list. Confirm hours on the official site.',
    last_verified: '2026-10-18',
    wheelchair_accessible: null,
    serves_children_or_families: null,
    appointment_required: false,
    walk_in: true,
    latitude: 47.6201783,
    longitude: -122.3198459,
    published: true,
  },
  {
    id: 'curated-muslim-housing-services',
    name: 'Muslim Housing Services',
    description: 'Homelessness prevention and rapid re-housing, including rent assistance, for low-income and homeless families.',
    category: 'Housing and shelter',
    cost: null,
    address: '7928 Rainier Ave S',
    city: 'Seattle',
    service_area: 'Seattle and King County',
    zip_codes: null,
    eligibility: 'Low-income and homeless families. Confirm current program rules with the provider.',
    contact: '206-723-1712',
    source_url: 'https://www.muslimhousing.org/',
    application_instructions: 'Call 206-723-1712. Confirm whether you need an appointment before visiting the office.',
    last_verified: '2026-10-18',
    wheelchair_accessible: null,
    serves_children_or_families: true,
    appointment_required: null,
    walk_in: null,
    latitude: 47.5311753,
    longitude: -122.2698707,
    published: true,
  },
  {
    id: 'curated-ucef',
    name: 'United Churches Emergency Fund',
    description: 'Emergency rent, utility, and deposit assistance for households in named North Seattle ZIP codes.',
    category: 'Financial assistance',
    cost: null,
    address: '4515 16th Ave NE',
    city: 'Seattle',
    service_area: 'North Seattle',
    zip_codes: ['98103', '98105', '98115', '98125'],
    eligibility: 'Households living in ZIP codes 98103, 98105, 98115, or 98125. Assistance is limited and is typically once per household.',
    contact: 'director@ucef-seattle.org or 206-524-7885',
    source_url: 'https://www.ucef-seattle.org/',
    application_instructions: 'UCEF handles requests by email. Do not assume a drop-in visit is available. Email director@ucef-seattle.org or call 206-524-7885.',
    last_verified: '2026-10-18',
    wheelchair_accessible: null,
    serves_children_or_families: null,
    appointment_required: null,
    walk_in: false,
    latitude: 47.6618095,
    longitude: -122.311218,
    published: true,
  },
  {
    id: 'curated-seattle-utility-discount',
    name: 'Seattle Utility Discount Program',
    description: 'City of Seattle application for the Utility Discount Program, Seattle Public Utilities and Seattle City Light bill assistance, and City Light Project Share.',
    category: 'Utilities',
    cost: null,
    address: null,
    city: 'Seattle',
    service_area: 'Seattle',
    zip_codes: null,
    eligibility: 'Confirm current income and account rules on the official application site.',
    contact: null,
    source_url: 'https://utilityassistance.seattle.gov/uap/public/landing',
    application_instructions: 'Apply online. This is a citywide program, not one street address.',
    last_verified: '2026-10-18',
    wheelchair_accessible: null,
    serves_children_or_families: null,
    appointment_required: null,
    walk_in: null,
    latitude: null,
    longitude: null,
    published: true,
  },
  {
    id: 'curated-west-seattle-food-bank',
    name: 'West Seattle Food Bank',
    description: 'Grocery distribution, home delivery, and other basic-needs support from the West Seattle Food Bank.',
    category: 'Food assistance',
    cost: 'Free',
    address: '3419 SW Morgan St',
    city: 'Seattle',
    service_area: 'West Seattle',
    zip_codes: null,
    eligibility: 'Confirm current distribution rules and hours on the official site.',
    contact: '206-932-9023',
    source_url: 'https://westseattlefoodbank.org/',
    application_instructions: 'No appointment is needed for grocery distribution. Confirm hours before traveling. Call 206-932-9023 for home delivery and other requests.',
    last_verified: '2026-10-18',
    wheelchair_accessible: null,
    serves_children_or_families: null,
    appointment_required: false,
    walk_in: true,
    latitude: 47.5443163,
    longitude: -122.375864,
    published: true,
  },
]

export function curatedPublishedRows(opts: DirectoryOpts = {}): CuratedResourceRow[] {
  const { categories, limit = 50 } = opts
  const allowed = categories && categories.length > 0 ? new Set(categories) : null
  const rows = allowed
    ? CURATED_PUBLISHED_RESOURCES.filter((row) => allowed.has(row.category))
    : CURATED_PUBLISHED_RESOURCES
  return rows.slice(0, limit)
}

/**
 * The live directory stores the street address on the organization, and the
 * resource row often has neither an address nor coordinates. Use the
 * organization address, then a known street pin for the same official page.
 */
export function locationForPublishedRow(row: unknown, organization?: unknown): unknown {
  const record = asRecord(row)
  if (!record) return row
  if (readCoordinatePair(record.latitude, record.longitude)) return record
  if (hasText(record.address)) return record

  const org = asRecord(organization)
  const orgAddress = text(org?.address)
  if (orgAddress) {
    const zip = text(org?.zip_code)
    const address = zip && !orgAddress.includes(zip) ? `${orgAddress}, ${zip}` : orgAddress
    const known = curatedByStreet(address)
    return {
      ...record,
      address,
      city: text(org?.city) || text(record.city) || null,
      latitude: known?.latitude ?? null,
      longitude: known?.longitude ?? null,
    }
  }

  const known = curatedBySource(text(record.source_url))
  if (!known || (known.latitude == null && !known.address)) return record
  return {
    ...record,
    address: known.address,
    city: known.city,
    latitude: known.latitude,
    longitude: known.longitude,
  }
}

function curatedByStreet(address: string): CuratedResourceRow | undefined {
  const key = streetKey(address)
  return CURATED_PUBLISHED_RESOURCES.find((row) => row.address && streetKey(row.address) === key && row.latitude != null)
}

function curatedBySource(source: string | null): CuratedResourceRow | undefined {
  if (!source) return undefined
  const key = sourceKey(source)
  return CURATED_PUBLISHED_RESOURCES.find((row) => sourceKey(row.source_url) === key && (row.latitude != null || row.address))
}

function streetKey(address: string): string {
  return address
    .toLowerCase()
    .replace(/\b\d{5}(?:-\d{4})?\b/g, ' ')
    .replace(/\./g, '')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\bstreet\b/g, 'st')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sourceKey(value: string): string {
  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, '')
    const path = url.pathname.replace(/\/$/, '')
    return `${host}${path}`.toLowerCase()
  } catch {
    return value.trim().toLowerCase().replace(/\/$/, '')
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) return value as Record<string, unknown>
  return null
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function hasText(value: unknown): boolean {
  return text(value) != null
}

export function isPlaceholderDirectory(rows: unknown[]): boolean {
  if (!Array.isArray(rows) || rows.length === 0) return true
  return rows.every((row) => {
    if (typeof row !== 'object' || row === null) return true
    const record = row as Record<string, unknown>
    const source = typeof record.source_url === 'string' ? record.source_url.toLowerCase() : ''
    const address = typeof record.address === 'string' ? record.address.toLowerCase() : ''
    return source.includes('example.org') || address.includes('example st') || address.includes('shelter ave')
  })
}
