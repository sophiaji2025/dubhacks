import type { NextApiRequest, NextApiResponse } from 'next'
import { parseCategoryList } from '../../lib/categories'
import { getPublishedResources } from '../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const { category, location } = req.query
  const parsed = parseCategoryList(category ? (Array.isArray(category) ? category : [String(category)]) : undefined)
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, categories: parsed.categories })

  const city = location ? String(location) : undefined
  const data = await getPublishedResources({ categories: parsed.categories, city, limit: 100 })
  res.status(200).json({ data })
}
