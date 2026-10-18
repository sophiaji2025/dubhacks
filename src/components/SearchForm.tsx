import { ArrowRight } from './Icon'
import { FormEvent, useState } from 'react'
import CategoryChoices from './CategoryChoices'
import { useLanguage } from './LanguageProvider'
import type { MessageKey } from '../lib/messages'

export type SearchPayload = {
  categories: string[]
  location: string
  text: string
  freeOnly: boolean
  transportation?: string
  childrenOrFamily: boolean
  asSoonAsPossible: boolean
  noAppointment: boolean
}

const TRANSPORTATION_OPTIONS: { value: string; labelKey: MessageKey }[] = [
  { value: '', labelKey: 'form.transitNone' },
  { value: 'Public transportation or walking', labelKey: 'form.transitWalk' },
  { value: 'Access to a car', labelKey: 'form.transitCar' },
  { value: 'Wheelchair-accessible services', labelKey: 'form.transitWheelchair' },
]

type SearchFormProps = {
  loading: boolean
  onSearch: (payload: SearchPayload) => void
}

export default function SearchForm({ loading, onSearch }: SearchFormProps) {
  const { t } = useLanguage()
  const [selected, setSelected] = useState<string[]>([])
  const [location, setLocation] = useState('Seattle')
  const [text, setText] = useState('')
  const [freeOnly, setFreeOnly] = useState(false)
  const [transportation, setTransportation] = useState('')
  const [childrenOrFamily, setChildrenOrFamily] = useState(false)
  const [asSoonAsPossible, setAsSoonAsPossible] = useState(false)
  const [noAppointment, setNoAppointment] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const toggle = (category: string) => {
    setSelected((current) => (
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    ))
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selected.length === 0) {
      setFormError(t('form.errorCategory'))
      return
    }
    if (!location.trim()) {
      setFormError(t('form.errorLocation'))
      return
    }

    setFormError(null)
    onSearch({
      categories: selected,
      location: location.trim(),
      text: text.trim(),
      freeOnly,
      transportation: transportation || undefined,
      childrenOrFamily,
      asSoonAsPossible,
      noAppointment,
    })
  }

  return (
    <form onSubmit={submit} className="panel p-5 sm:p-7" noValidate>
      <fieldset>
        <legend className="font-serif text-2xl text-forest">{t('form.needLegend')}</legend>
        <p className="note mb-3">{t('form.needHint')}</p>
        <CategoryChoices selected={selected} onToggle={toggle} />
      </fieldset>

      <fieldset className="mt-8 border-t border-line pt-6">
        <legend className="font-medium text-charcoal">{t('form.considerLegend')}</legend>
        <p className="note mb-4">{t('form.considerHint')}</p>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('form.transportation')}</p>
            {TRANSPORTATION_OPTIONS.map((option) => (
              <label key={option.labelKey} className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="transportation"
                  value={option.value}
                  checked={transportation === option.value}
                  onChange={() => setTransportation(option.value)}
                  className="mt-1"
                />
                <span>{t(option.labelKey)}</span>
              </label>
            ))}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('form.cost')}</p>
              <label className="flex items-start gap-2 text-sm">
                <input type="radio" name="cost" checked={!freeOnly} onChange={() => setFreeOnly(false)} className="mt-1" />
                <span>{t('form.costAny')}</span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input type="radio" name="cost" checked={freeOnly} onChange={() => setFreeOnly(true)} className="mt-1" />
                <span>{t('form.costFree')}</span>
              </label>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('form.other')}</p>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={childrenOrFamily} onChange={(event) => setChildrenOrFamily(event.target.checked)} className="mt-1" />
                <span>{t('form.family')}</span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={asSoonAsPossible} onChange={(event) => setAsSoonAsPossible(event.target.checked)} className="mt-1" />
                <span>{t('form.asap')}</span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={noAppointment} onChange={(event) => setNoAppointment(event.target.checked)} className="mt-1" />
                <span>{t('form.noAppointment')}</span>
              </label>
            </div>
          </div>
        </div>
      </fieldset>

      <div className="mt-8">
        <label htmlFor="location" className="block font-medium mb-2">{t('form.where')}</label>
        <input
          id="location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder={t('form.wherePlaceholder')}
          required
          className="field"
        />
        <p className="note mt-1">{t('form.whereHint')}</p>
      </div>

      <div className="mt-6">
        <label htmlFor="details" className="block font-medium mb-2">{t('form.else')} <span className="font-normal text-muted">{t('form.optional')}</span></label>
        <textarea
          id="details"
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="field"
          rows={3}
          placeholder={t('form.elsePlaceholder')}
        />
      </div>

      {formError && (
        <p role="alert" className="alert mt-4">{formError}</p>
      )}

      <div className="mt-6 flex justify-end">
        <button type="submit" disabled={loading} className="btn">
          {loading ? t('form.submitting') : t('form.submit')}
          {loading ? null : <ArrowRight className="h-4 w-4" aria-hidden />}
        </button>
      </div>
    </form>
  )
}
