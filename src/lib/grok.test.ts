import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { writeGroundedPlan } from './grok'
import { parseMatchRequest, type RankedMatch, type Resource } from './matching'

function resource(overrides: Partial<Resource> = {}): Resource {
  return {
    id: 'food',
    name: 'Ballard Food Bank',
    description: 'Groceries',
    category: 'Food assistance',
    cost: 'Free',
    address: '123 Example St',
    city: 'Seattle',
    eligibility: null,
    contact: '(206) 555-0101',
    service_area: null,
    zip_codes: null,
    source_url: 'https://example.org/ballard',
    application_instructions: null,
    last_verified: null,
    wheelchair_accessible: null,
    serves_children_or_families: null,
    appointment_required: null,
    walk_in: null,
    latitude: null,
    longitude: null,
    published: true,
    ...overrides,
  }
}

function match(row: Resource): RankedMatch {
  return { resource: row, score: 70, reasons: [], factors: [] }
}

function criteria() {
  const parsed = parseMatchRequest({
    categories: ['Food assistance'],
    location: 'Seattle',
    text: 'two children at home',
  })
  if (!parsed.ok) throw new Error(parsed.error)
  return parsed.request
}

function completion(content: unknown, status = 200): Response {
  return new Response(JSON.stringify({
    choices: [{ message: { content: JSON.stringify(content) } }],
  }), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('writeGroundedPlan', () => {
  const matches = [
    match(resource()),
    match(resource({ id: 'shelter', name: 'Mary\'s Place Family Shelter', category: 'Housing and shelter' })),
  ]

  it('does not call the network when the key is missing', async () => {
    let called = false
    const plan = await writeGroundedPlan(matches, criteria(), 'en', {
      apiKey: null,
      fetchImpl: async () => {
        called = true
        return completion({})
      },
    })
    assert.equal(plan, null)
    assert.equal(called, false)
  })

  it('returns a plan from a valid completion and does not send the key in the body', async () => {
    const payload = {
      steps: [
        { resource_id: 'food', text: 'Call Ballard Food Bank and confirm current hours before you go.' },
        { resource_id: '', text: 'Use the official website on the listing, then contact the provider before traveling.' },
        { resource_id: 'shelter', text: 'Ask Mary\'s Place Family Shelter what to bring when you contact them.' },
      ],
      call_lines: [
        { resource_id: 'food', line: 'Hello, I am calling Ballard Food Bank. Can you tell me the current hours and how to apply?' },
        { resource_id: 'shelter', line: 'Hello, I am calling Mary\'s Place Family Shelter. Can you tell me the current hours and how to apply?' },
      ],
    }
    let authorization = ''
    let body = ''
    const plan = await writeGroundedPlan(matches, criteria(), 'en', {
      apiKey: 'test-key',
      fetchImpl: async (_url, init) => {
        authorization = new Headers(init?.headers).get('Authorization') ?? ''
        body = String(init?.body ?? '')
        return completion(payload)
      },
    })
    assert.equal(authorization, 'Bearer test-key')
    assert.equal(body.includes('test-key'), false)
    assert.match(body, /two children at home/)
    assert.ok(plan)
    assert.equal(plan?.source, 'grok')
    assert.equal(plan?.call_lines[0].name, 'Ballard Food Bank')
    assert.equal(JSON.stringify(plan).includes('two children'), false)
  })

  it('returns null when the completion names a program that was not retrieved', async () => {
    const payload = {
      steps: [
        { resource_id: 'food', text: 'Call Ballard Food Bank and confirm current hours before you go.' },
        { resource_id: '', text: 'Also visit Union Gospel Mission before you contact the provider today.' },
        { resource_id: 'shelter', text: 'Ask Mary\'s Place Family Shelter what to bring when you contact them.' },
      ],
      call_lines: [
        { resource_id: 'food', line: 'Hello, I am calling Ballard Food Bank. Can you tell me the current hours and how to apply?' },
        { resource_id: 'shelter', line: 'Hello, I am calling Mary\'s Place Family Shelter. Can you tell me the current hours and how to apply?' },
      ],
    }
    const plan = await writeGroundedPlan(matches, criteria(), 'en', {
      apiKey: 'test-key',
      fetchImpl: async () => completion(payload),
    })
    assert.equal(plan, null)
  })

  it('returns null when the request fails', async () => {
    const plan = await writeGroundedPlan(matches, criteria(), 'en', {
      apiKey: 'test-key',
      fetchImpl: async () => new Response('nope', { status: 401 }),
    })
    assert.equal(plan, null)
  })

  it('does not retry when the key is rejected', async () => {
    let calls = 0
    const plan = await writeGroundedPlan(matches, criteria(), 'en', {
      apiKey: 'test-key',
      fetchImpl: async () => {
        calls += 1
        return new Response(JSON.stringify({ error: 'Incorrect API key provided.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    })
    assert.equal(plan, null)
    assert.equal(calls, 1)
  })
})
