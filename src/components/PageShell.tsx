import type { ReactNode } from 'react'
import SiteHeader from './SiteHeader'

export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="page-backdrop" aria-hidden />
      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 sm:px-8 lg:px-12 xl:px-16 xl:py-10">
          {children}
        </main>
      </div>
    </div>
  )
}
