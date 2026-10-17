import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isSupabaseConfigured, mapRowToResource } from './resourceProvider'

describe('mapRowToResource', () => {
  it('maps a published row and keeps unpublished rows unpublished', () => {
    const published = mapRowToResource({
      id: 'test-published',
      name: 'TEST Published Row',
      category: 'Food assistance',
      published: true,
    })
    const unpublished = mapRowToResource({
      id: 'test-draft',
      name: 'TEST Draft Row',
      category: 'Food assistance',
      published: false,
    })

    assert.equal(published?.published, true)
    assert.equal(unpublished?.published, false)
  })

  it('drops rows that cannot be identified', () => {
    assert.equal(mapRowToResource({ name: 'Missing id' }), null)
    assert.equal(mapRowToResource({ id: 'missing-name' }), null)
    assert.equal(mapRowToResource(null), null)
  })
})

describe('isSupabaseConfigured', () => {
  it('does not treat empty placeholders as a configured database', () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const previousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_ANON_KEY

    assert.equal(isSupabaseConfigured(), false)

    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl
    if (previousKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousKey
  })
})
