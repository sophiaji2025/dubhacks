import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  SEATTLE_CENTER,
  SEATTLE_MAP,
  distanceLabel,
  distanceMiles,
  formatMiles,
  locationDetail,
  parseMapView,
  readCoordinatePair,
  resourceGeocodeQuery,
  searchAreaCenter,
} from './geo'

describe('searchAreaCenter', () => {
  it('frames a Seattle ZIP from a local center', () => {
    const center = searchAreaCenter({ zip: '98105', city: 'seattle', locationLabel: '98105' })
    assert.deepEqual(center, {
      latitude: 47.6636,
      longitude: -122.3015,
      label: 'ZIP 98105',
      approximate: true,
    })
    assert.ok(center && center.latitude > SEATTLE_CENTER.latitude)
  })

  it('frames a Seattle city search from the city center', () => {
    assert.deepEqual(searchAreaCenter({ city: 'seattle', locationLabel: 'Seattle' }), {
      ...SEATTLE_CENTER,
      label: 'Seattle',
      approximate: true,
    })
  })

  it('does not invent a center for a city outside the local table', () => {
    assert.equal(searchAreaCenter({ city: 'bellevue', locationLabel: 'Bellevue' }), null)
    assert.equal(searchAreaCenter({ zip: '98033', locationLabel: '98033' }), null)
  })
})

describe('coordinates and distance', () => {
  it('reads a coordinate pair and rejects a partial or impossible pair', () => {
    assert.deepEqual(readCoordinatePair('47.61', '-122.33'), { latitude: 47.61, longitude: -122.33 })
    assert.equal(readCoordinatePair(47.61, null), null)
    assert.equal(readCoordinatePair(91, -122.33), null)
    assert.equal(readCoordinatePair('nope', '-122.33'), null)
  })

  it('measures distance in miles and phrases it from the search area', () => {
    const miles = distanceMiles(SEATTLE_CENTER, { latitude: 47.6636, longitude: -122.3015 })
    assert.ok(miles > 3 && miles < 6)
    assert.equal(distanceMiles(SEATTLE_CENTER, SEATTLE_CENTER), 0)
    assert.equal(formatMiles(0.04), 'under 0.1 miles')
    assert.equal(formatMiles(1), '1 mile')
    assert.equal(formatMiles(1.24), '1.2 miles')
    assert.equal(distanceLabel(1.24, 'ZIP 98105'), 'About 1.2 miles from the center of ZIP 98105')
  })
})

describe('location text for the map', () => {
  it('joins the stored address and skips a blank service area', () => {
    assert.equal(locationDetail({
      address: '123 Example St',
      city: 'Seattle',
      service_area: '  ',
    }), '123 Example St, Seattle')
    assert.equal(locationDetail({ address: null, city: null, service_area: null }), null)
  })

  it('geocodes a street address and skips a missing or unknown one', () => {
    assert.equal(
      resourceGeocodeQuery({ address: '123 Example St', city: 'Seattle' }),
      '123 Example St, Seattle, Washington',
    )
    assert.equal(resourceGeocodeQuery({ address: 'Unknown', city: 'Seattle' }), null)
    assert.equal(resourceGeocodeQuery({ address: null, city: 'Seattle' }), null)
  })
})

describe('parseMapView', () => {
  it('keeps a Seattle center when one pin uses string coordinates', () => {
    const map = parseMapView({
      center: { latitude: '47.6062', longitude: -122.3321, label: 'Seattle' },
      places: [{
        id: 12,
        name: 'Community pantry',
        latitude: '47.62',
        longitude: '-122.31',
      }],
      unmapped_count: '2',
    })
    assert.equal(map?.center?.label, 'Seattle')
    assert.equal(map?.places.length, 1)
    assert.equal(map?.places[0].id, '12')
    assert.equal(map?.places[0].latitude, 47.62)
    assert.equal(map?.unmapped_count, 0)
  })

  it('still returns the local Seattle map shape when nothing is pinned', () => {
    assert.equal(SEATTLE_MAP.center?.label, 'Seattle')
    assert.equal(SEATTLE_MAP.places.length, 0)
    assert.equal(parseMapView({ places: [] })?.center, null)
  })
})
