import { Check } from './Icon'
import { RESOURCE_CATEGORIES, type ResourceCategory } from '../lib/categories'
import CategoryIcon from './CategoryIcon'

type CategoryChoicesProps = {
  selected: string[]
  onToggle: (category: string) => void
}

export default function CategoryChoices({ selected, onToggle }: CategoryChoicesProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {RESOURCE_CATEGORIES.map((category) => {
        const active = selected.includes(category)
        return (
          <label
            key={category}
            className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-3 text-sm focus-within:ring-2 focus-within:ring-forest focus-within:ring-offset-2 focus-within:ring-offset-cream ${
              active ? 'border-forest bg-sage text-charcoal' : 'border-line bg-white text-charcoal'
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={active}
              onChange={() => onToggle(category)}
            />
            <CategoryIcon category={category as ResourceCategory} className={`h-5 w-5 shrink-0 ${active ? 'text-forest' : 'text-leaf'}`} />
            <span className="flex-1">{category}</span>
            <span
              aria-hidden
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border ${
                active ? 'border-forest bg-forest text-white' : 'border-line bg-white'
              }`}
            >
              {active ? <Check className="h-3.5 w-3.5" /> : null}
            </span>
          </label>
        )
      })}
    </div>
  )
}
