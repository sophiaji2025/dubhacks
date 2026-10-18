import type { ReactNode } from 'react'
import CategoryIcon from './CategoryIcon'

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
  return <span className="text-muted">Unknown</span>
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="inline font-medium text-charcoal">{label}: </dt>
      <dd className="inline">{children}</dd>
    </div>
  )
}

function placeLine(resource: ResourceView): string | null {
  const parts: string[] = []
  if (known(resource.service_area)) parts.push(resource.service_area.trim())
  else if (known(resource.city)) parts.push(resource.city.trim())
  if (known(resource.address)) parts.push(resource.address.trim())
  if (resource.zip_codes && resource.zip_codes.length > 0) {
    parts.push(`ZIPs ${resource.zip_codes.join(', ')}`)
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
    <a className="link" href={url} target="_blank" rel="noopener noreferrer">
      Official website
    </a>
  )
}

function SourceLink({ href }: { href: string | null }) {
  if (!known(href) || !isHttpUrl(href)) return <Unknown />
  const url = href.trim()
  return (
    <a className="link break-all" href={url} target="_blank" rel="noopener noreferrer">
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
    return <a className="link" href={`tel:+1${digits}`}>{value}</a>
  }
  if (value.includes('@')) {
    return <a className="link" href={`mailto:${value}`}>{value}</a>
  }
  return <>{value}</>
}

export default function ResourceCard({
  match,
  pinNumber,
  distanceLabel,
  selected = false,
  onShowOnMap,
}: {
  match: ResourceMatchView
  pinNumber?: number
  distanceLabel?: string | null
  selected?: boolean
  onShowOnMap?: () => void
}) {
  const { resource, reasons } = match
  const place = placeLine(resource)
  const category = known(resource.category) ? resource.category : null

  return (
    <article
      id={`resource-${resource.id}`}
      tabIndex={-1}
      className={`panel scroll-mt-4 overflow-hidden p-5 outline-none transition-shadow hover:shadow-[0_16px_40px_rgba(36,92,74,0.1)] ${selected ? 'ring-2 ring-terracotta' : ''}`}
    >
      <div className="mb-4 h-1 w-16 rounded-full bg-terracotta/80" />
      <p className="flex items-center gap-2 text-sm text-muted">
        {pinNumber ? (
          <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${selected ? 'bg-terracotta' : 'bg-forest'}`} aria-hidden>
            {pinNumber}
          </span>
        ) : null}
        {category ? <CategoryIcon category={category} className="h-4 w-4 text-leaf" /> : null}
        <span>{category ?? 'Category unknown'}{place ? ` · ${place}` : ''}</span>
      </p>
      <h3 className="mt-1 font-serif text-2xl text-forest">{resource.name}</h3>
      {distanceLabel && <p className="note mt-1">{distanceLabel}.</p>}
      <p className="mt-3 text-sm text-charcoal">
        <span className="font-medium">Cost: </span>
        {known(resource.cost) ? resource.cost : <Unknown />}
      </p>
      <p className="mt-3 text-sm leading-6 text-charcoal">
        {known(resource.description) ? resource.description : <Unknown />}
      </p>
      <dl className="mt-4 space-y-1 text-sm text-charcoal">
        <Field label="Eligibility">{known(resource.eligibility) ? resource.eligibility : <Unknown />}</Field>
        <Field label="Contact"><ContactValue contact={resource.contact} /></Field>
        <Field label="How to apply">{known(resource.application_instructions) ? resource.application_instructions : <Unknown />}</Field>
        <Field label="Official website"><OfficialLink href={resource.source_url} /></Field>
        <Field label="Source"><SourceLink href={resource.source_url} /></Field>
        <Field label="Last verified">{known(resource.last_verified) ? resource.last_verified : <Unknown />}</Field>
      </dl>
      {onShowOnMap && (
        <button type="button" className="link mt-4 text-sm" onClick={onShowOnMap}>
          {selected ? 'Showing on map' : 'Show on map'}
        </button>
      )}
      {reasons.length > 0 && (
        <div className="mt-4 rounded-md bg-sage px-3 py-3">
          <p className="text-sm font-medium text-forest">Why this may help</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-charcoal">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
