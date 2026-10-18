import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { loadDirectoryMap } from './directoryMap'
import { isInKingCounty, readCoordinatePair } from './geo'
import { resourceFromRow } from './matching'
import {
  CURATED_PUBLISHED_RESOURCES,
  curatedPublishedRows,
  isPlaceholderDirectory,
  locationForPublishedRow,
} from './publishedDirectory'

const PINNED = [
  {
    id: 'curated-west-seattle-food-bank',
    address: '3419 SW Morgan St',
    latitude: 47.5443163,
    longitude: -122.375864,
  },
  {
    id: 'curated-roots-young-adult-shelter',
    address: '207 10th Ave E',
    latitude: 47.6201783,
    longitude: -122.3198459,
  },
  {
    id: 'curated-marys-place-blanchard',
    address: '720 Blanchard St',
    latitude: 47.617058,
    longitude: -122.3397722,
  },
  {
    id: 'curated-marys-place-allen-family-center',
    address: '3190 S Martin Luther King Jr Way',
    latitude: 47.5752369,
    longitude: -122.2968031,
  },
  {
    id: 'curated-muslim-housing-services',
    address: '7928 Rainier Ave S',
    latitude: 47.5311753,
    longitude: -122.2698707,
  },
  {
    id: 'curated-ucef',
    address: '4515 16th Ave NE',
    latitude: 47.6618095,
    longitude: -122.311218,
  },
]

const CITYWIDE = [
  'curated-afterschool-meals',
  'curated-seattle-fresh-bucks',
  'curated-seattle-utility-discount',
]

describe('curated published directory', () => {
  it('keeps official street pins and leaves citywide programs unmapped', () => {
    for (const expected of PINNED) {
      const row = CURATED_PUBLISHED_RESOURCES.find((item) => item.id === expected.id)
      assert.ok(row)
      if (!row) continue
      assert.equal(row.address, expected.address)
      assert.equal(row.city, 'Seattle')
      assert.equal(row.latitude, expected.latitude)
      assert.equal(row.longitude, expected.longitude)
      const point = readCoordinatePair(row.latitude, row.longitude)
      assert.ok(point)
      if (point) assert.equal(isInKingCounty(point), true)
      assert.ok(resourceFromRow(row))
    }

    for (const id of CITYWIDE) {
      const row = CURATED_PUBLISHED_RESOURCES.find((item) => item.id === id)
      assert.ok(row)
      if (!row) continue
      assert.equal(row.address, null)
      assert.equal(row.latitude, null)
      assert.equal(row.longitude, null)
    }
  })

  it('filters by stored category and treats the example seed as a placeholder', () => {
    const food = curatedPublishedRows({ categories: ['Food assistance'] })
    assert.ok(food.some((row) => row.id === 'curated-west-seattle-food-bank'))
    assert.ok(food.every((row) => row.category === 'Food assistance'))
    assert.equal(isPlaceholderDirectory([]), true)
    assert.equal(isPlaceholderDirectory([{
      name: 'Community Food Bank',
      address: '123 Example St',
      source_url: 'https://example.org/foodbank',
    }]), true)
    assert.equal(isPlaceholderDirectory([{
      name: 'West Seattle Food Bank',
      address: '3419 SW Morgan St',
      source_url: 'https://westseattlefoodbank.org/',
    }]), false)
  })

  it('uses an organization street address when the resource row has none', () => {
    const located = locationForPublishedRow({
      id: 'live-food-bank',
      name: 'West Seattle Food Bank Food Distribution',
      source_url: 'https://westseattlefoodbank.org/',
      address: null,
      latitude: null,
      longitude: null,
    }, {
      address: '3419 SW Morgan St',
      city: 'Seattle',
      zip_code: '98126',
    }) as { address: string; city: string; latitude: number; longitude: number }
    assert.equal(located.address, '3419 SW Morgan St, 98126')
    assert.equal(located.city, 'Seattle')
    assert.equal(located.latitude, 47.5443163)
    assert.equal(located.longitude, -122.375864)
  })

  it('uses the known shelter pin when the organization has no street address', () => {
    const located = locationForPublishedRow({
      id: 'live-marys-place',
      name: "Mary's Place",
      source_url: 'https://www.marysplaceseattle.org/get-help',
    }, {
      address: null,
      city: 'Seattle',
      zip_code: '98111',
    }) as { address: string; latitude: number }
    assert.equal(located.address, '720 Blanchard St')
    assert.equal(located.latitude, 47.617058)
  })

  it('puts the curated street addresses on the homepage map', async () => {
    const previous = {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.SUPABASE_ANON_KEY
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    try {
    const map = await loadDirectoryMap()
    assert.equal(map.center?.label, 'Seattle')
    assert.equal(map.places.length, PINNED.length)
    assert.equal(map.unmapped_count, CITYWIDE.length)
    assert.deepEqual(
      map.places.map((place) => place.id).sort(),
      PINNED.map((row) => row.id).sort(),
    )
    } finally {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
    }
  })
})
