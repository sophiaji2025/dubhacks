import Link from 'next/link'
import { useRouter } from 'next/router'

const LINKS = [
  { href: '/', label: 'Find help' },
  { href: '/submit', label: 'Submit a resource' },
  { href: '/admin', label: 'Review submissions' },
]

export default function SiteHeader() {
  const { pathname } = useRouter()

  return (
    <header className="mb-8 border-b border-line pb-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-leaf">Seattle</p>
          <h1 className="font-serif text-4xl leading-none text-forest">
            <Link href="/">NeighborAid</Link>
          </h1>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {LINKS.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={active ? 'font-medium text-forest' : 'text-charcoal hover:text-forest'}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
