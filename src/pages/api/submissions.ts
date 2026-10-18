import type { NextApiRequest, NextApiResponse } from 'next'
import { createSubmission } from '../../lib/db'
import { parseSubmission } from '../../lib/submission'

const WINDOW_MS = 60_000
const LIMIT = 10
const hits = new Map<string, number[]>()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (rateLimited(clientAddress(req))) {
    return res.status(429).json({ error: 'Too many submissions. Try again in a minute.' })
  }

  const parsed = parseSubmission(req.body)
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, details: parsed.details })

  try {
    const submission = await createSubmission(parsed.submission)
    res.status(201).json({
      message: 'Submission received. It is pending review and will not appear in search until an administrator approves it.',
      id: submission.id,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'Supabase is not configured') {
      return res.status(503).json({ error: 'The resource directory is not connected yet.' })
    }
    console.error('create submission failed', message)
    return res.status(500).json({ error: 'Failed to create submission' })
  }
}

function clientAddress(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim()
  if (Array.isArray(forwarded) && forwarded[0]) return forwarded[0]
  return req.socket.remoteAddress || 'unknown'
}

function rateLimited(address: string): boolean {
  const now = Date.now()
  const recent = (hits.get(address) ?? []).filter((time) => now - time < WINDOW_MS)
  if (recent.length >= LIMIT) {
    hits.set(address, recent)
    return true
  }
  recent.push(now)
  hits.set(address, recent)
  return false
}
