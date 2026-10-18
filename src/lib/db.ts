import { isResourceCategory } from './categories'
import { readCoordinatePair } from './geo'
import { curatedPublishedRows, isPlaceholderDirectory } from './publishedDirectory'
import type { ResourceSubmission } from './submission'
import { getSupabase, getSupabaseAdmin } from './supabase'

export type PublishedSource = 'supabase' | 'curated'

export class SubmissionReviewError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message)
    this.name = 'SubmissionReviewError'
  }
}

type GetResourcesOpts = {
  categories?: string[]
  limit?: number
}

// The live project hides rows from the publishable key. Server routes use the
// service role when it is configured, and still only return published listings.
function directoryClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (key) return getSupabaseAdmin()
  return getSupabase()
}

// Location is not applied here. A ZIP or service-area list has to be compared
// in the matcher; a city ilike on the raw search text drops ZIP searches.
export async function getPublishedResources(opts: GetResourcesOpts = {}) {
  const loaded = await loadPublishedResources(opts)
  return loaded.rows
}

export async function loadPublishedResources(opts: GetResourcesOpts = {}): Promise<{
  rows: unknown[]
  source: PublishedSource
}> {
  try {
    const rows = await queryPublishedResources(opts)
    if (!isPlaceholderDirectory(rows)) return { rows, source: 'supabase' }
    return { rows: curatedPublishedRows(opts), source: 'curated' }
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'Supabase is not configured' || message === 'Could not read published resources') {
      return { rows: curatedPublishedRows(opts), source: 'curated' }
    }
    throw error
  }
}

async function queryPublishedResources(opts: GetResourcesOpts): Promise<unknown[]> {
  const { categories, limit = 50 } = opts
  let q = directoryClient().from('resources').select('*').eq('published', true).limit(limit)

  if (categories && categories.length) {
    q = (q as any).in('category', categories)
  }

  const { data, error } = await q
  if (error) {
    console.error('getPublishedResources error', error.message)
    throw new Error('Could not read published resources')
  }
  return data || []
}

export async function createSubmission(payload: ResourceSubmission) {
  const { data, error } = await directoryClient().from('resource_submissions').insert([{
    organization_name: payload.organization_name,
    resource_name: payload.resource_name,
    payload,
    status: 'pending'
  }]).select().single()

  if (error) {
    console.error('createSubmission error', error.message)
    throw error
  }
  return data
}

export async function listPendingSubmissions() {
  const { data, error } = await getSupabaseAdmin()
    .from('resource_submissions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('listPendingSubmissions error', error.message)
    throw new Error('Could not read submissions')
  }
  return data || []
}

export async function updateSubmissionStatus(id: string, status: 'approved' | 'rejected', reviewer_notes?: string) {
  const admin = getSupabaseAdmin()
  const { data: existing, error: readError } = await admin
    .from('resource_submissions')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (readError) {
    console.error('read submission error', readError.message)
    throw new Error('Could not read the submission')
  }
  if (!existing) throw new SubmissionReviewError('Submission not found.', 404)
  if (existing.status !== 'pending') {
    throw new SubmissionReviewError('This submission is no longer pending.', 409)
  }

  const notes = reviewer_notes?.trim() ? reviewer_notes.trim() : null
  let publishedResource: unknown = null

  if (status === 'approved') {
    publishedResource = await publishSubmission(existing)
  }

  const { data: updated, error: updateError } = await admin
    .from('resource_submissions')
    .update({ status, reviewer_notes: notes })
    .eq('id', id)
    .eq('status', 'pending')
    .select()
    .single()
  if (updateError) {
    console.error('updateSubmissionStatus error', updateError.message)
    throw new Error('Could not update the submission')
  }

  return status === 'approved'
    ? { submission: updated, published_resource: publishedResource }
    : { submission: updated }
}

async function publishSubmission(submission: { organization_name?: string | null; resource_name?: string | null; payload?: any }) {
  const admin = getSupabaseAdmin()
  const payload = submission.payload || {}
  const orgName = optionalText(submission.organization_name, payload.organization_name, payload.organizationName)
  let orgId: string | null = null

  if (orgName) {
    const { data: orgs, error: orgError } = await admin.from('organizations').select('id').eq('name', orgName).limit(1)
    if (orgError) {
      console.error('organization lookup error', orgError.message)
      throw new Error('Could not publish the submission')
    }
    if (orgs && orgs.length) {
      orgId = orgs[0].id
    } else {
      const { data: newOrg, error: insertOrgError } = await admin.from('organizations').insert([{
        name: orgName,
        website: optionalText(payload.website, payload.source_url),
        contact: optionalText(payload.contact),
        verified: false,
      }]).select().single()
      if (insertOrgError) {
        console.error('organization insert error', insertOrgError.message)
        throw new Error('Could not publish the submission')
      }
      orgId = newOrg?.id || null
    }
  }

  const category = readStoredCategory(payload)
  if (!category || !isResourceCategory(category)) {
    throw new SubmissionReviewError('This submission has no valid category to publish.', 400)
  }

  const coordinates = readCoordinatePair(
    payload.latitude ?? payload.lat ?? payload.resource?.latitude ?? payload.resource?.lat,
    payload.longitude ?? payload.lng ?? payload.lon ?? payload.resource?.longitude ?? payload.resource?.lng ?? payload.resource?.lon,
  )

  const resourceRow = {
    organization_id: orgId,
    name: optionalText(submission.resource_name, payload.resource_name, payload.resource?.name) || 'Unnamed resource',
    description: optionalText(payload.description, payload.resource?.description),
    category,
    cost: optionalText(payload.cost, payload.resource?.cost),
    address: optionalText(payload.address, payload.resource?.address),
    city: optionalText(payload.city, payload.resource?.city),
    eligibility: optionalText(payload.eligibility, payload.resource?.eligibility),
    contact: optionalText(payload.contact, payload.resource?.contact),
    source_url: optionalText(payload.source_url, payload.resource?.source_url),
    service_area: optionalText(payload.service_area, payload.serviceArea, payload.resource?.service_area, payload.resource?.serviceArea),
    zip_codes: optionalZipCodes(payload.zip_codes ?? payload.zipCodes ?? payload.resource?.zip_codes ?? payload.resource?.zipCodes),
    application_instructions: optionalText(payload.application_instructions, payload.applicationInstructions, payload.resource?.application_instructions, payload.resource?.applicationInstructions),
    wheelchair_accessible: optionalBoolean(payload.wheelchair_accessible, payload.wheelchairAccessible, payload.resource?.wheelchair_accessible, payload.resource?.wheelchairAccessible),
    serves_children_or_families: optionalBoolean(payload.serves_children_or_families, payload.servesChildrenOrFamilies, payload.resource?.serves_children_or_families, payload.resource?.servesChildrenOrFamilies),
    appointment_required: optionalBoolean(payload.appointment_required, payload.appointmentRequired, payload.resource?.appointment_required, payload.resource?.appointmentRequired),
    walk_in: optionalBoolean(payload.walk_in, payload.walkIn, payload.resource?.walk_in, payload.resource?.walkIn),
    latitude: coordinates?.latitude ?? null,
    longitude: coordinates?.longitude ?? null,
    last_verified: optionalText(payload.last_verified),
    published: true,
  }

  const { data: newRes, error: insertError } = await admin.from('resources').insert([resourceRow]).select().single()
  if (insertError) {
    console.error('publish resource error', insertError.message)
    throw new Error('Could not publish the submission')
  }
  return newRes
}

function optionalText(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function optionalBoolean(...values: unknown[]): boolean | null {
  for (const value of values) {
    if (typeof value === 'boolean') return value
    if (value === 'true') return true
    if (value === 'false') return false
  }
  return null
}

function optionalZipCodes(value: unknown): string[] | null {
  const tokens: string[] = []
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string' || typeof item === 'number') tokens.push(String(item))
    }
  } else if (typeof value === 'string') {
    tokens.push(...value.split(/[^0-9]+/))
  } else {
    return null
  }
  const zips = [...new Set(tokens.map((token) => token.trim()).filter((token) => /^\d{5}$/.test(token)))]
  return zips.length > 0 ? zips : null
}

function readStoredCategory(payload: any): string | null {
  const singular = [payload.category, payload.resource?.category]
  for (const candidate of singular) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate
  }

  const lists = [payload.categories, payload.resource?.categories]
  for (const list of lists) {
    if (Array.isArray(list)) {
      const first = list.find((item) => typeof item === 'string' && item.trim())
      if (typeof first === 'string') return first
    }
  }

  return null
}
