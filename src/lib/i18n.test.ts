import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { interpolate, isLanguageCode, LANGUAGE_CODES, LANGUAGES } from './i18n'
import { translate, translateCategory } from './messages'

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
})
