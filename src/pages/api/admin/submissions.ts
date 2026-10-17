import type { NextApiRequest, NextApiResponse } from 'next'
import { listPendingSubmissions, SubmissionReviewError, updateSubmissionStatus } from '../../../lib/db'

const NOTE_LIMIT = 2000

function requireAdmin(req: NextApiRequest) {
  const adminKey = process.env.ADMIN_API_KEY
  const provided = req.headers['x-admin-key']
  return Boolean(adminKey) && provided === adminKey
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized - missing or invalid admin key' })

  if (req.method === 'GET') {
    try {
      const pending = await listPendingSubmissions()
      return res.status(200).json({ data: pending })
    } catch (err) {
      return reviewError(res, err, 'Could not load submissions.')
    }
  }

  if (req.method === 'PATCH') {
    const body = req.body ?? {}
    const id = typeof body.id === 'string' ? body.id.trim() : ''
    const action = body.action
    const notes = body.reviewer_notes
    if (!id || (action !== 'approve' && action !== 'reject')) {
      return res.status(400).json({ error: 'id and action are required' })
    }
    if (notes != null && typeof notes !== 'string') {
      return res.status(400).json({ error: 'reviewer_notes must be a string' })
    }
    if (typeof notes === 'string' && notes.trim().length > NOTE_LIMIT) {
      return res.status(400).json({ error: `Review notes must be at most ${NOTE_LIMIT} characters.` })
    }

    try {
      const out = await updateSubmissionStatus(id, action === 'approve' ? 'approved' : 'rejected', notes)
      const message = action === 'approve'
        ? 'Submission approved. The listing can appear in search.'
        : 'Submission rejected. It will not appear in search.'
      return res.status(200).json({ message, ...out })
    } catch (err) {
      return reviewError(res, err, 'Failed to update submission')
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

function reviewError(res: NextApiResponse, err: unknown, fallback: string) {
  if (err instanceof SubmissionReviewError) {
    return res.status(err.statusCode).json({ error: err.message })
  }
  const message = err instanceof Error ? err.message : ''
  if (message === 'Supabase is not configured' || message === 'Supabase admin is not configured') {
    return res.status(503).json({ error: 'The admin database key is not configured.' })
  }
  console.error('admin submission failed', message)
  return res.status(500).json({ error: fallback })
}
