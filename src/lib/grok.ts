import type { LanguageCode } from './i18n'
import {
  acceptGroundedPlan,
  groundedPlanInput,
  groundedPlanInstructions,
  groundedPlanSchema,
  type GroundedPlan,
} from './groundedPlan'
import type { MatchCriteria, RankedMatch } from './matching'

const ENDPOINT = 'https://api.x.ai/v1/chat/completions'
const DEFAULT_MODEL = 'grok-4.7'
const DEFAULT_TIMEOUT_MS = 20_000

type GrokOptions = {
  fetchImpl?: typeof fetch
  timeoutMs?: number
  /** Pass null to force the missing-key path. Omit to read the server environment. */
  apiKey?: string | null
}

/**
 * Writes a plan from listings already chosen by the matcher.
 * Returns null when the key is missing, the call fails, or the reply
 * names a program that was not retrieved. The caller keeps the checklist.
 * The person note is not logged and is not included in the returned plan.
 */
export async function writeGroundedPlan(
  matches: RankedMatch[],
  criteria: MatchCriteria,
  language: LanguageCode,
  options: GrokOptions = {},
): Promise<GroundedPlan | null> {
  if (matches.length === 0) return null

  const key = options.apiKey === undefined
    ? (process.env.GROK_API_KEY || process.env.XAI_API_KEY || '')
    : (options.apiKey ?? '')
  if (!key) {
    console.error('grounded plan skipped: missing_key')
    return null
  }

  const fetchImpl = options.fetchImpl ?? fetch
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const started = Date.now()
  const remaining = () => Math.max(1_000, timeoutMs - (Date.now() - started))

  const messages = [
    { role: 'system', content: groundedPlanInstructions(language) },
    { role: 'user', content: groundedPlanInput(matches, criteria) },
  ]
  const responseFormat = {
    type: 'json_schema',
    json_schema: groundedPlanSchema(matches.length),
  }
  const model = process.env.GROK_MODEL || DEFAULT_MODEL

  let completion = await postChat({
    model,
    reasoning_effort: 'low',
    max_completion_tokens: 800,
    messages,
    response_format: responseFormat,
  }, key, fetchImpl, remaining())
  if (shouldRetryWithoutReasoning(completion)) {
    completion = await postChat({
      model,
      max_completion_tokens: 800,
      messages,
      response_format: responseFormat,
    }, key, fetchImpl, remaining())
  }

  if (!completion.ok) {
    console.error('grounded plan skipped', completion.reason)
    return null
  }

  const decision = acceptGroundedPlan(completion.json, matches, criteria)
  if (!decision.ok) {
    console.error('grounded plan skipped', decision.reason)
    return null
  }
  return decision.plan
}

type ChatResult = {
  ok: boolean
  status: number
  json: unknown
  reason: string
  detail: string
}

function shouldRetryWithoutReasoning(result: ChatResult): boolean {
  if (result.ok || (result.status !== 400 && result.status !== 410)) return false
  return !/api key/i.test(result.detail)
}

async function postChat(
  body: unknown,
  key: string,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<ChatResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        json: null,
        reason: `http_${response.status}`,
        detail: errorDetail(payload),
      }
    }
    const text = completionText(payload)
    if (!text) return { ok: false, status: response.status, json: null, reason: 'empty_completion', detail: '' }
    try {
      return { ok: true, status: response.status, json: parseModelJson(text), reason: 'ok', detail: '' }
    } catch {
      return { ok: false, status: response.status, json: null, reason: 'invalid_json', detail: '' }
    }
  } catch (error) {
    const reason = error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'request_failed'
    return { ok: false, status: 0, json: null, reason, detail: '' }
  } finally {
    clearTimeout(timer)
  }
}

function errorDetail(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const record = payload as { error?: unknown; message?: unknown }
  const error = record.error
  if (typeof error === 'string') return error.slice(0, 180)
  if (error && typeof error === 'object' && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message.slice(0, 180)
  }
  if (typeof record.message === 'string') return record.message.slice(0, 180)
  return ''
}

function completionText(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const choices = (payload as { choices?: unknown }).choices
  if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== 'object') return null
  const message = (choices[0] as { message?: unknown }).message
  if (!message || typeof message !== 'object') return null
  const content = (message as { content?: unknown }).content
  if (typeof content === 'string') return content.trim() ? content : null
  if (!Array.isArray(content)) return null
  const text = content.map((part) => {
    if (typeof part === 'string') return part
    if (part && typeof part === 'object' && typeof (part as { text?: unknown }).text === 'string') {
      return (part as { text: string }).text
    }
    return ''
  }).join('')
  return text.trim() ? text : null
}

function parseModelJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  return JSON.parse(trimmed)
}
