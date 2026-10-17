import { categoryValuesFromSubmission, parseCategoryList, type ResourceCategory } from './categories'

const NAME_LIMIT = 200
const DESCRIPTION_LIMIT = 4000
const COST_LIMIT = 200
const LOCATION_LIMIT = 200
const CONTACT_LIMIT = 300
const URL_LIMIT = 500
const LONG_TEXT_LIMIT = 2000
const EMAIL_LIMIT = 200

export type ResourceSubmission = {
  organization_name: string
  resource_name: string
  description: string
  category: ResourceCategory
  categories: ResourceCategory[]
  cost: string
  city: string | null
  service_area: string | null
  zip_codes: string[] | null
  address: string | null
  eligibility: string | null
  contact: string
  source_url: string
  application_instructions: string | null
  submitter_email: string | null
}

export type SubmissionParseResult =
  | { ok: true; submission: ResourceSubmission }
  | { ok: false; error: string; details: string[] }

export function parseSubmission(body: unknown): SubmissionParseResult {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, error: 'Request body must be a JSON object.', details: ['Request body must be a JSON object.'] }
  }

  const record = body as Record<string, unknown>
  const details: string[] = []

  const organizationName = requiredText(record, ['organization_name', 'organizationName'], 'Organization name', NAME_LIMIT, details)
  const resourceName = requiredText(record, ['resource_name', 'resourceName'], 'Program name', NAME_LIMIT, details)
  const description = requiredText(record, ['description'], 'Description', DESCRIPTION_LIMIT, details)
  const cost = requiredText(record, ['cost'], 'Cost', COST_LIMIT, details)
  const contact = requiredText(record, ['contact'], 'Contact information', CONTACT_LIMIT, details)
  const sourceUrl = requiredUrl(record, details)

  const categories = requiredCategories(record, details)
  const city = optionalText(record, ['city'], 'City', LOCATION_LIMIT, details)
  const serviceArea = optionalText(record, ['service_area', 'serviceArea'], 'Service area', LOCATION_LIMIT, details)
  const address = optionalText(record, ['address'], 'Address', LOCATION_LIMIT, details)
  const eligibility = optionalText(record, ['eligibility'], 'Eligibility', LONG_TEXT_LIMIT, details)
  const applicationInstructions = optionalText(
    record,
    ['application_instructions', 'applicationInstructions'],
    'Application instructions',
    LONG_TEXT_LIMIT,
    details,
  )
  const submitterEmail = optionalEmail(record, details)
  const zipCodes = optionalZipCodes(record, details)

  if (!city && !serviceArea && !(zipCodes && zipCodes.length > 0)) {
    details.push('Enter a city, a service area, or at least one ZIP code.')
  }

  if (details.length > 0 || !organizationName || !resourceName || !description || !cost || !contact || !sourceUrl || !categories) {
    return {
      ok: false,
      error: 'Check the submission and try again.',
      details: details.length > 0 ? details : ['Check the submission and try again.'],
    }
  }

  return {
    ok: true,
    submission: {
      organization_name: organizationName,
      resource_name: resourceName,
      description,
      category: categories[0],
      categories,
      cost,
      city,
      service_area: serviceArea,
      zip_codes: zipCodes,
      address,
      eligibility,
      contact,
      source_url: sourceUrl,
      application_instructions: applicationInstructions,
      submitter_email: submitterEmail,
    },
  }
}

function requiredCategories(record: Record<string, unknown>, details: string[]): ResourceCategory[] | null {
  const parsed = parseCategoryList(categoryValuesFromSubmission(record))
  if (!parsed.ok) {
    const unknown = parsed.categories?.length ? `: ${parsed.categories.join(', ')}` : ''
    details.push(`${parsed.error}${unknown}`)
    return null
  }
  const categories: ResourceCategory[] = []
  for (const category of parsed.categories) {
    if (!categories.includes(category)) categories.push(category)
  }
  if (categories.length === 0) {
    details.push('Select at least one category.')
    return null
  }
  return categories
}

function requiredText(
  record: Record<string, unknown>,
  keys: string[],
  label: string,
  limit: number,
  details: string[],
): string | null {
  const value = readText(record, keys)
  if (!value) {
    details.push(`${label} is required.`)
    return null
  }
  if (value.length > limit) {
    details.push(`${label} must be at most ${limit} characters.`)
    return null
  }
  return value
}

function optionalText(
  record: Record<string, unknown>,
  keys: string[],
  label: string,
  limit: number,
  details: string[],
): string | null {
  const value = readText(record, keys)
  if (!value) return null
  if (value.length > limit) {
    details.push(`${label} must be at most ${limit} characters.`)
    return null
  }
  return value
}

function requiredUrl(record: Record<string, unknown>, details: string[]): string | null {
  const value = readText(record, ['source_url', 'sourceUrl'])
  if (!value) {
    details.push('Official source URL is required.')
    return null
  }
  if (value.length > URL_LIMIT || !isHttpUrl(value)) {
    details.push('Official source URL must be an http or https link.')
    return null
  }
  return value
}

function optionalEmail(record: Record<string, unknown>, details: string[]): string | null {
  const value = readText(record, ['submitter_email', 'submitterEmail'])
  if (!value) return null
  if (value.length > EMAIL_LIMIT || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    details.push('Submitter email must be an email address.')
    return null
  }
  return value
}

function optionalZipCodes(record: Record<string, unknown>, details: string[]): string[] | null {
  const raw = record.zip_codes ?? record.zipCodes
  if (raw == null || raw === '') return null

  const tokens: string[] = []
  if (typeof raw === 'string') tokens.push(...raw.split(/[\s,]+/))
  else if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item !== 'string' && typeof item !== 'number') {
        details.push('ZIP codes must be 5-digit strings.')
        return null
      }
      tokens.push(String(item))
    }
  } else {
    details.push('ZIP codes must be 5-digit strings.')
    return null
  }

  const zips: string[] = []
  for (const token of tokens.map((item) => item.trim()).filter(Boolean)) {
    if (!/^\d{5}$/.test(token)) {
      details.push(`ZIP code ${token} must be 5 digits.`)
      continue
    }
    if (!zips.includes(token)) zips.push(token)
  }
  return zips.length > 0 ? zips : null
}

function readText(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
