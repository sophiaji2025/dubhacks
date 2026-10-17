import type { NextApiRequest, NextApiResponse } from 'next'

// GET /api/resources?category=Food&location=Seattle
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  // TODO: query Supabase for published resources
  const sample = [
    { id: 1, name: 'Community Food Bank', category: 'Food assistance', city: 'Seattle' },
    { id: 2, name: 'Shelter Now', category: 'Housing and shelter', city: 'Seattle' }
  ]
  res.status(200).json({ data: sample })
}
