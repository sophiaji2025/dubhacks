import type { ResourceMapView } from './geo'
import type { GroundedPlan } from './groundedPlan'
import type { RankedMatch } from './matching'

export type SearchPayload = {
  categories: string[]
  location: string
  text: string
  freeOnly: boolean
  transportation?: string
  childrenOrFamily?: boolean
  asSoonAsPossible?: boolean
  noAppointment?: boolean
  language?: string
}

export type MatchSuccess = {
  count: number
  matches: RankedMatch[]
  map?: ResourceMapView | null
  dataSource?: string
  disclaimer?: string
  action_plan?: string[]
  grounded_plan?: GroundedPlan | null
  notice?: string
}

export function readGroundedPlan(value: unknown): GroundedPlan | null {
  if (!value || typeof value !== 'object') return null
  const record = value as { source?: unknown; steps?: unknown; call_lines?: unknown }
  if (record.source !== 'grok' || !Array.isArray(record.steps) || !Array.isArray(record.call_lines)) return null
  const steps = record.steps.filter((step): step is string => typeof step === 'string' && step.trim().length > 0)
  const call_lines = record.call_lines.flatMap((line) => {
    if (!line || typeof line !== 'object') return []
    const item = line as { resource_id?: unknown; name?: unknown; line?: unknown }
    if (typeof item.resource_id !== 'string' || typeof item.name !== 'string' || typeof item.line !== 'string') return []
    const text = item.line.trim()
    if (!text) return []
    return [{ resource_id: item.resource_id, name: item.name, line: text }]
  })
  if (steps.length === 0 || call_lines.length === 0) return null
  return { source: 'grok', steps, call_lines }
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
    grounded_plan?: unknown
  }

  if (!response.ok) {
    const extra = data.details?.length ? ` ${data.details.join(' ')}` : ''
    if (response.status === 500) {
      throw new Error((data.error || 'Search could not load published resources.') + extra + ' If this keeps happening, the database may not be connected.')
    }
    throw new Error((data.error || 'Search failed.') + extra)
  }

  return {
    ...data,
    grounded_plan: readGroundedPlan(data.grounded_plan),
  }
}
