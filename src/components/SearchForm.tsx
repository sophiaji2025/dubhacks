import { useState } from 'react'

const CATEGORIES = [
  'Food and groceries',
  'Housing or emergency shelter',
  'Rent assistance',
  'Utilities and electricity bills',
  'Healthcare or medical costs',
  'Mental health support',
  'Employment or job training',
  'Financial assistance',
  'Transportation',
  'Childcare or family services',
  'Legal assistance',
  'Other'
]

export default function SearchForm() {
  const [selected, setSelected] = useState<string[]>([])
  const [zip, setZip] = useState('Seattle')
  const [text, setText] = useState('')

  const toggle = (cat: string) => {
    setSelected(prev => prev.includes(cat) ? prev.filter(s => s !== cat) : [...prev, cat])
  }

  const submit = async (e: any) => {
    e.preventDefault()
    const body = { categories: selected, location: zip, text }
    const res = await fetch('/api/match', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    console.log('matches', data)
    alert('Search submitted — check console for mock results')
  }

  return (
    <form onSubmit={submit} className="bg-white p-4 rounded shadow">
      <div>
        <label className="block font-medium mb-2">What do you need help with?</label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map(cat => (
            <button type="button" key={cat} onClick={() => toggle(cat)} className={`text-left p-2 border rounded ${selected.includes(cat) ? 'bg-blue-100 border-blue-300' : 'bg-white'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="block font-medium mb-2">Where do you need help? (city or ZIP)</label>
        <input value={zip} onChange={e => setZip(e.target.value)} className="w-full border p-2 rounded" />
      </div>

      <div className="mt-4">
        <label className="block font-medium mb-2">Anything else? (optional)</label>
        <textarea value={text} onChange={e => setText(e.target.value)} className="w-full border p-2 rounded" rows={3} />
      </div>

      <div className="mt-4 flex justify-end">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Search</button>
      </div>
    </form>
  )
}
