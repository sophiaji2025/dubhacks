import { isResourceCategory } from './categories'
import { supabase, supabaseAdmin } from './supabase'

type GetResourcesOpts = {
  categories?: string[]
  city?: string
  limit?: number
}

export async function getPublishedResources(opts: GetResourcesOpts = {}) {
  const { categories, city, limit = 50 } = opts
  let q = supabase.from('resources').select('*').eq('published', true).limit(limit)

  if (categories && categories.length) {
    // Try an exact match on category (simple approach for MVP)
    q = (q as any).in('category', categories)
  }

  if (city) {
    q = (q as any).ilike('city', `%${city}%`)
  }

  const { data, error } = await q
  if (error) {
    console.error('getPublishedResources error', error)
    return []
  }
  return data || []
}

export async function createSubmission(payload: any) {
  const organization_name = payload.organization_name || payload.organizationName || null
  const resource_name = payload.resource_name || payload.resourceName || payload.resource?.name || null

  const { data, error } = await supabase.from('resource_submissions').insert([{
    organization_name,
    resource_name,
    payload,
    status: 'pending'
  }]).select().single()

  if (error) {
    console.error('createSubmission error', error)
    throw error
  }
  return data
}

export async function listPendingSubmissions() {
  const { data, error } = await supabase.from('resource_submissions').select('*').eq('status', 'pending').order('created_at', { ascending: false })
  if (error) {
    console.error('listPendingSubmissions error', error)
    return []
  }
  return data || []
}

export async function updateSubmissionStatus(id: string, status: 'approved' | 'rejected', reviewer_notes?: string) {
  // Update the submission status
  const { data: updated, error: updateError } = await supabase.from('resource_submissions').update({ status, reviewer_notes }).eq('id', id).select().single()
  if (updateError) {
    console.error('updateSubmissionStatus error', updateError)
    throw updateError
  }

  if (status === 'approved') {
    // Attempt to publish the resource into resources table.
    // We need to use the admin client if inserting verified/published rows that should be protected.
    const payload = updated.payload || {}

    // Try to create or find organization
    const orgName = updated.organization_name || payload.organization_name || payload.organizationName || null
    let orgId: string | null = null

    if (orgName) {
      // check if organization exists
      const { data: orgs } = await supabaseAdmin.from('organizations').select('id').eq('name', orgName).limit(1)
      if (orgs && orgs.length) {
        orgId = orgs[0].id
      } else {
        const { data: newOrg } = await supabaseAdmin.from('organizations').insert([{ name: orgName, website: payload.website || null, contact: payload.contact || null, verified: false }]).select().single()
        orgId = newOrg?.id || null
      }
    }

    // Insert resource
    const category = readStoredCategory(payload)
    if (category && !isResourceCategory(category)) {
      throw new Error(`Cannot publish resource with unknown category: ${category}`)
    }

    const resourceRow: any = {
      organization_id: orgId,
      name: updated.resource_name || payload.resource_name || payload.resource?.name || 'Unnamed resource',
      description: payload.description || payload.resource?.description || null,
      category,
      cost: payload.cost || payload.resource?.cost || null,
      address: payload.address || payload.resource?.address || null,
      city: payload.city || payload.resource?.city || null,
      eligibility: payload.eligibility || payload.resource?.eligibility || null,
      contact: payload.contact || payload.resource?.contact || null,
      source_url: payload.source_url || payload.resource?.source_url || null,
      last_verified: payload.last_verified || null,
      published: true
    }

    const { data: newRes, error: insertError } = await supabaseAdmin.from('resources').insert([resourceRow]).select().single()
    if (insertError) {
      console.error('publish resource error', insertError)
      throw insertError
    }

    return { submission: updated, published_resource: newRes }
  }

  return { submission: updated }
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
