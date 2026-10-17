import type { NextApiRequest, NextApiResponse } from 'next'

// POST /api/submissions - create a pending resource submission
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const submission = req.body
  // TODO: insert into Supabase 'resource_submissions' table with status 'pending'
  // Return a minimal acknowledgement
  res.status(201).json({ message: 'Submission received', submission })
}
