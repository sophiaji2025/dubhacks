import { FormEvent, useState } from 'react'
import { RESOURCE_CATEGORIES } from '../lib/categories'

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
    <form onSubmit={submit} className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-200" noValidate>
      <fieldset>
        <legend className="block font-medium mb-2">What do you need help with?</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RESOURCE_CATEGORIES.map((category) => {
            const active = selected.includes(category)
            return (
              <button
                type="button"
                key={category}
                onClick={() => toggle(category)}
                aria-pressed={active}
                className={`text-left p-2 border rounded ${active ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-200'}`}
              >
                {category}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="block font-medium mb-2">What should we consider?</legend>
        <p className="text-sm text-gray-600 mb-3">Optional. A preference is used only when a listing records that fact.</p>

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

        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">Cost</p>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="cost"
              checked={!freeOnly}
              onChange={() => setFreeOnly(false)}
              className="mt-1"
            />
            <span>Include free and discounted services</span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="cost"
              checked={freeOnly}
              onChange={() => setFreeOnly(true)}
              className="mt-1"
            />
            <span>Only completely free services</span>
          </label>
        </div>

        <div className="mt-4 space-y-2">
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
      </fieldset>

      <div className="mt-5">
        <label htmlFor="location" className="block font-medium mb-2">Where do you need help?</label>
        <input
          id="location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Seattle or 98105"
          required
          className="w-full border border-gray-300 p-2 rounded"
        />
        <p className="mt-1 text-sm text-gray-600">City or ZIP code. A street address is not required.</p>
      </div>

      <div className="mt-4">
        <label htmlFor="details" className="block font-medium mb-2">Anything else? (optional)</label>
        <textarea
          id="details"
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="w-full border border-gray-300 p-2 rounded"
          rows={3}
          placeholder="Example: I recently lost my job and have two children."
        />
      </div>

      {formError && (
        <p role="alert" className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">{formError}</p>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>
    </form>
  )
}
