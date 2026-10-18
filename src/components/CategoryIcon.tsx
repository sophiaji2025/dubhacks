import {
  Baby,
  Briefcase,
  Bus,
  HeartHandshake,
  HeartPulse,
  Home,
  Lightbulb,
  Scale,
  Users,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { ResourceCategory } from '../lib/categories'

const ICONS: Record<ResourceCategory, LucideIcon> = {
  'Food assistance': Utensils,
  'Housing and shelter': Home,
  Healthcare: HeartPulse,
  Employment: Briefcase,
  Transportation: Bus,
  Utilities: Lightbulb,
  'Financial assistance': Wallet,
  Childcare: Baby,
  'Legal assistance': Scale,
  'Mental health': HeartHandshake,
  'Other community services': Users,
}

export default function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = ICONS[category as ResourceCategory] ?? Users
  return <Icon className={className} aria-hidden />
}
