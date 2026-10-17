import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { NextApiRequest, NextApiResponse } from 'next'
import handler from './match'

type JsonResponse = {
  statusCode: number
  headers: Record<string, string>
  body: unknown
}

function createMock(req: Partial<NextApiRequest>): { req: NextApiRequest; res: NextApiResponse; result: Promise<JsonResponse> } {
  let resolveResult: (value: JsonResponse) => void
  const result = new Promise<JsonResponse>((resolve) => {
    resolveResult = resolve
  })

  const headers: Record<string, string> = {}
  const res = {
    setHeader(name: string, value: string) {
      headers[name] = value
      return res
    },
    status(statusCode: number) {
      return {
        json(body: unknown) {
          resolveResult({ statusCode, headers, body })
          return res
        },
      }
    },
  } as unknown as NextApiResponse

  return { req: req as NextApiRequest, res, result }
}

describe('POST /api/match', () => {
  it('rejects unsupported methods', async () => {
    const { req, res, result } = createMock({ method: 'GET' })
    await handler(req, res)
    const response = await result
    assert.equal(response.statusCode, 405)
    assert.equal(response.headers.Allow, 'POST')
  })

  it('rejects invalid requests', async () => {
    const { req, res, result } = createMock({
      method: 'POST',
      body: { categories: [], location: 'Seattle' },
    })
    await handler(req, res)
    const response = await result
    assert.equal(response.statusCode, 400)
  })

  it('returns an empty published result set from the development stub', async () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const previousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_ANON_KEY

    const { req, res, result } = createMock({
      method: 'POST',
      body: { categories: ['Food and groceries'], location: 'Seattle' },
    })
    await handler(req, res)
    const response = await result
    const body = response.body as {
      count: number
      matches: unknown[]
      dataSource: string
      notice?: string
    }

    assert.equal(response.statusCode, 200)
    assert.equal(body.count, 0)
    assert.deepEqual(body.matches, [])
    assert.equal(body.dataSource, 'development-stub')
    assert.match(body.notice || '', /not production-ready/)

    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl
    if (previousKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousKey
  })
})
