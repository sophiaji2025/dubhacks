import type { NextApiRequest, NextApiResponse } from 'next'
import { createSubmission } from '../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const submission = await createSubmission(req.body)
    res.status(201).json({ message: 'Submission received', submission })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create submission' })
  }
}
