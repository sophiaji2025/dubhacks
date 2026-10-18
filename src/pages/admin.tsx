import Head from 'next/head'
import { FormEvent, useState, type ReactNode } from 'react'
import SiteHeader from '../components/SiteHeader'

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
      setError('Enter the admin key.')
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
      if (!response.ok) throw new Error(data?.error || 'Could not load submissions.')
      setRows(Array.isArray(data?.data) ? data.data : [])
    } catch (err) {
      setRows(null)
      setError(err instanceof Error ? err.message : 'Could not load submissions.')
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
      if (!response.ok) throw new Error(data?.error || 'Could not update the submission.')
      setRows((current) => current?.filter((row) => row.id !== id) ?? null)
      setNotice(data?.message || (action === 'approve'
        ? 'Submission approved. The listing can appear in search.'
        : 'Submission rejected. It will not appear in search.'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the submission.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 max-w-3xl mx-auto">
      <Head>
        <title>Review submissions — NeighborAid</title>
      </Head>
      <SiteHeader />

      <p className="text-[11px] uppercase tracking-[0.16em] text-terracotta">For reviewers</p>
      <h2 className="mt-2 font-serif text-4xl text-forest">Review submissions</h2>
      <p className="note mt-3 max-w-xl">
        Pending submissions stay out of public search. Approving one publishes it. Rejecting one leaves it unpublished.
      </p>

      <form onSubmit={load} className="panel mt-6 p-4 sm:p-6">
        <label htmlFor="admin-key" className="block font-medium mb-1">Admin key</label>
        <input
          id="admin-key"
          type="password"
          value={adminKey}
          onChange={(event) => setAdminKey(event.target.value)}
          autoComplete="current-password"
          className="field"
        />
        <p className="note mt-1">The key is sent with each request and is not saved in the page.</p>
        <div className="mt-4 flex justify-end">
          <button type="submit" disabled={loading} className="btn">
            {loading ? 'Loading…' : 'Load pending submissions'}
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
          <p className="note mt-4">No submissions are waiting for review.</p>
        )}

        {rows && rows.length > 0 && (
          <div className="mt-4 space-y-4">
            <h3 className="font-serif text-2xl text-forest">{rows.length} pending</h3>
            {rows.map((row) => (
              <article key={row.id} className="panel p-5">
                <p className="text-sm text-muted">{text(row.payload?.category) || 'Unknown category'}</p>
                <h3 className="mt-1 font-serif text-2xl text-forest">{text(row.resource_name) || text(row.payload?.resource_name) || 'Untitled program'}</h3>
                <p className="mt-1 text-sm text-charcoal">{text(row.organization_name) || text(row.payload?.organization_name) || 'Unknown organization'}</p>
                <dl className="mt-3 space-y-1 text-sm text-charcoal">
                  <Field label="Description">{text(row.payload?.description) || 'Unknown'}</Field>
                  <Field label="Categories">{categoryLine(row.payload)}</Field>
                  <Field label="Cost">{text(row.payload?.cost) || 'Unknown'}</Field>
                  <Field label="Location">{locationLine(row.payload)}</Field>
                  <Field label="Eligibility">{text(row.payload?.eligibility) || 'Unknown'}</Field>
                  <Field label="Contact">{text(row.payload?.contact) || 'Unknown'}</Field>
                  <Field label="Source"><SourceLink href={row.payload?.source_url} /></Field>
                  <Field label="How to apply">{text(row.payload?.application_instructions) || 'Unknown'}</Field>
                  <Field label="Submitter email">{text(row.payload?.submitter_email) || 'Unknown'}</Field>
                  <Field label="Submitted">{formatWhen(row.created_at)}</Field>
                </dl>
                <label htmlFor={`notes-${row.id}`} className="block mt-4 text-sm font-medium">Review notes</label>
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
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => review(row.id, 'approve')}
                    className="btn text-sm"
                  >
                    {busyId === row.id ? 'Saving…' : 'Approve and publish'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
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

function categoryLine(payload: SubmissionPayload | null | undefined): string {
  const categories = payload?.categories?.filter((item) => typeof item === 'string' && item.trim())
  if (categories && categories.length > 0) return categories.join(', ')
  return text(payload?.category) || 'Unknown'
}

function locationLine(payload: SubmissionPayload | null | undefined): string {
  const parts = [
    text(payload?.address),
    text(payload?.service_area),
    text(payload?.city),
    payload?.zip_codes && payload.zip_codes.length > 0 ? `ZIP codes ${payload.zip_codes.join(', ')}` : '',
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : 'Unknown'
}

function formatWhen(value: string | undefined): string {
  if (!value) return 'Unknown'
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) return value
  return new Date(timestamp).toLocaleString()
}

function SourceLink({ href }: { href: string | null | undefined }) {
  const url = text(href)
  if (!/^https?:\/\//i.test(url)) return <>Unknown</>
  return (
    <a className="link break-all" href={url} target="_blank" rel="noopener noreferrer">
      {url}
    </a>
  )
}
