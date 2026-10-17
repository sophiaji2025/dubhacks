import Head from 'next/head'
import { FormEvent, useState } from 'react'
import SiteHeader from '../components/SiteHeader'
import { RESOURCE_CATEGORIES } from '../lib/categories'

type FieldName =
  | 'organizationName'
  | 'resourceName'
  | 'description'
  | 'cost'
  | 'city'
  | 'serviceArea'
  | 'zipCodes'
  | 'address'
  | 'eligibility'
  | 'contact'
  | 'sourceUrl'
  | 'applicationInstructions'
  | 'submitterEmail'

const EMPTY: Record<FieldName, string> = {
  organizationName: '',
  resourceName: '',
  description: '',
  cost: '',
  city: 'Seattle',
  serviceArea: '',
  zipCodes: '',
  address: '',
  eligibility: '',
  contact: '',
  sourceUrl: '',
  applicationInstructions: '',
  submitterEmail: '',
}

export default function SubmitPage() {
  const [fields, setFields] = useState(EMPTY)
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [received, setReceived] = useState(false)

  const setField = (name: FieldName, value: string) => {
    setFields((current) => ({ ...current, [name]: value }))
  }

  const toggleCategory = (category: string) => {
    setCategories((current) => (
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    ))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setDetails([])
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, categories }),
      })
      const data = await response.json().catch(() => null) as { error?: string; details?: string[] } | null
      if (!response.ok) {
        setError(data?.error || 'Submission failed. Try again.')
        setDetails(Array.isArray(data?.details) ? data.details : [])
        return
      }
      setReceived(true)
    } catch {
      setError('Submission failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 max-w-3xl mx-auto">
      <Head>
        <title>Submit a resource — NeighborAid</title>
      </Head>
      <SiteHeader>
        <p className="mt-2 text-sm text-gray-600">
          Organizations can submit a program for review. It stays out of public search until an administrator approves it.
        </p>
      </SiteHeader>

      {received ? (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200" role="status">
          <h2 className="text-xl font-semibold">Submission received</h2>
          <p className="mt-2 text-sm text-gray-700">
            It is pending review and will not appear in search until an administrator approves it.
          </p>
          <button
            type="button"
            className="mt-4 text-sm text-blue-700 underline"
            onClick={() => {
              setReceived(false)
              setFields(EMPTY)
              setCategories([])
            }}
          >
            Submit another resource
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-200" noValidate>
          <h2 className="text-xl font-semibold mb-4">Submit a resource</h2>
          <div className="space-y-4">
            <TextField label="Organization name" name="organizationName" value={fields.organizationName} onChange={setField} required />
            <TextField label="Program name" name="resourceName" value={fields.resourceName} onChange={setField} required />
            <TextArea label="Description" name="description" value={fields.description} onChange={setField} required rows={4} />

            <fieldset>
              <legend className="block font-medium mb-2">Categories</legend>
              <p className="text-sm text-gray-600 mb-2">
                Select every area that fits. Public search uses one category, and the first one you select is the one that will be published.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RESOURCE_CATEGORIES.map((category) => (
                  <label key={category} className="flex items-start gap-2 text-sm border border-gray-200 rounded p-2">
                    <input
                      type="checkbox"
                      checked={categories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      className="mt-1"
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <TextField
              label="Cost"
              name="cost"
              value={fields.cost}
              onChange={setField}
              required
              placeholder="Free, discounted, or Unknown"
            />
            <p className="-mt-2 text-sm text-gray-600">Write Unknown if the cost is not stated. A blank cost is not treated as free.</p>

            <div>
              <p className="font-medium mb-2">Location or service area</p>
              <div className="space-y-3">
                <TextField label="City" name="city" value={fields.city} onChange={setField} />
                <TextField label="Service area" name="serviceArea" value={fields.serviceArea} onChange={setField} placeholder="North Seattle" />
                <TextField label="ZIP codes" name="zipCodes" value={fields.zipCodes} onChange={setField} placeholder="98103, 98105" />
                <TextField label="Street address" name="address" value={fields.address} onChange={setField} />
              </div>
              <p className="mt-2 text-sm text-gray-600">Enter a city, a service area, or at least one 5-digit ZIP code. A street address alone is not enough.</p>
            </div>

            <TextArea
              label="Eligibility, if known"
              name="eligibility"
              value={fields.eligibility}
              onChange={setField}
              rows={3}
            />
            <p className="-mt-2 text-sm text-gray-600">Leave this blank when you do not know. Do not guess who qualifies.</p>
            <TextField label="Contact information" name="contact" value={fields.contact} onChange={setField} required placeholder="Phone, email, or both" />
            <TextField label="Official source URL" name="sourceUrl" value={fields.sourceUrl} onChange={setField} required placeholder="https://" />
            <TextArea label="How to apply, if known" name="applicationInstructions" value={fields.applicationInstructions} onChange={setField} rows={3} />
            <TextField
              label="Your email, if we should follow up"
              name="submitterEmail"
              value={fields.submitterEmail}
              onChange={setField}
              placeholder="name@organization.org"
            />
            <p className="-mt-2 text-sm text-gray-600">This email is kept with the review. It is not published on the resource.</p>
          </div>

          {error && (
            <div role="alert" className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
              <p>{error}</p>
              {details.length > 0 && (
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  {details.map((detail) => <li key={detail}>{detail}</li>)}
                </ul>
              )}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60">
              {loading ? 'Submitting…' : 'Submit for review'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function TextField({
  label,
  name,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string
  name: FieldName
  value: string
  onChange: (name: FieldName, value: string) => void
  required?: boolean
  placeholder?: string
}) {
  const id = `submit-${name}`
  return (
    <div>
      <label htmlFor={id} className="block font-medium mb-1">
        {label}{required ? <span className="text-gray-500 font-normal"> (required)</span> : null}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
        className="w-full border border-gray-300 p-2 rounded"
      />
    </div>
  )
}

function TextArea({
  label,
  name,
  value,
  onChange,
  required,
  rows,
}: {
  label: string
  name: FieldName
  value: string
  onChange: (name: FieldName, value: string) => void
  required?: boolean
  rows: number
}) {
  const id = `submit-${name}`
  return (
    <div>
      <label htmlFor={id} className="block font-medium mb-1">
        {label}{required ? <span className="text-gray-500 font-normal"> (required)</span> : null}
      </label>
      <textarea
        id={id}
        value={value}
        rows={rows}
        onChange={(event) => onChange(name, event.target.value)}
        className="w-full border border-gray-300 p-2 rounded"
      />
    </div>
  )
}
