import { useLanguage } from './LanguageProvider'

export default function NextSteps({
  groundedSteps,
  checklist,
  showFallbackNote,
}: {
  groundedSteps: string[] | null
  checklist: string[]
  showFallbackNote: boolean
}) {
  const { t } = useLanguage()
  const written = groundedSteps !== null && groundedSteps.length > 0
  const steps = written ? groundedSteps : checklist
  if (steps.length === 0) return null
  const note = written
    ? t('home.planFromListings')
    : showFallbackNote
      ? t('home.planFallback')
      : ''

  return (
    <div className="mt-8 rounded-2xl border border-line bg-sage/80 p-5 sm:p-6">
      <h3 className="font-serif text-2xl text-forest">{t('home.nextTitle')}</h3>
      {note ? <p className="note mt-2">{note}</p> : null}
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-charcoal">
        {steps.map((step, index) => (
          <li key={`${index}-${step}`}>{step}</li>
        ))}
      </ol>
    </div>
  )
}
