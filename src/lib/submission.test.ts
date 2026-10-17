import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseSubmission } from './submission'

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    organizationName: 'North Seattle Aid',
    resourceName: 'Rent help',
    description: 'Emergency rent assistance for households in north Seattle.',
    categories: ['Financial assistance', 'Housing and shelter'],
    cost: 'Free',
    city: 'Seattle',
    serviceArea: 'North Seattle',
    zipCodes: '98103, 98105, 98115, 98125',
    contact: '(206) 555-0148',
    sourceUrl: 'https://example.org/rent-help',
    eligibility: 'Call to ask about current requirements.',
    ...overrides,
  }
}

describe('parseSubmission', () => {
  it('accepts a complete submission and keeps category order', () => {
    const parsed = parseSubmission(validBody())
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    assert.equal(parsed.submission.organization_name, 'North Seattle Aid')
    assert.equal(parsed.submission.category, 'Financial assistance')
    assert.deepEqual(parsed.submission.categories, ['Financial assistance', 'Housing and shelter'])
    assert.deepEqual(parsed.submission.zip_codes, ['98103', '98105', '98115', '98125'])
    assert.equal(parsed.submission.service_area, 'North Seattle')
    assert.equal(parsed.submission.submitter_email, null)
  })

  it('accepts a service area or ZIP list as the location', () => {
    const area = parseSubmission(validBody({ city: '   ', serviceArea: 'North Seattle', zipCodes: '' }))
    assert.equal(area.ok, true)

    const zips = parseSubmission(validBody({ city: '', serviceArea: '', zipCodes: ['98105'] }))
    assert.equal(zips.ok, true)
    if (!zips.ok) return
    assert.deepEqual(zips.submission.zip_codes, ['98105'])
    assert.equal(zips.submission.city, null)
  })

  it('reports every missing required field', () => {
    const parsed = parseSubmission({ categories: [], cost: '   ' })
    assert.equal(parsed.ok, false)
    if (parsed.ok) return
    const details = parsed.details.join(' ')
    assert.match(details, /Organization name is required/)
    assert.match(details, /Program name is required/)
    assert.match(details, /Description is required/)
    assert.match(details, /Cost is required/)
    assert.match(details, /Contact information is required/)
    assert.match(details, /Official source URL is required/)
    assert.match(details, /Select at least one category/)
    assert.match(details, /city, a service area, or at least one ZIP code/)
  })

  it('rejects an unknown category, a bad URL, a bad ZIP, and a bad email', () => {
    const parsed = parseSubmission(validBody({
      categories: ['Food and groceries'],
      sourceUrl: 'javascript:alert(1)',
      zipCodes: '9810',
      submitterEmail: 'not-an-email',
    }))
    assert.equal(parsed.ok, false)
    if (parsed.ok) return
    const details = parsed.details.join(' ')
    assert.match(details, /Unknown category/)
    assert.match(details, /http or https/)
    assert.match(details, /9810/)
    assert.match(details, /Submitter email/)
  })

  it('leaves eligibility blank when it was not provided', () => {
    const parsed = parseSubmission(validBody({ eligibility: '' }))
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    assert.equal(parsed.submission.eligibility, null)
  })
})
