import Head from 'next/head'
import { FormEvent, useState } from 'react'
import CategoryChoices from '../components/CategoryChoices'
import SiteHeader from '../components/SiteHeader'

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
      <SiteHeader />

      <p className="text-[11px] uppercase tracking-[0.16em] text-terracotta">For organizations</p>
      <h2 className="mt-2 font-serif text-4xl text-forest">Submit a resource</h2>
      <p className="note mt-3 max-w-xl">
        Send a program for review. It stays out of public search until an administrator approves it.
      </p>

      {received ? (
        <div className="panel mt-6 p-5" role="status">
          <h3 className="font-serif text-2xl text-forest">Submission received</h3>
          <p className="mt-2 text-sm text-charcoal">
            It is pending review and will not appear in search until an administrator approves it.
          </p>
          <button
            type="button"
            className="link mt-4 text-sm"
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
        <form onSubmit={submit} className="panel mt-6 p-4 sm:p-6" noValidate>
          <div className="space-y-4">
            <TextField label="Organization name" name="organizationName" value={fields.organizationName} onChange={setField} required />
            <TextField label="Program name" name="resourceName" value={fields.resourceName} onChange={setField} required />
            <TextArea label="Description" name="description" value={fields.description} onChange={setField} required rows={4} />

            <fieldset>
              <legend className="block font-medium mb-2">Categories</legend>
              <p className="note mb-3">
                Select every area that fits. Public search uses one category, and the first one you select is the one that will be published.
              </p>
              <CategoryChoices selected={categories} onToggle={toggleCategory} />
            </fieldset>

            <TextField
              label="Cost"
              name="cost"
              value={fields.cost}
              onChange={setField}
              required
              placeholder="Free, discounted, or Unknown"
            />
            <p className="note -mt-2">Write Unknown if the cost is not stated. A blank cost is not treated as free.</p>

            <div>
              <p className="font-medium mb-2">Location or service area</p>
              <div className="space-y-3">
                <TextField label="City" name="city" value={fields.city} onChange={setField} />
                <TextField label="Service area" name="serviceArea" value={fields.serviceArea} onChange={setField} placeholder="North Seattle" />
                <TextField label="ZIP codes" name="zipCodes" value={fields.zipCodes} onChange={setField} placeholder="98103, 98105" />
                <TextField label="Street address" name="address" value={fields.address} onChange={setField} />
              </div>
              <p className="note mt-2">Enter a city, a service area, or at least one 5-digit ZIP code. A street address alone is not enough.</p>
            </div>

            <TextArea
              label="Eligibility, if known"
              name="eligibility"
              value={fields.eligibility}
              onChange={setField}
              rows={3}
            />
            <p className="note -mt-2">Leave this blank when you do not know. Do not guess who qualifies.</p>
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
            <p className="note -mt-2">This email is kept with the review. It is not published on the resource.</p>
          </div>

          {error && (
            <div role="alert" className="alert mt-4">
              <p>{error}</p>
              {details.length > 0 && (
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  {details.map((detail) => <li key={detail}>{detail}</li>)}
                </ul>
              )}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={loading} className="btn">
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
        {label}{required ? <span className="font-normal text-muted"> (required)</span> : null}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
        className="field"
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
        {label}{required ? <span className="font-normal text-muted"> (required)</span> : null}
      </label>
      <textarea
        id={id}
        value={value}
        rows={rows}
        onChange={(event) => onChange(name, event.target.value)}
        className="field"
      />
    </div>
  )
}
