export default function ResourceCard() {
  return (
    <article className="p-4 bg-white rounded shadow">
      <header className="flex justify-between items-start">
        <h3 className="text-lg font-semibold">Community Food Bank</h3>
        <span className="text-sm text-gray-500">Food assistance</span>
      </header>
      <p className="mt-2 text-sm text-gray-700">Provides groceries and prepared meals to households in Seattle. Walk-ins welcome.</p>
      <dl className="mt-3 text-sm text-gray-600">
        <div><strong>Cost:</strong> Free</div>
        <div><strong>Address:</strong> 123 Example St, Seattle, WA</div>
        <div><strong>Contact:</strong> (206) 555-0101</div>
        <div><strong>Source:</strong> <a className="text-blue-600" href="#">Official site</a></div>
      </dl>
    </article>
  )
}
