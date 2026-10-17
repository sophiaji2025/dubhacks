import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseMatchRequest } from './matchRequest'

describe('parseMatchRequest', () => {
  it('accepts the current search form shape', () => {
    const parsed = parseMatchRequest({
      categories: ['Food and groceries', 'Housing or emergency shelter'],
      location: 'Seattle',
      text: 'I recently lost my job.',
    })

    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    assert.deepEqual(parsed.request.canonicalCategories, ['food', 'housing'])
    assert.equal(parsed.request.city, 'seattle')
    assert.equal(parsed.request.description, 'I recently lost my job.')
    assert.equal(parsed.request.freeOnly, false)
  })

  it('accepts explicit free-only and transportation preferences', () => {
    const parsed = parseMatchRequest({
      categories: ['Healthcare or medical costs'],
      zip: '98101',
      freeOnly: true,
      transportation: 'Wheelchair-accessible services',
    })

    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    assert.equal(parsed.request.freeOnly, true)
    assert.equal(parsed.request.transportation, 'wheelchair_accessible')
    assert.equal(parsed.request.zip, '98101')
    assert.equal(parsed.request.citySource, 'zip')
  })

  it('rejects a non-object body', () => {
    const parsed = parseMatchRequest(null)
    assert.equal(parsed.ok, false)
    if (parsed.ok) return
    assert.match(parsed.error, /JSON object/)
  })

  it('rejects missing categories', () => {
    const parsed = parseMatchRequest({ location: 'Seattle' })
    assert.equal(parsed.ok, false)
    if (parsed.ok) return
    assert.match(parsed.error, /categories/)
  })

  it('rejects an empty category list', () => {
    const parsed = parseMatchRequest({ categories: [], location: 'Seattle' })
    assert.equal(parsed.ok, false)
    if (parsed.ok) return
    assert.match(parsed.error, /at least one category/)
  })

  it('rejects unknown categories', () => {
    const parsed = parseMatchRequest({
      categories: ['Spaceship repair'],
      location: 'Seattle',
    })
    assert.equal(parsed.ok, false)
    if (parsed.ok) return
    assert.match(parsed.error, /invalid/)
    assert.deepEqual(parsed.details, ['Unsupported category: Spaceship repair'])
  })

  it('rejects a missing city or ZIP', () => {
    const parsed = parseMatchRequest({ categories: ['Food and groceries'] })
    assert.equal(parsed.ok, false)
    if (parsed.ok) return
    assert.match(parsed.error, /city or ZIP/)
  })

  it('rejects an invalid transportation preference', () => {
    const parsed = parseMatchRequest({
      categories: ['Food and groceries'],
      location: 'Seattle',
      transportation: 'helicopter',
    })
    assert.equal(parsed.ok, false)
    if (parsed.ok) return
    assert.match(parsed.error, /transportation/)
  })

  it('rejects a non-boolean freeOnly value', () => {
    const parsed = parseMatchRequest({
      categories: ['Food and groceries'],
      location: 'Seattle',
      freeOnly: 'sometimes',
    })
    assert.equal(parsed.ok, false)
    if (parsed.ok) return
    assert.match(parsed.error, /freeOnly/)
  })

  it('rejects an oversized description', () => {
    const parsed = parseMatchRequest({
      categories: ['Food and groceries'],
      location: 'Seattle',
      description: 'x'.repeat(2001),
    })
    assert.equal(parsed.ok, false)
    if (parsed.ok) return
    assert.match(parsed.error, /at most 2000/)
  })
})
