import type { NextApiRequest, NextApiResponse } from 'next'

// GET /api/admin/submissions - list pending submissions
// PATCH /api/admin/submissions/:id - approve/reject
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // TODO: require admin auth
    const pending = [
      { id: 1, organization: 'Example Org', program: 'Meal Program', status: 'pending' }
    ]
    return res.status(200).json({ data: pending })
  }

  if (req.method === 'PATCH') {
    // TODO: require admin auth and update submission status
    return res.status(200).json({ message: 'Updated (stub)' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
