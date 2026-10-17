import type { ReactNode } from 'react'

type ResourceView = {
  id: string
  name: string
  description: string | null
  category: string | null
  cost: string | null
  address: string | null
  city: string | null
  service_area: string | null
  zip_codes: string[] | null
  eligibility: string | null
  contact: string | null
  source_url: string | null
  application_instructions: string | null
  last_verified: string | null
}

export type ResourceMatchView = {
  resource: ResourceView
  reasons: string[]
}

function known(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function Unknown() {
  return <span className="text-gray-500">Unknown</span>
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="inline font-medium text-gray-800">{label}: </dt>
      <dd className="inline">{children}</dd>
    </div>
  )
}

function placeLine(resource: ResourceView): string | null {
  const parts: string[] = []
  if (known(resource.address)) parts.push(resource.address.trim())
  if (known(resource.service_area)) parts.push(resource.service_area.trim())
  else if (known(resource.city)) {
    const address = resource.address?.toLowerCase() ?? ''
    if (!address.includes(resource.city.toLowerCase())) parts.push(resource.city.trim())
  }
  if (resource.zip_codes && resource.zip_codes.length > 0) {
    parts.push(`ZIP codes ${resource.zip_codes.join(', ')}`)
  }
  return parts.length > 0 ? parts.join(' · ') : null
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

function OfficialLink({ href }: { href: string | null }) {
  if (!known(href) || !isHttpUrl(href)) return <Unknown />
  const url = href.trim()
  return (
    <a className="text-blue-700 underline" href={url} target="_blank" rel="noopener noreferrer">
      Open official website
    </a>
  )
}

function SourceLink({ href }: { href: string | null }) {
  if (!known(href) || !isHttpUrl(href)) return <Unknown />
  const url = href.trim()
  return (
    <a className="text-blue-700 underline break-all" href={url} target="_blank" rel="noopener noreferrer">
      {url}
    </a>
  )
}

function ContactValue({ contact }: { contact: string | null }) {
  if (!known(contact)) return <Unknown />
  const value = contact.trim()
  const phone = value.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
  if (phone) {
    const digits = phone[0].replace(/\D/g, '')
    return <a className="text-blue-700 underline" href={`tel:+1${digits}`}>{value}</a>
  }
  if (value.includes('@')) {
    return <a className="text-blue-700 underline" href={`mailto:${value}`}>{value}</a>
  }
  return <>{value}</>
}

export default function ResourceCard({ match }: { match: ResourceMatchView }) {
  const { resource, reasons } = match
  const place = placeLine(resource)

  return (
    <article className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
        <h3 className="text-lg font-semibold">{resource.name}</h3>
        <span className="text-sm text-gray-600">{known(resource.category) ? resource.category : 'Unknown'}</span>
      </header>
      <p className="mt-2 text-sm text-gray-700">{known(resource.description) ? resource.description : <Unknown />}</p>
      <dl className="mt-3 space-y-1 text-sm text-gray-700">
        <Field label="Cost">{known(resource.cost) ? resource.cost : <Unknown />}</Field>
        <Field label="Address or service area">{place ?? <Unknown />}</Field>
        <Field label="Eligibility">{known(resource.eligibility) ? resource.eligibility : <Unknown />}</Field>
        <Field label="Contact"><ContactValue contact={resource.contact} /></Field>
        <Field label="Official website"><OfficialLink href={resource.source_url} /></Field>
        <Field label="How to apply">{known(resource.application_instructions) ? resource.application_instructions : <Unknown />}</Field>
        <Field label="Source"><SourceLink href={resource.source_url} /></Field>
        <Field label="Last verified">{known(resource.last_verified) ? resource.last_verified : <Unknown />}</Field>
      </dl>
      {reasons.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-gray-800">Why this matched</p>
          <ul className="mt-1 list-disc pl-5 text-sm text-gray-700 space-y-1">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
