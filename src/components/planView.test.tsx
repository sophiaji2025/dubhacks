import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { LanguageProvider } from './LanguageProvider'
import NextSteps from './NextSteps'
import ResourceCard from './ResourceCard'

function render(node: ReturnType<typeof createElement>): string {
  return renderToStaticMarkup(createElement(LanguageProvider, null, node))
}

describe('plan view', () => {
  it('shows the written plan and hides the checklist', () => {
    const html = render(createElement(NextSteps, {
      groundedSteps: ['Call Ballard Food Bank and confirm hours.'],
      checklist: ['Review the ranked listings and their cost, location, and eligibility notes.'],
      showFallbackNote: false,
    }))
    assert.match(html, /What to do next/)
    assert.match(html, /Written from the listings on this page/)
    assert.match(html, /Call Ballard Food Bank/)
    assert.equal(html.includes('Review the ranked listings'), false)
  })

  it('shows the checklist when a written plan is not available', () => {
    const html = render(createElement(NextSteps, {
      groundedSteps: null,
      checklist: ['Review the ranked listings and their cost, location, and eligibility notes.'],
      showFallbackNote: true,
    }))
    assert.match(html, /A written plan from these listings was not available/)
    assert.match(html, /Review the ranked listings/)
  })

  it('shows the call line on the listing card', () => {
    const html = render(createElement(ResourceCard, {
      match: {
        resource: {
          id: 'food',
          name: 'Ballard Food Bank',
          description: 'Groceries',
          category: 'Food assistance',
          cost: 'Free',
          address: null,
          city: 'Seattle',
          service_area: null,
          zip_codes: null,
          eligibility: null,
          contact: '(206) 555-0101',
          source_url: null,
          application_instructions: null,
          last_verified: null,
        },
        reasons: [],
      },
      callLine: 'Hello, I am calling Ballard Food Bank. Can you tell me the current hours?',
    }))
    assert.match(html, /What to say when you call/)
    assert.match(html, /Hello, I am calling Ballard Food Bank/)
  })
})
