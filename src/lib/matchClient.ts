import type { RankedMatch } from './matching'

export type SearchPayload = {
  categories: string[]
  location: string
  text: string
  freeOnly: boolean
  transportation?: string
}

export type MatchSuccess = {
  count: number
  matches: RankedMatch[]
  dataSource?: string
  disclaimer?: string
  action_plan?: string[]
  notice?: string
}

export async function requestMatches(payload: SearchPayload): Promise<MatchSuccess> {
  const response = await fetch('/api/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({})) as MatchSuccess & {
    error?: string
    details?: string[]
  }

  if (!response.ok) {
    const extra = data.details?.length ? ` ${data.details.join(' ')}` : ''
    throw new Error((data.error || 'Search failed.') + extra)
  }

  return data
}
