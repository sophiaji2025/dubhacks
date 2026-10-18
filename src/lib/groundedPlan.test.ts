import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { acceptGroundedPlan, groundedPlanInput, type GroundedPlan } from './groundedPlan'
import { parseMatchRequest, type MatchCriteria, type RankedMatch, type Resource } from './matching'

function resource(overrides: Partial<Resource> = {}): Resource {
  return {
    id: 'food',
    name: 'Ballard Food Bank',
    description: 'Groceries and prepared meals',
    category: 'Food assistance',
    cost: 'Free',
    address: '123 Example St',
    city: 'Seattle',
    eligibility: 'Open to residents of the service area',
    contact: '(206) 555-0101',
    service_area: 'North Seattle',
    zip_codes: ['98107'],
    source_url: 'https://example.org/ballard',
    application_instructions: 'Bring a photo ID if you have one',
    last_verified: '2026-10-01',
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

function match(resourceRow: Resource, score = 80): RankedMatch {
  return { resource: resourceRow, score, reasons: ['Matches Food assistance.'], factors: [] }
}

function criteria(overrides: Partial<MatchCriteria> = {}): MatchCriteria {
  const parsed = parseMatchRequest({
    categories: ['Food assistance'],
    location: 'Seattle',
    text: overrides.description,
  })
  if (!parsed.ok) throw new Error(parsed.error)
  return { ...parsed.request, ...overrides }
}

function modelPlan(matches: RankedMatch[], overrides: Record<string, unknown> = {}) {
  return {
    steps: [
      {
        resource_id: matches[0].resource.id,
        text: `Call ${matches[0].resource.name} and confirm current hours before you go.`,
      },
      {
        resource_id: '',
        text: 'Use the official website on the listing, then contact the provider before traveling.',
      },
      {
        resource_id: matches[1]?.resource.id ?? '',
        text: matches[1]
          ? `Ask ${matches[1].resource.name} what to bring when you contact them.`
          : 'Confirm the service area on the listing before you travel to the provider.',
      },
    ],
    call_lines: matches.map((item) => ({
      resource_id: item.resource.id,
      line: `Hello, I am calling ${item.resource.name}. Can you tell me the current hours and how to apply?`,
    })),
    ...overrides,
  }
}

describe('acceptGroundedPlan', () => {
  const food = resource()
  const shelter = resource({
    id: 'shelter',
    name: 'Mary\'s Place Family Shelter',
    category: 'Housing and shelter',
    cost: 'Free',
    source_url: 'https://example.org/shelter',
    contact: '(206) 555-0199',
    zip_codes: ['98107'],
    serves_children_or_families: true,
  })
  const matches = [match(food), match(shelter, 70)]
  const request = criteria()

  it('keeps the stored names and does not return the person note', () => {
    const note = 'I lost my job last month and I am trying to feed two children.'
    const decision = acceptGroundedPlan(modelPlan(matches), matches, criteria({ description: note }))
    assert.equal(decision.ok, true)
    if (!decision.ok) return
    assert.equal(decision.plan.call_lines[0].name, 'Ballard Food Bank')
    assert.equal(decision.plan.call_lines[1].name, 'Mary\'s Place Family Shelter')
    assert.equal(JSON.stringify(decision.plan).includes(note.slice(0, 40)), false)
    assert.equal('description' in decision.plan, false)
  })

  it('allows a street fragment that is already on the listing', () => {
    const bank = resource({
      id: 'west',
      name: 'West Seattle Food Bank',
      address: '3419 SW Morgan St',
      service_area: 'West Seattle',
    })
    const rows = [match(bank)]
    const plan = modelPlan(rows)
    plan.steps[0].text = 'Call West Seattle Food Bank at SW Morgan St and confirm hours before you go.'
    const decision = acceptGroundedPlan(plan, rows, request)
    assert.equal(decision.ok, true)
  })

  it('allows the and a listing name in the same sentence', () => {
    const plan = modelPlan(matches)
    plan.steps[1].text = 'Call the Ballard Food Bank and Mary\'s Place Family Shelter, then confirm hours before you go.'
    const decision = acceptGroundedPlan(plan, matches, request)
    assert.equal(decision.ok, true)
  })

  it('rejects an organization that was not retrieved', () => {
    const plan = modelPlan(matches)
    plan.steps[1].text = 'Also call Union Gospel Mission before the food bank closes today.'
    const decision = acceptGroundedPlan(plan, matches, request)
    assert.equal(decision.ok, false)
    if (decision.ok) return
    assert.match(decision.reason, /^unknown_name:/)
  })

  it('rejects a claim that the person qualifies', () => {
    const plan = modelPlan(matches)
    plan.steps[0].text = 'You qualify for Ballard Food Bank, so call them this afternoon.'
    const decision = acceptGroundedPlan(plan, matches, request)
    assert.equal(decision.ok, false)
    if (decision.ok) return
    assert.equal(decision.reason, 'eligibility_claim')
  })

  it('allows a sentence that says the search does not decide eligibility', () => {
    const plan = modelPlan(matches)
    plan.steps[1].text = 'This search does not mean you qualify. Confirm the details with the provider.'
    const decision = acceptGroundedPlan(plan, matches, request)
    assert.equal(decision.ok, true)
  })

  it('rejects a category that the listing does not have', () => {
    const plan = modelPlan(matches)
    plan.steps[0].text = 'Ballard Food Bank is Housing and shelter, so start there today.'
    const decision = acceptGroundedPlan(plan, matches, request)
    assert.equal(decision.ok, false)
    if (decision.ok) return
    assert.equal(decision.reason, 'category_changed')
  })

  it('rejects a translated category that the listing does not have', () => {
    const plan = modelPlan(matches)
    plan.steps[0].text = 'Ballard Food Bank ofrece Vivienda y albergue, así que llame hoy mismo.'
    const decision = acceptGroundedPlan(plan, matches, request)
    assert.equal(decision.ok, false)
    if (decision.ok) return
    assert.equal(decision.reason, 'category_changed')
  })

  it('rejects a call line for a listing that was not retrieved', () => {
    const plan = modelPlan(matches)
    plan.call_lines[1].resource_id = 'not-a-real-id'
    const decision = acceptGroundedPlan(plan, matches, request)
    assert.equal(decision.ok, false)
    if (decision.ok) return
    assert.equal(decision.reason, 'unknown_resource')
  })

  it('rejects a missing call line', () => {
    const plan = modelPlan(matches)
    plan.call_lines = [plan.call_lines[0], plan.call_lines[0]]
    const decision = acceptGroundedPlan(plan, matches, request)
    assert.equal(decision.ok, false)
    if (decision.ok) return
    assert.equal(decision.reason, 'duplicate_call_line')
  })

  it('rejects an invented phone number', () => {
    const plan = modelPlan(matches)
    plan.call_lines[0].line = 'Call Ballard Food Bank at (206) 555-0177 and ask about hours today.'
    const decision = acceptGroundedPlan(plan, matches, request)
    assert.equal(decision.ok, false)
    if (decision.ok) return
    assert.equal(decision.reason, 'unknown_phone')
  })

  it('keeps a phone number that is already on the listing', () => {
    const plan = modelPlan(matches)
    plan.call_lines[0].line = 'Call Ballard Food Bank at (206) 555-0101 and ask about hours today.'
    const decision = acceptGroundedPlan(plan, matches, request)
    assert.equal(decision.ok, true)
  })

  it('rejects wheelchair access when the listing does not record it', () => {
    const plan = modelPlan(matches)
    plan.steps[0].text = 'Ballard Food Bank is wheelchair accessible, so you can go there today.'
    const decision = acceptGroundedPlan(plan, matches, request)
    assert.equal(decision.ok, false)
    if (decision.ok) return
    assert.equal(decision.reason, 'unsupported_fact')
  })

  it('allows asking about wheelchair access when the listing does not record it', () => {
    const plan = modelPlan(matches)
    plan.call_lines[0].line = 'Hello, I am calling Ballard Food Bank. Can you confirm whether the entrance is wheelchair accessible?'
    const decision = acceptGroundedPlan(plan, matches, request)
    assert.equal(decision.ok, true)
  })

  it('rejects a free claim when cost is unknown', () => {
    const unknownCost = resource({ id: 'unknown-cost', name: 'Community Pantry', cost: null, source_url: 'https://example.org/pantry' })
    const rows = [match(unknownCost)]
    const plan = modelPlan(rows)
    plan.steps[0].text = 'Community Pantry is free, so start with that listing today.'
    const decision = acceptGroundedPlan(plan, rows, request)
    assert.equal(decision.ok, false)
    if (decision.ok) return
    assert.equal(decision.reason, 'unsupported_fact')
  })

  it('rejects a website that is not on the listing', () => {
    const plan = modelPlan(matches)
    plan.steps[1].text = 'Open https://evil.example/apply and then contact the provider before you go.'
    const decision = acceptGroundedPlan(plan, matches, request)
    assert.equal(decision.ok, false)
    if (decision.ok) return
    assert.equal(decision.reason, 'unknown_url')
  })

  it('rejects a ZIP that is not on the listing or the search', () => {
    const plan = modelPlan(matches)
    plan.steps[0].text = 'Call Ballard Food Bank if you live in ZIP 98199 and confirm hours.'
    const decision = acceptGroundedPlan(plan, matches, request)
    assert.equal(decision.ok, false)
    if (decision.ok) return
    assert.equal(decision.reason, 'unknown_zip')
  })

  it('rejects a plan that repeats the person note', () => {
    const note = 'I lost my job last month and I am trying to feed two children.'
    const plan = modelPlan(matches)
    plan.steps[1].text = note
    const decision = acceptGroundedPlan(plan, matches, criteria({ description: note }))
    assert.equal(decision.ok, false)
    if (decision.ok) return
    assert.equal(decision.reason, 'repeated_note')
  })

  it('does not put the person note in the returned plan fields', () => {
    const note = 'two kids'
    const input = groundedPlanInput(matches, criteria({ description: note }))
    assert.match(input, /two kids/)
    const decision = acceptGroundedPlan(modelPlan(matches), matches, criteria({ description: note }))
    assert.equal(decision.ok, true)
    if (!decision.ok) return
    const plan: GroundedPlan = decision.plan
    assert.equal(JSON.stringify(plan).includes('two kids'), false)
  })
})
