import Head from 'next/head'
import { FormEvent, useState } from 'react'
import CategoryChoices from '../components/CategoryChoices'
import { useLanguage } from '../components/LanguageProvider'
import PageShell from '../components/PageShell'

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
  const { t } = useLanguage()
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
        setError(data?.error || t('submit.failed'))
        setDetails(Array.isArray(data?.details) ? data.details : [])
        return
      }
      setReceived(true)
    } catch {
      setError(t('submit.failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell>
      <Head>
        <title>{t('submit.metaTitle')}</title>
      </Head>

      <div className="max-w-5xl">
      <p className="text-[11px] uppercase tracking-[0.16em] text-terracotta">{t('submit.kicker')}</p>
      <h2 className="mt-2 font-serif text-4xl text-forest sm:text-5xl">{t('submit.title')}</h2>
      <p className="note mt-3 max-w-2xl">
        {t('submit.intro')}
      </p>

      {received ? (
        <div className="panel mt-6 p-5" role="status">
          <h3 className="font-serif text-2xl text-forest">{t('submit.receivedTitle')}</h3>
          <p className="mt-2 text-sm text-charcoal">
            {t('submit.receivedBody')}
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
            {t('submit.another')}
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="panel mt-6 p-4 sm:p-6" noValidate>
          <div className="space-y-4">
            <TextField label={t('submit.org')} name="organizationName" value={fields.organizationName} onChange={setField} required requiredLabel={t('submit.required')} />
            <TextField label={t('submit.program')} name="resourceName" value={fields.resourceName} onChange={setField} required requiredLabel={t('submit.required')} />
            <TextArea label={t('submit.description')} name="description" value={fields.description} onChange={setField} required rows={4} requiredLabel={t('submit.required')} />

            <fieldset>
              <legend className="block font-medium mb-2">{t('submit.categories')}</legend>
              <p className="note mb-3">
                {t('submit.categoriesHint')}
              </p>
              <CategoryChoices selected={categories} onToggle={toggleCategory} />
            </fieldset>

            <TextField
              label={t('submit.cost')}
              name="cost"
              value={fields.cost}
              onChange={setField}
              required
              requiredLabel={t('submit.required')}
              placeholder={t('submit.costPlaceholder')}
            />
            <p className="note -mt-2">{t('submit.costHint')}</p>

            <div>
              <p className="font-medium mb-2">{t('submit.location')}</p>
              <div className="space-y-3">
                <TextField label={t('submit.city')} name="city" value={fields.city} onChange={setField} />
                <TextField label={t('submit.serviceArea')} name="serviceArea" value={fields.serviceArea} onChange={setField} placeholder="North Seattle" />
                <TextField label={t('submit.zips')} name="zipCodes" value={fields.zipCodes} onChange={setField} placeholder="98103, 98105" />
                <TextField label={t('submit.address')} name="address" value={fields.address} onChange={setField} />
              </div>
              <p className="note mt-2">{t('submit.locationHint')}</p>
            </div>

            <TextArea
              label={t('submit.eligibility')}
              name="eligibility"
              value={fields.eligibility}
              onChange={setField}
              rows={3}
            />
            <p className="note -mt-2">{t('submit.eligibilityHint')}</p>
            <TextField label={t('submit.contact')} name="contact" value={fields.contact} onChange={setField} required requiredLabel={t('submit.required')} placeholder={t('submit.contactPlaceholder')} />
            <TextField label={t('submit.source')} name="sourceUrl" value={fields.sourceUrl} onChange={setField} required requiredLabel={t('submit.required')} placeholder="https://" />
            <TextArea label={t('submit.apply')} name="applicationInstructions" value={fields.applicationInstructions} onChange={setField} rows={3} />
            <TextField
              label={t('submit.email')}
              name="submitterEmail"
              value={fields.submitterEmail}
              onChange={setField}
              placeholder="name@organization.org"
            />
            <p className="note -mt-2">{t('submit.emailHint')}</p>
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
              {loading ? t('submit.sending') : t('submit.send')}
            </button>
          </div>
        </form>
      )}
      </div>
    </PageShell>
  )
}

function TextField({
  label,
  name,
  value,
  onChange,
  required,
  requiredLabel,
  placeholder,
}: {
  label: string
  name: FieldName
  value: string
  onChange: (name: FieldName, value: string) => void
  required?: boolean
  requiredLabel?: string
  placeholder?: string
}) {
  const id = `submit-${name}`
  return (
    <div>
      <label htmlFor={id} className="block font-medium mb-1">
        {label}{required ? <span className="font-normal text-muted"> {requiredLabel || '(required)'}</span> : null}
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
  requiredLabel,
  rows,
}: {
  label: string
  name: FieldName
  value: string
  onChange: (name: FieldName, value: string) => void
  required?: boolean
  requiredLabel?: string
  rows: number
}) {
  const id = `submit-${name}`
  return (
    <div>
      <label htmlFor={id} className="block font-medium mb-1">
        {label}{required ? <span className="font-normal text-muted"> {requiredLabel || '(required)'}</span> : null}
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
