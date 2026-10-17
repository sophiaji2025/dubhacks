import type { NextApiRequest, NextApiResponse } from 'next'
import { parseCategoryList } from '../../lib/categories'
import { getPublishedResources } from '../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { categories, location } = req.body ?? {}
  const parsed = parseCategoryList(categories)
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, categories: parsed.categories })

  // Basic matching using published resources in the DB
  const resources = await getPublishedResources({ categories: parsed.categories, city: location, limit: 50 })

  // Simple relevance: prioritize resources that match category and city
  const matches = (resources as any[]).slice(0, 10).map(r => ({
    id: r.id,
    name: r.name,
    category: r.category,
    description: r.description,
    cost: r.cost,
    address: r.address,
    eligibility: r.eligibility,
    contact: r.contact,
    source_url: r.source_url,
    last_verified: r.last_verified,
    explanation: `Matches because it is listed as ${r.category}${r.city ? ' in ' + r.city : ''}.`
  }))

  const action_plan = [
    'Review the top matching resources.',
    'Confirm hours and eligibility on the provider website.',
    'Contact the provider before visiting.'
  ]

  res.status(200).json({ matches, action_plan })
}
