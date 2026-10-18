import type { NextApiRequest, NextApiResponse } from 'next'
import { getPublishedResources } from '../../lib/db'
import { resolveResourceMap } from '../../lib/geocode'
import type { ResourceMapView } from '../../lib/geo'
import {
  RESULT_DISCLAIMER,
  buildActionPlan,
  candidateCategories,
  matchResources,
  parseMatchRequest,
  resourceFromRow,
  type Resource,
} from '../../lib/matching'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const parsed = parseMatchRequest(req.body)
  if (!parsed.ok) {
    return res.status(400).json({
      error: parsed.error,
      details: parsed.details,
      categories: parsed.categories,
    })
  }

  try {
    // Fetch by category only. City and ZIP limits are applied in matchResources
    // so a ZIP is never compared to the city column with a text search.
    const rows = await getPublishedResources({
      categories: candidateCategories(parsed.request.categories),
      limit: 100,
    })
    const resources = (Array.isArray(rows) ? rows : [])
      .map(resourceFromRow)
      .filter((resource): resource is Resource => resource !== null)
    const matches = matchResources(resources, parsed.request)
    let map: ResourceMapView = { center: null, places: [], unmapped_count: matches.length }
    try {
      map = await resolveResourceMap(matches.map((match) => match.resource), parsed.request)
    } catch (mapError) {
      console.error('resource map failed', mapError instanceof Error ? mapError.message : 'unknown error')
    }

    return res.status(200).json({
      count: matches.length,
      matches,
      map,
      dataSource: 'supabase',
      disclaimer: RESULT_DISCLAIMER,
      action_plan: buildActionPlan(parsed.request),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'Supabase is not configured') {
      return res.status(503).json({ error: 'The resource directory is not connected yet.' })
    }
    console.error('match handler failed', message)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
