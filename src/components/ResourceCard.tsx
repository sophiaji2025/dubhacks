import type { RankedMatch } from '../lib/matching'

function displayValue(value: string | null | undefined): string {
  return value && value.trim() ? value : 'Unknown'
}

export default function ResourceCard({ match }: { match: RankedMatch }) {
  const { resource, score, reasons } = match
  const sourceHref = resource.source_url && /^https?:\/\//i.test(resource.source_url)
    ? resource.source_url
    : null

  return (
    <article className="p-5 bg-white rounded-lg shadow-sm border border-gray-200">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
        <div>
          <h3 className="text-lg font-semibold">{resource.name}</h3>
          <p className="text-sm text-gray-600">{displayValue(resource.category)}</p>
        </div>
        <p className="text-xs text-gray-500 sm:text-right">
          Relevance {score}
          <span className="block">Based on listed fields only</span>
        </p>
      </header>

      <p className="mt-3 text-sm text-gray-700">{displayValue(resource.description)}</p>

      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
        <div><dt className="font-medium text-gray-900">Cost</dt><dd>{displayValue(resource.cost)}</dd></div>
        <div><dt className="font-medium text-gray-900">City / service area</dt><dd>{displayValue(resource.city)}</dd></div>
        <div><dt className="font-medium text-gray-900">Address</dt><dd>{displayValue(resource.address)}</dd></div>
        <div><dt className="font-medium text-gray-900">Contact</dt><dd>{displayValue(resource.contact)}</dd></div>
        <div className="sm:col-span-2">
          <dt className="font-medium text-gray-900">Eligibility notes</dt>
          <dd>{displayValue(resource.eligibility)}. This is not a decision that you qualify.</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-900">Last verified</dt>
          <dd>{displayValue(resource.last_verified)}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-900">Source</dt>
          <dd>
            {sourceHref ? (
              <a className="text-blue-700 underline" href={sourceHref} target="_blank" rel="noreferrer">
                Official site
              </a>
            ) : (
              'Unknown'
            )}
          </dd>
        </div>
      </dl>

      {reasons.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium">Why this was listed</h4>
          <ul className="mt-1 list-disc pl-5 text-sm text-gray-600 space-y-1">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
