import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildActionPlan,
  isExplicitlyFree,
  matchResources,
  parseLocationQuery,
  parseMatchRequest,
  resourceFromRow,
  resourceMatchesLocation,
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
    service_area: null,
    zip_codes: null,
    source_url: 'https://example.org/foodbank',
    application_instructions: null,
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

  it('keeps a city-wide listing for a Seattle ZIP and drops a ZIP-limited listing that misses it', () => {
    const citywide = resource({ id: '9', name: 'Citywide meals' })
    const northOnly = resource({
      id: '10',
      name: 'North Seattle aid',
      category: 'Financial assistance',
      city: 'Seattle',
      service_area: 'North Seattle',
      zip_codes: ['98103', '98105', '98115', '98125'],
      cost: 'Free',
    })
    const parsed = parseMatchRequest({
      categories: ['Food assistance', 'Financial assistance'],
      location: '98104',
    })
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return

    const matches = matchResources([citywide, northOnly], parsed.request)
    assert.deepEqual(matches.map((match) => match.resource.name), ['Citywide meals'])

    const north = parseMatchRequest({
      categories: ['Financial assistance'],
      location: '98105',
    })
    assert.equal(north.ok, true)
    if (!north.ok) return
    const northMatches = matchResources([citywide, northOnly], north.request)
    assert.equal(northMatches[0].resource.name, 'North Seattle aid')
    assert.match(northMatches[0].reasons.join(' '), /98105 is inside the listed service area/)

    const city = parseMatchRequest({
      categories: ['Financial assistance'],
      location: 'Seattle',
    })
    assert.equal(city.ok, true)
    if (!city.ok) return
    const cityMatches = matchResources([northOnly], city.request)
    assert.equal(cityMatches.length, 1)
    assert.match(cityMatches[0].reasons.join(' '), /98103, 98105, 98115, 98125/)
  })

  it('applies recorded preferences and leaves unknown facts alone', () => {
    const accessible = resource({
      id: '11',
      name: 'Accessible pantry',
      wheelchair_accessible: true,
      serves_children_or_families: true,
      appointment_required: false,
      walk_in: true,
    })
    const unknown = resource({ id: '12', name: 'Unknown access pantry' })
    const inaccessible = resource({
      id: '13',
      name: 'Stairs only pantry',
      wheelchair_accessible: false,
    })
    const parsed = parseMatchRequest({
      categories: ['Food assistance'],
      location: 'Seattle',
      transportation: 'Wheelchair-accessible services',
      childrenOrFamily: true,
      asSoonAsPossible: true,
      noAppointment: true,
    })
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return

    const matches = matchResources([unknown, inaccessible, accessible], parsed.request)
    assert.deepEqual(matches.map((match) => match.resource.name), ['Accessible pantry', 'Unknown access pantry'])
    assert.match(matches[0].reasons.join(' '), /Wheelchair access is listed/)
    assert.match(matches[0].reasons.join(' '), /children or families/)
    assert.match(matches[0].reasons.join(' '), /walk-in is allowed/)
    assert.match(matches[0].reasons.join(' '), /appointment is not required/)
    assert.match(matches[0].reasons.join(' '), /does not confirm space/)
    assert.ok(!matches[1].reasons.join(' ').includes('Wheelchair access is listed'))
  })
})

describe('location query', () => {
  it('reads a ZIP list from a row and does not treat a missing flag as false', () => {
    const row = resourceFromRow({
      id: 'row-1',
      name: 'North aid',
      city: 'Seattle',
      zip_codes: '{98103,98105}',
      published: true,
    })
    assert.ok(row)
    if (!row) return
    assert.deepEqual(row.zip_codes, ['98103', '98105'])
    assert.equal(row.wheelchair_accessible, null)
    assert.equal(row.cost, null)
    assert.equal(row.latitude, null)
    assert.equal(row.longitude, null)

    const located = resourceFromRow({
      id: 'row-2',
      name: 'Pinned pantry',
      latitude: '47.6100',
      longitude: -122.33,
      published: true,
    })
    assert.equal(located?.latitude, 47.61)
    assert.equal(located?.longitude, -122.33)

    const location = parseLocationQuery('98105')
    assert.equal(location.ok, true)
    if (!location.ok) return
    assert.equal(resourceMatchesLocation(row, location), true)

    const downtown = parseLocationQuery('98104')
    assert.equal(downtown.ok, true)
    if (!downtown.ok) return
    assert.equal(resourceMatchesLocation(row, downtown), false)
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
    assert.match(plan, /Wheelchair access was applied only where a listing records it/)
    assert.match(plan, /not used to decide eligibility/)
    assert.match(plan, /not a decision that you qualify/)
  })

  it('leaves transit and car preferences unused', () => {
    const parsed = parseMatchRequest({
      categories: ['Food assistance'],
      location: 'Seattle',
      transportation: 'Public transportation or walking',
    })
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    assert.match(buildActionPlan(parsed.request).join(' '), /do not record transit or car access/)
  })
})
