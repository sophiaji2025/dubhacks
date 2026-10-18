import Link from 'next/link'
import { useRouter } from 'next/router'
import LanguageSwitcher from './LanguageSwitcher'
import { useLanguage } from './LanguageProvider'

const LINKS = [
  { href: '/', key: 'nav.findHelp' as const },
  { href: '/submit', key: 'nav.submit' as const },
  { href: '/admin', key: 'nav.admin' as const },
]

export default function SiteHeader() {
  const { pathname } = useRouter()
  const { t } = useLanguage()

  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-cream/90 backdrop-blur-md">
      <div className="h-1.5 bg-gradient-to-r from-forest via-leaf to-terracotta" />
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12 xl:px-16">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-leaf">{t('nav.kicker')}</p>
          <h1 className="font-serif text-3xl leading-none text-forest sm:text-4xl">
            <Link href="/">NeighborAid</Link>
          </h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {LINKS.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={active
                    ? 'rounded-full bg-forest px-3 py-1.5 font-medium text-white'
                    : 'rounded-full px-3 py-1.5 text-charcoal hover:bg-sage hover:text-forest'}
                >
                  {t(link.key)}
                </Link>
              )
            })}
          </nav>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}
