import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildActionPlan,
  isExplicitlyFree,
  matchResources,
  type MatchCriteria,
  type Resource,
} from './matching'

function testResource(overrides: Partial<Resource> & Pick<Resource, 'id' | 'name'>): Resource {
  return {
    description: 'TEST fixture description',
    category: 'Food assistance',
    cost: 'Free',
    address: 'TEST address',
    city: 'Seattle',
    eligibility: 'TEST eligibility notes',
    contact: 'TEST contact',
    source_url: 'https://example.test/resource',
    last_verified: '2026-09-01',
    published: true,
    ...overrides,
  }
}

function criteria(overrides: Partial<MatchCriteria> = {}): MatchCriteria {
  return {
    categories: ['Food and groceries'],
    canonicalCategories: ['food'],
    city: 'seattle',
    citySource: 'entered',
    locationLabel: 'Seattle',
    freeOnly: false,
    ...overrides,
  }
}

const FORBIDDEN_CLAIM_PATTERN =
  /you qualify for|you are eligible|confirmed available|funding is (available|confirmed)|space is (available|confirmed)|is nearby|are nearby|\d+ miles away|\d+ km away|within \d+ (miles|km)/i

describe('isExplicitlyFree', () => {
  it('treats only clearly free costs as free', () => {
    assert.equal(isExplicitlyFree('Free'), true)
    assert.equal(isExplicitlyFree('no cost'), true)
    assert.equal(isExplicitlyFree('Free. Donations welcome.'), true)
    assert.equal(isExplicitlyFree('Free or low-cost'), false)
    assert.equal(isExplicitlyFree('Low-cost'), false)
    assert.equal(isExplicitlyFree('Unknown'), false)
    assert.equal(isExplicitlyFree(''), false)
    assert.equal(isExplicitlyFree(null), false)
  })
})

describe('matchResources', () => {
  it('matches a resource in the selected category', () => {
    const resources = [
      testResource({ id: 'food-1', name: 'TEST Food Program', category: 'Food assistance' }),
      testResource({ id: 'legal-1', name: 'TEST Legal Clinic', category: 'Legal assistance' }),
    ]

    const matches = matchResources(resources, criteria())
    assert.equal(matches.length, 1)
    assert.equal(matches[0].resource.id, 'food-1')
    assert.ok(matches[0].score > 0)
    assert.ok(matches[0].reasons.some((reason) => /Food assistance/.test(reason)))
  })

  it('supports multiple selected categories', () => {
    const resources = [
      testResource({ id: 'food-1', name: 'TEST Food Program', category: 'Food assistance' }),
      testResource({ id: 'housing-1', name: 'TEST Shelter', category: 'Housing and shelter' }),
      testResource({ id: 'legal-1', name: 'TEST Legal Clinic', category: 'Legal assistance' }),
    ]

    const matches = matchResources(resources, criteria({
      categories: ['Food and groceries', 'Housing or emergency shelter'],
      canonicalCategories: ['food', 'housing'],
    }))

    assert.deepEqual(matches.map((match) => match.resource.id).sort(), ['food-1', 'housing-1'])
  })

  it('excludes unknown and mixed cost when free-only is set', () => {
    const resources = [
      testResource({ id: 'free-1', name: 'TEST Free Meals', cost: 'Free' }),
      testResource({ id: 'unknown-1', name: 'TEST Unknown Cost Meals', cost: null }),
      testResource({ id: 'mixed-1', name: 'TEST Mixed Cost Meals', cost: 'Free or low-cost' }),
    ]

    const matches = matchResources(resources, criteria({ freeOnly: true }))
    assert.deepEqual(matches.map((match) => match.resource.id), ['free-1'])
  })

  it('never returns unpublished resources', () => {
    const resources = [
      testResource({ id: 'draft-1', name: 'TEST Unpublished Food', published: false }),
      testResource({ id: 'live-1', name: 'TEST Published Food', published: true }),
    ]

    const matches = matchResources(resources, criteria())
    assert.deepEqual(matches.map((match) => match.resource.id), ['live-1'])
  })

  it('ranks a same-city exact match above a city mismatch', () => {
    const resources = [
      testResource({ id: 'other-city', name: 'TEST Other City Food', city: 'Tacoma' }),
      testResource({ id: 'seattle', name: 'TEST Seattle Food', city: 'Seattle' }),
    ]

    const matches = matchResources(resources, criteria())
    assert.equal(matches[0].resource.id, 'seattle')
    assert.ok(matches[0].score > matches[1].score)
    assert.ok(matches[0].factors.some((factor) => factor.key === 'location' && factor.points > 0))
    assert.ok(matches[1].factors.some((factor) => factor.key === 'location' && factor.points < 0))
  })

  it('handles missing eligibility, transportation, and availability honestly', () => {
    const resources = [
      testResource({
        id: 'sparse-1',
        name: 'TEST Sparse Food Listing',
        eligibility: null,
        last_verified: null,
        city: null,
      }),
    ]

    const matches = matchResources(resources, criteria({
      transportation: 'wheelchair_accessible',
    }))

    assert.equal(matches.length, 1)
    const reasons = matches[0].reasons.join(' ')
    assert.match(reasons, /Eligibility requirements are not listed/)
    assert.match(reasons, /Transportation access is not stored/)
    assert.match(reasons, /City or service area is not listed/)
    assert.doesNotMatch(reasons, FORBIDDEN_CLAIM_PATTERN)
    assert.ok(matches[0].factors.every((factor) => factor.explanation.length > 0))
  })

  it('maps a Seattle ZIP to the city name without claiming proximity', () => {
    const resources = [
      testResource({ id: 'seattle', name: 'TEST Seattle Food', city: 'Seattle' }),
    ]

    const matches = matchResources(resources, criteria({
      city: 'seattle',
      zip: '98101',
      citySource: 'zip',
      locationLabel: '98101',
    }))

    const location = matches[0].factors.find((factor) => factor.key === 'location')
    assert.ok(location)
    if (!location) return
    assert.ok(location.points > 0)
    assert.match(location.explanation, /ZIP 98101 is associated with seattle/)
    assert.doesNotMatch(location.explanation, FORBIDDEN_CLAIM_PATTERN)
  })

  it('returns an empty list when nothing matches', () => {
    const resources = [
      testResource({ id: 'legal-1', name: 'TEST Legal Clinic', category: 'Legal assistance' }),
    ]

    const matches = matchResources(resources, criteria())
    assert.deepEqual(matches, [])
  })

  it('does not claim qualification or availability in generated copy', () => {
    const resources = [
      testResource({ id: 'food-1', name: 'TEST Food Program' }),
    ]
    const request = criteria({
      freeOnly: true,
      transportation: 'public_or_walking',
      description: 'I recently lost my job and have two children.',
    })
    const matches = matchResources(resources, request)
    const text = [
      ...matches.flatMap((match) => match.reasons),
      ...buildActionPlan(request),
    ].join(' ')

    assert.doesNotMatch(text, FORBIDDEN_CLAIM_PATTERN)
  })
})
