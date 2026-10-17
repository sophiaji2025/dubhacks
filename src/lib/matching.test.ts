import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildActionPlan,
  isExplicitlyFree,
  matchResources,
  parseMatchRequest,
  type Resource,
} from './matching'

function resource(overrides: Partial<Resource> = {}): Resource {
  return {
    id: '1',
    name: 'Community Food Bank',
    description: 'Groceries and prepared meals',
    category: 'Food assistance',
    cost: 'Free',
    address: '123 Example St',
    city: 'Seattle',
    eligibility: 'Open to all residents',
    contact: '(206) 555-0101',
    source_url: 'https://example.org/foodbank',
    last_verified: '2026-10-01',
    published: true,
    ...overrides,
  }
}

describe('parseMatchRequest', () => {
  it('accepts stored category names and a city', () => {
    const parsed = parseMatchRequest({
      categories: ['Food assistance', 'Housing and shelter'],
      location: 'Seattle, WA',
    })
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    assert.deepEqual(parsed.request.categories, ['Food assistance', 'Housing and shelter'])
    assert.equal(parsed.request.city, 'seattle')
    assert.equal(parsed.request.freeOnly, false)
  })

  it('maps older checkbox labels onto stored categories', () => {
    const parsed = parseMatchRequest({
      categories: ['Food and groceries', 'Rent assistance'],
      location: '98104',
    })
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    assert.deepEqual(parsed.request.categories, ['Food assistance', 'Financial assistance'])
    assert.equal(parsed.request.city, 'seattle')
    assert.equal(parsed.request.zip, '98104')
  })

  it('rejects an unknown category and a missing location', () => {
    const unknown = parseMatchRequest({ categories: ['Not a category'], location: 'Seattle' })
    assert.equal(unknown.ok, false)
    if (unknown.ok) return
    assert.deepEqual(unknown.categories, ['Not a category'])

    const missingLocation = parseMatchRequest({ categories: ['Food assistance'] })
    assert.equal(missingLocation.ok, false)
  })
})

describe('isExplicitlyFree', () => {
  it('accepts a clearly free cost and rejects mixed or unknown cost', () => {
    assert.equal(isExplicitlyFree('Free'), true)
    assert.equal(isExplicitlyFree('No cost'), true)
    assert.equal(isExplicitlyFree('Free or low-cost'), false)
    assert.equal(isExplicitlyFree('Sliding scale'), false)
    assert.equal(isExplicitlyFree(null), false)
    assert.equal(isExplicitlyFree(''), false)
  })
})

describe('matchResources', () => {
  const food = resource()
  const shelter = resource({
    id: '2',
    name: 'Shelter Now',
    category: 'Housing and shelter',
    cost: 'Free or low-cost',
    description: 'Emergency shelter',
    eligibility: 'Adults and families',
    last_verified: '2025-06-01',
  })
  const bellevue = resource({
    id: '3',
    name: 'Eastside Pantry',
    city: 'Bellevue',
    description: 'Food pantry',
  })
  const unpublished = resource({ id: '4', name: 'Hidden pantry', published: false })
  const unknownCost = resource({
    id: '5',
    name: 'Meal site',
    cost: null,
    eligibility: null,
    last_verified: null,
    description: 'Meals for children',
  })
  const noCity = resource({
    id: '6',
    name: 'Meal site',
    city: null,
    cost: null,
    eligibility: null,
    last_verified: null,
  })

  it('includes a related housing listing for a financial assistance search', () => {
    const parsed = parseMatchRequest({
      categories: ['Financial assistance'],
      location: 'Seattle',
    })
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return

    const matches = matchResources([food, shelter], parsed.request)
    assert.deepEqual(matches.map((match) => match.resource.name), ['Shelter Now'])
    assert.match(matches[0].reasons[0], /Related to Financial assistance/)
    assert.ok(matches[0].score < 50 + 20)
  })

  it('puts a city match ahead of a listing with no service area', () => {
    const parsed = parseMatchRequest({ categories: ['Food assistance'], location: '98101' })
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return

    const matches = matchResources([noCity, food, bellevue, unpublished], parsed.request)
    assert.deepEqual(matches.map((match) => match.resource.name), ['Community Food Bank', 'Meal site'])
    assert.match(matches[0].reasons.join(' '), /ZIP 98101 is in Seattle/)
    assert.match(matches[0].reasons.join(' '), /not a decision that you qualify/)
  })

  it('drops anything that is not explicitly free when freeOnly is set', () => {
    const parsed = parseMatchRequest({
      categories: ['Food assistance', 'Housing and shelter'],
      location: 'Seattle',
      freeOnly: true,
    })
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return

    const matches = matchResources([food, shelter, unknownCost], parsed.request)
    assert.deepEqual(matches.map((match) => match.resource.name), ['Community Food Bank'])
  })

  it('uses extra text only as a word match on the listing', () => {
    const parsed = parseMatchRequest({
      categories: ['Food assistance'],
      location: 'Seattle',
      text: 'I have two children',
    })
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return

    const plain = resource({ id: '7', name: 'Plain pantry', description: 'Groceries for households' })
    const family = resource({ id: '8', name: 'Family meals', description: 'Meals for children' })
    const matches = matchResources([plain, family], parsed.request)
    assert.equal(matches[0].resource.name, 'Family meals')
    assert.match(matches[0].reasons.join(' '), /children/)
    assert.match(matches[0].reasons.join(' '), /not a decision that you qualify/)
    assert.ok(matches[0].score > matches[1].score)
  })
})

describe('buildActionPlan', () => {
  it('names the stored categories and does not claim availability', () => {
    const parsed = parseMatchRequest({
      categories: ['Food assistance'],
      location: 'Seattle',
      freeOnly: true,
      transportation: 'Wheelchair-accessible services',
      text: 'two children',
    })
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return

    const plan = buildActionPlan(parsed.request).join(' ')
    assert.match(plan, /Food assistance/)
    assert.match(plan, /cannot confirm space/)
    assert.match(plan, /transportation preference was not used/)
    assert.match(plan, /not used to decide eligibility/)
  })
})
