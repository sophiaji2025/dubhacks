import type { NextApiRequest, NextApiResponse } from 'next'
import { getPublishedResources } from '../../lib/db'
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
    const rows = await getPublishedResources({
      categories: candidateCategories(parsed.request.categories),
      limit: 100,
    })
    const resources = (Array.isArray(rows) ? rows : [])
      .map(resourceFromRow)
      .filter((resource): resource is Resource => resource !== null)
    const matches = matchResources(resources, parsed.request)

    return res.status(200).json({
      count: matches.length,
      matches,
      dataSource: 'supabase',
      disclaimer: RESULT_DISCLAIMER,
      action_plan: buildActionPlan(parsed.request),
    })
  } catch (error) {
    console.error('match handler failed', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
