import type { NextApiRequest, NextApiResponse } from 'next'
import { listPendingSubmissions, updateSubmissionStatus } from '../../../lib/db'

function requireAdmin(req: NextApiRequest) {
  const adminKey = process.env.ADMIN_API_KEY
  const provided = req.headers['x-admin-key']
  return adminKey && provided === adminKey
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized - missing or invalid admin key' })

  if (req.method === 'GET') {
    const pending = await listPendingSubmissions()
    return res.status(200).json({ data: pending })
  }

  if (req.method === 'PATCH') {
    const { id, action, reviewer_notes } = req.body
    if (!id || !action) return res.status(400).json({ error: 'id and action are required' })

    try {
      if (action === 'approve') {
        const out = await updateSubmissionStatus(id, 'approved', reviewer_notes)
        return res.status(200).json({ message: 'Submission approved', ...out })
      } else if (action === 'reject') {
        const out = await updateSubmissionStatus(id, 'rejected', reviewer_notes)
        return res.status(200).json({ message: 'Submission rejected', ...out })
      }

      return res.status(400).json({ error: 'Unknown action' })
    } catch (err) {
      console.error(err)
      return res.status(500).json({ error: 'Failed to update submission' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
