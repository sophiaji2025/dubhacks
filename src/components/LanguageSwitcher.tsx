import { LANGUAGES, type LanguageCode } from '../lib/i18n'
import { useLanguage } from './LanguageProvider'

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <label className="flex items-center gap-2 text-sm text-charcoal">
      <span className="text-[11px] uppercase tracking-[0.14em] text-leaf">{t('language.label')}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as LanguageCode)}
        className="rounded-full border border-line bg-white px-3 py-1.5 text-sm text-charcoal focus:border-forest focus:outline-none"
        aria-label={t('language.label')}
      >
        {LANGUAGES.map((item) => (
          <option key={item.code} value={item.code} lang={item.code}>
            {item.nativeName}
          </option>
        ))}
      </select>
    </label>
  )
}
