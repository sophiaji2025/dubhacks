import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isLanguageCode, LANGUAGE_STORAGE_KEY, type LanguageCode } from '../lib/i18n'
import { translate, type MessageKey } from '../lib/messages'

type TranslateFn = (key: MessageKey, vars?: Record<string, string | number>) => string

type LanguageContextValue = {
  language: LanguageCode
  setLanguage: (language: LanguageCode) => void
  t: TranslateFn
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en')

  useEffect(() => {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (isLanguageCode(stored)) setLanguageState(stored)
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: (next) => {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next)
      setLanguageState(next)
    },
    t: (key, vars) => translate(language, key, vars),
  }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
