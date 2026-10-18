import { ArrowRight } from './Icon'
import { FormEvent, useState } from 'react'
import CategoryChoices from './CategoryChoices'

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

const TRANSPORTATION_OPTIONS = [
  { value: '', label: 'No preference' },
  { value: 'Public transportation or walking', label: 'Public transportation or walking' },
  { value: 'Access to a car', label: 'Access to a car' },
  { value: 'Wheelchair-accessible services', label: 'Wheelchair-accessible services' },
]

type SearchFormProps = {
  loading: boolean
  onSearch: (payload: SearchPayload) => void
}

export default function SearchForm({ loading, onSearch }: SearchFormProps) {
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
      setFormError('Select at least one kind of help.')
      return
    }
    if (!location.trim()) {
      setFormError('Enter a city or ZIP code.')
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
        <legend className="font-serif text-2xl text-forest">What do you need help with?</legend>
        <p className="note mb-3">Choose all that apply.</p>
        <CategoryChoices selected={selected} onToggle={toggle} />
      </fieldset>

      <fieldset className="mt-8 border-t border-line pt-6">
        <legend className="font-medium text-charcoal">What should we consider?</legend>
        <p className="note mb-4">Optional. A preference is used only when a listing records that fact.</p>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Transportation</p>
            {TRANSPORTATION_OPTIONS.map((option) => (
              <label key={option.label} className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="transportation"
                  value={option.value}
                  checked={transportation === option.value}
                  onChange={() => setTransportation(option.value)}
                  className="mt-1"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Cost</p>
              <label className="flex items-start gap-2 text-sm">
                <input type="radio" name="cost" checked={!freeOnly} onChange={() => setFreeOnly(false)} className="mt-1" />
                <span>Include free and discounted services</span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input type="radio" name="cost" checked={freeOnly} onChange={() => setFreeOnly(true)} className="mt-1" />
                <span>Only completely free services</span>
              </label>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Other circumstances</p>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={childrenOrFamily} onChange={(event) => setChildrenOrFamily(event.target.checked)} className="mt-1" />
                <span>Looking for help for children or family</span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={asSoonAsPossible} onChange={(event) => setAsSoonAsPossible(event.target.checked)} className="mt-1" />
                <span>Need assistance as soon as possible</span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={noAppointment} onChange={(event) => setNoAppointment(event.target.checked)} className="mt-1" />
                <span>Prefer services that do not require an appointment</span>
              </label>
            </div>
          </div>
        </div>
      </fieldset>

      <div className="mt-8">
        <label htmlFor="location" className="block font-medium mb-2">Where do you need help?</label>
        <input
          id="location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Seattle or 98105"
          required
          className="field"
        />
        <p className="note mt-1">City or ZIP code. A street address is not required.</p>
      </div>

      <div className="mt-6">
        <label htmlFor="details" className="block font-medium mb-2">Anything else? <span className="font-normal text-muted">(optional)</span></label>
        <textarea
          id="details"
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="field"
          rows={3}
          placeholder="Example: I recently lost my job and have two children."
        />
      </div>

      {formError && (
        <p role="alert" className="alert mt-4">{formError}</p>
      )}

      <div className="mt-6 flex justify-end">
        <button type="submit" disabled={loading} className="btn">
          {loading ? 'Finding resources…' : 'Find local resources'}
          {loading ? null : <ArrowRight className="h-4 w-4" aria-hidden />}
        </button>
      </div>
    </form>
  )
}
