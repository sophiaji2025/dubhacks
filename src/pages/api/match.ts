import type { NextApiRequest, NextApiResponse } from 'next'

type Body = {
  categories?: string[]
  location?: string
  text?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body: Body = req.body
  // TODO: integrate with Supabase and an LLM for need extraction & ranking.
  // For now return a mocked response structure following the SPEC.

  const mock = {
    matches: [
      {
        id: 1,
        name: 'Community Food Bank',
        category: 'Food assistance',
        description: 'Groceries and prepared meals. Walk-ins welcome.',
        cost: 'Free',
        address: '123 Example St, Seattle, WA',
        eligibility: 'Open to all residents',
        contact: '(206) 555-0101',
        source_url: 'https://example.org/foodbank',
        last_verified: '2026-10-01',
        explanation: 'Matches because you selected Food and groceries and location Seattle.'
      }
    ],
    action_plan: [
      'Review the top matching food assistance options.',
      "Call the provider to confirm hours and eligibility.",
      'Bring ID or documentation if required.'
    ]
  }

  return res.status(200).json(mock)
}
