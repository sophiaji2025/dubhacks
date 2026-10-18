export const LANGUAGE_CODES = ['en', 'es', 'zh', 'vi', 'so', 'ko', 'am', 'tl'] as const

export type LanguageCode = (typeof LANGUAGE_CODES)[number]

export const LANGUAGES: { code: LanguageCode; nativeName: string; englishName: string }[] = [
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'es', nativeName: 'Español', englishName: 'Spanish' },
  { code: 'zh', nativeName: '中文', englishName: 'Chinese' },
  { code: 'vi', nativeName: 'Tiếng Việt', englishName: 'Vietnamese' },
  { code: 'so', nativeName: 'Soomaali', englishName: 'Somali' },
  { code: 'ko', nativeName: '한국어', englishName: 'Korean' },
  { code: 'am', nativeName: 'አማርኛ', englishName: 'Amharic' },
  { code: 'tl', nativeName: 'Tagalog', englishName: 'Tagalog' },
]

export const LANGUAGE_STORAGE_KEY = 'neighboraid-language'

export function isLanguageCode(value: string | null | undefined): value is LanguageCode {
  return typeof value === 'string' && (LANGUAGE_CODES as readonly string[]).includes(value)
}

export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) => (
    vars[key] === undefined ? `{${key}}` : String(vars[key])
  ))
}
