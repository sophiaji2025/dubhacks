import type { NextApiRequest, NextApiResponse } from 'next'
import { parseCategoryList } from '../../lib/categories'
import { getPublishedResources } from '../../lib/db'
import { parseLocationQuery, resourceFromRow, resourceMatchesLocation } from '../../lib/matching'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const { category, location } = req.query
  const parsed = parseCategoryList(category ? (Array.isArray(category) ? category : [String(category)]) : undefined)
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, categories: parsed.categories })

  const locationText = location ? String(location) : ''
  const parsedLocation = locationText ? parseLocationQuery(locationText) : null
  if (parsedLocation && !parsedLocation.ok) return res.status(400).json({ error: parsedLocation.error })

  try {
    const rows = await getPublishedResources({ categories: parsed.categories, limit: 100 })
    const data = parsedLocation && parsedLocation.ok
      ? rows.filter((row) => {
          const resource = resourceFromRow(row)
          return resource ? resourceMatchesLocation(resource, parsedLocation) : false
        })
      : rows
    res.status(200).json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    console.error('resources handler failed', message)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
