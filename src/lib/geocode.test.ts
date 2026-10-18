import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { geocodePlace, mapFromSavedCoordinates, pointFromNominatim, resetGeocoder, resolveResourceMap } from './geocode'
import { parseMatchRequest, resourceFromRow, type Resource } from './matching'
import { CURATED_PUBLISHED_RESOURCES } from './publishedDirectory'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  resetGeocoder()
})

function resource(overrides: Partial<Resource> = {}): Resource {
  return {
    id: '1',
    name: 'Community Food Bank',
    description: 'Groceries',
    category: 'Food assistance',
    cost: 'Free',
    address: '123 Example St',
    city: 'Seattle',
    eligibility: null,
    contact: null,
    service_area: null,
    zip_codes: null,
    source_url: null,
    application_instructions: null,
    last_verified: null,
    wheelchair_accessible: null,
    serves_children_or_families: null,
    appointment_required: null,
    walk_in: null,
    published: true,
    latitude: null,
    longitude: null,
    ...overrides,
  }
}

describe('pointFromNominatim', () => {
  it('keeps a street result and drops a city-only result when a street is required', () => {
    const street = [{
      lat: '47.61',
      lon: '-122.33',
      addresstype: 'house',
      address: { house_number: '123', road: 'Example St' },
    }]
    const city = [{
      lat: '47.61',
      lon: '-122.33',
      addresstype: 'city',
      class: 'place',
      type: 'city',
      address: { city: 'Seattle' },
    }]
    const amenity = [{
      lat: '47.5443163',
      lon: '-122.375864',
      addresstype: 'amenity',
      class: 'amenity',
      type: 'social_facility',
      address: { amenity: 'West Seattle Food Bank', road: 'Southwest Morgan Street' },
    }]
    const outside = [{
      lat: '45.515',
      lon: '-122.678',
      addresstype: 'house',
      address: { house_number: '1', road: 'SW 5th Ave' },
    }]
    assert.deepEqual(pointFromNominatim(street, true), { latitude: 47.61, longitude: -122.33 })
    assert.equal(pointFromNominatim(city, true), null)
    assert.deepEqual(pointFromNominatim(city, false), { latitude: 47.61, longitude: -122.33 })
    assert.deepEqual(pointFromNominatim(amenity, true), { latitude: 47.5443163, longitude: -122.375864 })
    assert.equal(pointFromNominatim(outside, true), null)
    assert.equal(pointFromNominatim({ error: 'no' }, false), null)
  })
})

describe('geocodePlace', () => {
  it('identifies the app, caches a result, and shares one request for the same query', async () => {
    resetGeocoder()
    let calls = 0
    const gate: { release: ((response: Response) => void) | null } = { release: null }
    globalThis.fetch = async (_input, init) => {
      calls += 1
      const headers = new Headers(init?.headers)
      assert.match(headers.get('user-agent') || '', /NeighborAid/)
      return new Promise((resolve) => {
        gate.release = resolve
      })
    }

    const first = geocodePlace('123 Example St, Seattle, Washington', true)
    const second = geocodePlace('123 Example St, Seattle, Washington', true)
    await new Promise((resolve) => setTimeout(resolve, 0))
    assert.equal(calls, 1)
    const respond = gate.release
    if (!respond) throw new Error('geocoder did not start')
    respond(new Response(JSON.stringify([{
      lat: '47.61',
      lon: '-122.33',
      address: { house_number: '123', road: 'Example St' },
    }]), { status: 200 }))

    const [firstPoint, secondPoint] = await Promise.all([first, second])
    assert.deepEqual(firstPoint, { latitude: 47.61, longitude: -122.33 })
    assert.deepEqual(secondPoint, firstPoint)

    const cached = await geocodePlace('123 example st, seattle, washington', true)
    assert.equal(calls, 1)
    assert.deepEqual(cached, firstPoint)
  })
})

describe('mapFromSavedCoordinates', () => {
  it('pins curated listings that already have coordinates and skips the geocoder', () => {
    let calls = 0
    globalThis.fetch = async () => {
      calls += 1
      return new Response('[]', { status: 200 })
    }
    const resources = CURATED_PUBLISHED_RESOURCES
      .map(resourceFromRow)
      .filter((resource): resource is Resource => resource !== null)
    const map = mapFromSavedCoordinates(resources, {
      city: 'seattle',
      cityLabel: 'Seattle',
      locationLabel: 'Seattle',
    })
    const pinned = resources.filter((resource) => resource.latitude != null && resource.longitude != null)
    assert.equal(calls, 0)
    assert.equal(map.center?.label, 'Seattle')
    assert.equal(map.places.length, pinned.length)
    assert.ok(map.places.length > 0)
    assert.equal(map.unmapped_count, resources.length - pinned.length)
    assert.deepEqual(
      map.places.map((place) => place.id).sort(),
      pinned.map((resource) => resource.id).sort(),
    )
    assert.equal(map.places.every((place) => place.approximate === false), true)
  })
})

describe('resolveResourceMap', () => {
  it('uses a saved point and a local ZIP center without calling the geocoder', async () => {
    resetGeocoder()
    let calls = 0
    globalThis.fetch = async () => {
      calls += 1
      return new Response('[]', { status: 200 })
    }
    const parsed = parseMatchRequest({ categories: ['Food assistance'], location: '98105' })
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return

    const map = await resolveResourceMap([
      resource({ latitude: 47.6062, longitude: -122.3321 }),
      resource({ id: '2', name: 'Area only', address: null, service_area: 'North Seattle' }),
    ], parsed.request)

    assert.equal(calls, 0)
    assert.equal(map.center?.label, 'ZIP 98105')
    assert.equal(map.places.length, 1)
    assert.equal(map.places[0].approximate, false)
    assert.match(map.places[0].distance_label || '', /center of ZIP 98105/)
    assert.equal(map.unmapped_count, 1)
  })

  it('pins a street address from a specific geocoder result', async () => {
    resetGeocoder()
    globalThis.fetch = async () => new Response(JSON.stringify([{
      lat: '47.62',
      lon: '-122.35',
      address: { house_number: '456', road: 'Shelter Ave', city: 'Seattle' },
    }]), { status: 200 })

    const parsed = parseMatchRequest({ categories: ['Housing and shelter'], location: 'Seattle' })
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return

    const map = await resolveResourceMap([resource({
      category: 'Housing and shelter',
      address: '456 Shelter Ave',
    })], parsed.request)

    assert.equal(map.center?.label, 'Seattle')
    assert.equal(map.places.length, 1)
    assert.equal(map.places[0].approximate, true)
    assert.equal(map.places[0].latitude, 47.62)
    assert.match(map.places[0].distance_label || '', /center of Seattle/)
  })
})
