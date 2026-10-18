import { CategoryGlyph } from './Icon'

export default function CategoryIcon({ category, className }: { category: string; className?: string }) {
  return <CategoryGlyph category={category} className={className} />
}
