import { FormEvent, useState } from 'react'
import { RESOURCE_CATEGORIES } from '../lib/categories'
import type { SearchPayload } from '../lib/matchClient'

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
  const [formError, setFormError] = useState<string | null>(null)

  const toggle = (category: string) => {
    setSelected((current) => (
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    ))
  }

  const submit = (event: FormEvent) => {
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
    })
  }

  return (
    <form onSubmit={submit} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200" noValidate>
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
                className={`text-left p-3 border rounded-md text-sm ${active ? 'bg-blue-50 border-blue-400 text-blue-900' : 'bg-white border-gray-200 hover:border-gray-400'}`}
              >
                {category}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="mt-5">
        <label htmlFor="location" className="block font-medium mb-2">Where do you need help?</label>
        <input
          id="location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Seattle or 98101"
          autoComplete="postal-code"
          className="w-full border border-gray-300 p-2.5 rounded-md"
        />
        <p className="mt-1 text-xs text-gray-500">City or 5-digit ZIP. An exact street address is not required.</p>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={freeOnly}
            onChange={(event) => setFreeOnly(event.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="font-medium">Only completely free services</span>
            <span className="block text-gray-500">Unknown or discounted cost will be left out.</span>
          </span>
        </label>

        <div>
          <label htmlFor="transportation" className="block font-medium mb-2 text-sm">Transportation</label>
          <select
            id="transportation"
            value={transportation}
            onChange={(event) => setTransportation(event.target.value)}
            className="w-full border border-gray-300 p-2.5 rounded-md bg-white"
          >
            {TRANSPORTATION_OPTIONS.map((option) => (
              <option key={option.value || 'none'} value={option.value}>{option.label}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">Listings do not store transportation access, so this is not used to rank results.</p>
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="details" className="block font-medium mb-2">Anything else? <span className="font-normal text-gray-500">(optional)</span></label>
        <textarea
          id="details"
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="w-full border border-gray-300 p-2.5 rounded-md"
          rows={3}
          maxLength={2000}
          placeholder="Example: I recently lost my job and have two children."
        />
      </div>

      {formError && (
        <p role="alert" className="mt-4 text-sm text-red-700">{formError}</p>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-700 text-white px-4 py-2.5 rounded-md disabled:opacity-60"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>
    </form>
  )
}
