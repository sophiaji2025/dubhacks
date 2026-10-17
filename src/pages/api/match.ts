import type { NextApiRequest, NextApiResponse } from 'next'
import { buildActionPlan, matchResources, RESULT_DISCLAIMER } from '../../lib/matching'
import { parseMatchRequest } from '../../lib/matchRequest'
import { DEVELOPMENT_STUB_NOTICE, loadPublishedResources } from '../../lib/resourceProvider'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const parsed = parseMatchRequest(req.body)
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.error, details: parsed.details })
  }

  try {
    const { resources, source } = await loadPublishedResources()
    const matches = matchResources(resources, parsed.request)

    return res.status(200).json({
      count: matches.length,
      matches,
      dataSource: source,
      disclaimer: RESULT_DISCLAIMER,
      action_plan: buildActionPlan(parsed.request),
      ...(source === 'development-stub' ? { notice: DEVELOPMENT_STUB_NOTICE } : {}),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    console.error('match handler failed', { message })
    return res.status(500).json({ error: 'Internal server error' })
  }
}
