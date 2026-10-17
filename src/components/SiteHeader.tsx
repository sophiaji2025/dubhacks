import Link from 'next/link'
import type { ReactNode } from 'react'

export default function SiteHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        <h1 className="text-3xl font-bold">
          <Link href="/">NeighborAid</Link>
        </h1>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link href="/" className="text-blue-700 underline">Find help</Link>
          <Link href="/submit" className="text-blue-700 underline">Submit a resource</Link>
          <Link href="/admin" className="text-blue-700 underline">Review submissions</Link>
        </nav>
      </div>
      {children}
    </header>
  )
}
