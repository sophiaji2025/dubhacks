// Canonical resource categories. Keep this list identical to the CHECK
// constraint on resources.category in supabase/schema.sql and to the lists
// in docs/SPEC.md sections 5 and 6.

export const RESOURCE_CATEGORIES = [
  'Food assistance',
  'Housing and shelter',
  'Healthcare',
  'Employment',
  'Clothing',
  'Transportation',
  'Utilities',
  'Financial assistance',
  'Childcare',
  'Legal assistance',
  'Mental health',
  'Other community services',
] as const

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number]

const CATEGORY_SET = new Set<string>(RESOURCE_CATEGORIES)

export function isResourceCategory(value: string): value is ResourceCategory {
  return CATEGORY_SET.has(value)
}

type ParsedCategories =
  | { ok: true; categories: ResourceCategory[] }
  | { ok: false; error: string; categories?: string[] }

// Accepts one category string, an array of category strings, or an empty value.
export function parseCategoryList(input: unknown): ParsedCategories {
  if (input == null || input === '') return { ok: true, categories: [] }

  const values: string[] = []
  if (typeof input === 'string') {
    values.push(input)
  } else if (Array.isArray(input)) {
    for (const item of input) {
      if (typeof item !== 'string') {
        return { ok: false, error: 'categories must be strings' }
      }
      values.push(item)
    }
  } else {
    return { ok: false, error: 'categories must be strings' }
  }

  const unknown = values.filter((value) => !isResourceCategory(value))
  if (unknown.length) {
    return { ok: false, error: 'Unknown category', categories: unknown }
  }

  return { ok: true, categories: values as ResourceCategory[] }
}

// Pull every category field a submission might use into one list.
export function categoryValuesFromSubmission(body: Record<string, unknown> | null | undefined): unknown[] {
  const values: unknown[] = []
  const push = (value: unknown) => {
    if (value == null || value === '') return
    if (Array.isArray(value)) values.push(...value)
    else values.push(value)
  }

  const resource = body?.resource
  const nested = resource && typeof resource === 'object' ? (resource as Record<string, unknown>) : undefined

  push(body?.categories)
  push(body?.category)
  push(nested?.categories)
  push(nested?.category)
  return values
}
