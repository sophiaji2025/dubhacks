import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { interpolate, isLanguageCode, LANGUAGE_CODES, LANGUAGES } from './i18n'
import { actionPlanSteps, translate, translateCategory, type MessageKey } from './messages'

describe('language list', () => {
  it('covers high-prevalence Seattle languages and keeps English first', () => {
    assert.equal(LANGUAGES[0].code, 'en')
    assert.deepEqual(LANGUAGES.map((language) => language.code), ['en', 'es', 'zh', 'vi', 'so', 'ko', 'am', 'tl'])
    assert.equal(isLanguageCode('es'), true)
    assert.equal(isLanguageCode('de'), false)
  })
})

describe('interpolate', () => {
  it('fills named placeholders', () => {
    assert.equal(interpolate('{count} listings in {place}', { count: 3, place: 'Seattle' }), '3 listings in Seattle')
  })
})

describe('translate', () => {
  it('returns English and Spanish UI chrome for the same key', () => {
    assert.equal(translate('en', 'nav.findHelp'), 'Find help')
    assert.equal(translate('es', 'nav.findHelp'), 'Buscar ayuda')
    assert.match(translate('zh', 'home.listingsStayPublished'), /发布/)
  })

  it('covers every supported language with a non-empty find-help label', () => {
    for (const code of LANGUAGE_CODES) {
      const label = translate(code, 'nav.findHelp')
      assert.ok(label.trim().length > 0, code)
    }
  })

  it('keeps English category values for lookup while translating the label', () => {
    assert.equal(translateCategory('en', 'Food assistance'), 'Food assistance')
    assert.equal(translateCategory('es', 'Food assistance'), 'Ayuda alimentaria')
    assert.equal(translateCategory('tl', 'Housing and shelter'), 'Pabahay at silungan')
    assert.equal(translateCategory('es', 'Not a category'), 'Not a category')
  })

  it('keeps Amharic and Tagalog chrome out of English', () => {
    const amharic: MessageKey[] = [
      'home.title',
      'home.next1',
      'home.planFree',
      'card.showListing',
      'admin.metaTitle',
    ]
    for (const key of amharic) {
      assert.notEqual(translate('am', key), translate('en', key), key)
    }
    assert.notEqual(translate('tl', 'category.Utilities'), 'Utilities')
    assert.notEqual(translate('tl', 'card.contact'), 'Contact')
    assert.notEqual(translate('tl', 'admin.key'), 'Admin key')
    assert.notEqual(translate('es', 'map.previewHint'), translate('en', 'map.previewHint'))
    assert.notEqual(translate('am', 'map.previewHint'), translate('en', 'map.previewHint'))
  })
})

describe('actionPlanSteps', () => {
  it('adds a note for each preference the search actually used', () => {
    const steps = actionPlanSteps('en', {
      freeOnly: true,
      transportation: 'Access to a car',
      childrenOrFamily: true,
      asSoonAsPossible: true,
      noAppointment: true,
      text: 'two children',
    })
    assert.equal(steps[0], translate('en', 'home.next1'))
    assert.equal(steps.length, 9)
    assert.match(steps[3], /completely free/)
    assert.match(steps[4], /transportation preference/)
    assert.match(steps[7], /no appointment/)
    assert.match(steps[8], /extra details/)
  })

  it('mentions wheelchair access only for that transportation choice', () => {
    const steps = actionPlanSteps('es', { transportation: 'Wheelchair-accessible services' })
    assert.equal(steps.length, 4)
    assert.match(steps[3], /silla de ruedas/)
    assert.equal(actionPlanSteps('en', {}).length, 3)
  })
})
