import Head from 'next/head'
import { FormEvent, useState, type ReactNode } from 'react'
import { useLanguage } from '../components/LanguageProvider'
import PageShell from '../components/PageShell'

type SubmissionPayload = {
  organization_name?: string
  resource_name?: string
  description?: string
  category?: string
  categories?: string[]
  cost?: string
  city?: string | null
  service_area?: string | null
  zip_codes?: string[] | null
  address?: string | null
  eligibility?: string | null
  contact?: string
  source_url?: string
  application_instructions?: string | null
  submitter_email?: string | null
}

type SubmissionRow = {
  id: string
  organization_name?: string | null
  resource_name?: string | null
  payload?: SubmissionPayload | null
  status?: string
  created_at?: string
}

export default function AdminPage() {
  const { t } = useLanguage()
  const [adminKey, setAdminKey] = useState('')
  const [rows, setRows] = useState<SubmissionRow[] | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!adminKey.trim()) {
      setError(t('admin.needKey'))
      return
    }
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch('/api/admin/submissions', {
        headers: { 'x-admin-key': adminKey.trim() },
      })
      const data = await response.json().catch(() => null) as { error?: string; data?: SubmissionRow[] } | null
      if (!response.ok) throw new Error(data?.error || t('admin.loadFailed'))
      setRows(Array.isArray(data?.data) ? data.data : [])
    } catch (err) {
      setRows(null)
      setError(err instanceof Error ? err.message : t('admin.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const review = async (id: string, action: 'approve' | 'reject') => {
    setBusyId(id)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey.trim(),
        },
        body: JSON.stringify({ id, action, reviewer_notes: notes[id] || '' }),
      })
      const data = await response.json().catch(() => null) as { error?: string; message?: string } | null
      if (!response.ok) throw new Error(data?.error || t('admin.updateFailed'))
      setRows((current) => current?.filter((row) => row.id !== id) ?? null)
      setNotice(data?.message || (action === 'approve'
        ? t('admin.approved')
        : t('admin.rejected')))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.updateFailed'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <PageShell>
      <Head>
        <title>{t('admin.metaTitle')}</title>
      </Head>

      <p className="text-[11px] uppercase tracking-[0.16em] text-terracotta">{t('admin.kicker')}</p>
      <h2 className="mt-2 font-serif text-4xl text-forest sm:text-5xl">{t('admin.title')}</h2>
      <p className="note mt-3 max-w-2xl">
        {t('admin.intro')}
      </p>

      <form onSubmit={load} className="panel mt-6 p-4 sm:p-6">
        <label htmlFor="admin-key" className="block font-medium mb-1">{t('admin.key')}</label>
        <input
          id="admin-key"
          type="password"
          value={adminKey}
          onChange={(event) => setAdminKey(event.target.value)}
          autoComplete="current-password"
          className="field"
        />
        <p className="note mt-1">{t('admin.keyHint')}</p>
        <div className="mt-4 flex justify-end">
          <button type="submit" disabled={loading} className="btn">
            {loading ? t('admin.loading') : t('admin.load')}
          </button>
        </div>
      </form>

      <section className="mt-6" aria-live="polite">
        {error && (
          <p role="alert" className="alert">{error}</p>
        )}
        {notice && (
          <p role="status" className="panel mt-3 p-3 text-sm text-charcoal">{notice}</p>
        )}

        {rows && rows.length === 0 && (
          <p className="note mt-4">{t('admin.empty')}</p>
        )}

        {rows && rows.length > 0 && (
          <div className="mt-4 space-y-4">
            <h3 className="font-serif text-2xl text-forest">{t('admin.pending', { count: rows.length })}</h3>
            {rows.map((row) => (
              <article key={row.id} className="panel p-5 lg:p-6">
                <p className="text-sm text-muted">{text(row.payload?.category) || t('card.categoryUnknown')}</p>
                <h3 className="mt-1 font-serif text-2xl text-forest">{text(row.resource_name) || text(row.payload?.resource_name) || t('submit.program')}</h3>
                <p className="mt-1 text-sm text-charcoal">{text(row.organization_name) || text(row.payload?.organization_name) || t('submit.org')}</p>
                <dl className="mt-3 space-y-1 text-sm text-charcoal">
                  <Field label={t('submit.description')}>{text(row.payload?.description) || t('card.unknown')}</Field>
                  <Field label={t('submit.categories')}>{categoryLine(row.payload, t('card.unknown'))}</Field>
                  <Field label={t('card.cost')}>{text(row.payload?.cost) || t('card.unknown')}</Field>
                  <Field label={t('submit.location')}>{locationLine(row.payload, t('card.unknown'), t('submit.zips'))}</Field>
                  <Field label={t('card.eligibility')}>{text(row.payload?.eligibility) || t('card.unknown')}</Field>
                  <Field label={t('card.contact')}>{text(row.payload?.contact) || t('card.unknown')}</Field>
                  <Field label={t('card.source')}><SourceLink href={row.payload?.source_url} unknown={t('card.unknown')} /></Field>
                  <Field label={t('card.apply')}>{text(row.payload?.application_instructions) || t('card.unknown')}</Field>
                  <Field label={t('submit.email')}>{text(row.payload?.submitter_email) || t('card.unknown')}</Field>
                  <Field label={t('card.verified')}>{formatWhen(row.created_at, t('card.unknown'))}</Field>
                </dl>
                <label htmlFor={`notes-${row.id}`} className="block mt-4 text-sm font-medium">{t('admin.notes')}</label>
                <textarea
                  id={`notes-${row.id}`}
                  value={notes[row.id] || ''}
                  onChange={(event) => setNotes((current) => ({ ...current, [row.id]: event.target.value }))}
                  rows={3}
                  className="field mt-1 text-sm"
                />
                <div className="mt-3 flex flex-wrap gap-2 justify-end">
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => review(row.id, 'reject')}
                    className="btn-quiet text-sm"
                  >
                    {t('admin.reject')}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => review(row.id, 'approve')}
                    className="btn text-sm"
                  >
                    {busyId === row.id ? t('admin.saving') : t('admin.approve')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="inline font-medium text-charcoal">{label}: </dt>
      <dd className="inline">{children}</dd>
    </div>
  )
}

function text(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

function categoryLine(payload: SubmissionPayload | null | undefined, unknown: string): string {
  const categories = payload?.categories?.filter((item) => typeof item === 'string' && item.trim())
  if (categories && categories.length > 0) return categories.join(', ')
  return text(payload?.category) || unknown
}

function locationLine(payload: SubmissionPayload | null | undefined, unknown: string, zipsLabel: string): string {
  const parts = [
    text(payload?.address),
    text(payload?.service_area),
    text(payload?.city),
    payload?.zip_codes && payload.zip_codes.length > 0 ? `${zipsLabel} ${payload.zip_codes.join(', ')}` : '',
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : unknown
}

function formatWhen(value: string | undefined, unknown: string): string {
  if (!value) return unknown
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) return value
  return new Date(timestamp).toLocaleString()
}

function SourceLink({ href, unknown }: { href: string | null | undefined; unknown: string }) {
  const url = text(href)
  if (!/^https?:\/\//i.test(url)) return <>{unknown}</>
  return (
    <a className="link break-all" href={url} target="_blank" rel="noopener noreferrer">
      {url}
    </a>
  )
}
