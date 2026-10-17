import Head from 'next/head'
import SearchForm from '../components/SearchForm'
import ResourceCard from '../components/ResourceCard'

export default function Home() {
  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <Head>
        <title>NeighborAid — Find local help</title>
      </Head>
      <h1 className="text-3xl font-bold mb-4">NeighborAid</h1>
      <p className="mb-6 text-sm text-gray-600">Describe your needs and find local community resources.</p>

      <SearchForm />

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Sample results</h2>
        <div className="space-y-4">
          <ResourceCard />
          <ResourceCard />
        </div>
      </section>
    </div>
  )
}
