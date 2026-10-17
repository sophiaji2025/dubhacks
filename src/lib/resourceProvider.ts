import { getPublishedResources } from './db'
import type { Resource } from './matching'

export type ResourceDataSource = 'supabase' | 'development-stub'

export type ResourceLoadResult = {
  resources: Resource[]
  source: ResourceDataSource
}

/**
 * Development stub. Returns no catalog rows and must not be treated as a
 * live directory. The teammate-owned database schema is unchanged here.
 */
export const DEVELOPMENT_STUB_NOTICE =
  'Database credentials are not configured. The development stub returned no resources and is not production-ready.'

function readOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  return Boolean(url && key && /^https?:\/\//.test(url))
}

export function mapRowToResource(row: unknown): Resource | null {
  if (typeof row !== 'object' || row === null) return null
  const record = row as Record<string, unknown>
  if (typeof record.id !== 'string' || !record.id.trim()) return null
  if (typeof record.name !== 'string' || !record.name.trim()) return null

  return {
    id: record.id,
    name: record.name.trim(),
    description: readOptionalString(record.description),
    category: readOptionalString(record.category),
    cost: readOptionalString(record.cost),
    address: readOptionalString(record.address),
    city: readOptionalString(record.city),
    eligibility: readOptionalString(record.eligibility),
    contact: readOptionalString(record.contact),
    source_url: readOptionalString(record.source_url),
    last_verified: readOptionalString(record.last_verified),
    published: record.published === true,
  }
}

export async function loadPublishedResources(): Promise<ResourceLoadResult> {
  if (!isSupabaseConfigured()) {
    return { resources: [], source: 'development-stub' }
  }

  // Uses the existing helper. This path is not claimed to be verified
  // against a live Supabase project in this change.
  const rows = await getPublishedResources({ limit: 100 })
  const resources = (Array.isArray(rows) ? rows : [])
    .map(mapRowToResource)
    .filter((resource): resource is Resource => resource !== null && resource.published === true)

  return { resources, source: 'supabase' }
}
