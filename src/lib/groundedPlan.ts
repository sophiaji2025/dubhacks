import { RESOURCE_CATEGORIES } from './categories'
import { LANGUAGES, LANGUAGE_CODES, type LanguageCode } from './i18n'
import { translateCategory } from './messages'
import { isExplicitlyFree, type MatchCriteria, type RankedMatch, type Resource } from './matching'

/**
 * A short plan written from listings the matcher already returned.
 * The optional person note may be sent for that request. It is not saved,
 * and it is not part of the plan object returned to the page.
 */

export type CallLine = {
  resource_id: string
  name: string
  line: string
}

export type GroundedPlan = {
  source: 'grok'
  steps: string[]
  call_lines: CallLine[]
}

export type PlanDecision =
  | { ok: true; plan: GroundedPlan }
  | { ok: false; reason: string }

const STEP_MIN = 20
const STEP_MAX = 400
const LINE_MIN = 20
const LINE_MAX = 320

const LEAD_IN = new Set([
  'After', 'Also', 'Ask', 'Before', 'Begin', 'Bring', 'Call', 'Check', 'Choose',
  'Confirm', 'Contact', 'Continue', 'Email', 'Find', 'First', 'Follow', 'Give',
  'Keep', 'Look', 'Make', 'Mention', 'Next', 'Note', 'Open', 'Phone', 'Pick',
  'Please', 'Read', 'Remember', 'Review', 'Say', 'Search', 'Second', 'Start',
  'Take', 'Tell', 'Then', 'Third', 'Use', 'Visit', 'Write', 'Your',
])

const TITLE_SPAN = /\b[A-Z][a-zA-Z'’-]+(?:\s+(?:of|and|the|for|de|la|&)\s+[A-Z][a-zA-Z'’-]+|\s+[A-Z][a-zA-Z'’-]+)+\b/g
const ORG_WORD = /\b[A-Z][a-zA-Z]+(?:Bank|Center|Centre|Clinic|Shelter|Pantry|Kitchen|Mission|Church|Agency|Foundation|Alliance|Coalition|Ministry|Hospital|Cupboard)\b/g

const ELIGIBILITY_CLAIMS = [
  /you qualify/i,
  /you(?:'re| are) eligible/i,
  /you(?:'ve| have) been approved/i,
  /you are approved/i,
  /\bguaranteed\b/i,
  /there is space/i,
  /space is available/i,
  /funding is available/i,
  /usted califica/i,
  /t[uú] calificas/i,
  /eres elegible/i,
  /usted es elegible/i,
  /hay cupo/i,
  /hay espacio/i,
  /hay fondos/i,
  /est[aá] garantizado/i,
  /符合资格/,
  /有名额/,
  /有资金/,
  /保证有/,
  /bạn đủ điều kiện/i,
  /có chỗ/i,
  /có kinh phí/i,
  /waad u qalantaa/i,
  /자격이 있습니다/,
  /자격이 됩니다/,
  /자리가 있습니다/,
  /자금이 있습니다/,
  /ብቁ ነዎት/,
  /kwalipikado ka/i,
  /may puwang/i,
  /may pondo/i,
  /\bgarantisado\b/i,
]

const NEGATION = /\b(not|no|cannot|can't|do not|don't|does not|doesn't|never|nunca|không|wala|hindi)\b|不|没有|无法|不能|않|없|못|አይ|አል/i
const ASK = /\b(ask|confirm|check|whether|verify|pregunt\w*|comprobar|hỏi|xác nhận|hubi|tanungin|kumpirmahin)\b|询问|确认|请问|물어|확인|ጠይቅ|አረጋግጥ/i
const HEDGE = /\b(only where|only when|when a listing|if a listing|not listed|does not|do not|cannot|don't|doesn't|was not|were not)\b/i

type Fact = 'wheelchair' | 'family' | 'walk_in' | 'no_appointment' | 'free'

export function groundedPlanInstructions(language: LanguageCode): string {
  const name = LANGUAGES.find((item) => item.code === language)?.englishName ?? 'English'
  return [
    'You write a short action plan for someone looking for community help.',
    'Use only the listings in the user message. The directory is the only source of organizations.',
    `Write the sentences in ${name}.`,
    'When you name an organization, copy its name exactly as given. Do not translate organization names.',
    'Do not add any other program, organization, website, phone number, address, or ZIP code.',
    'Do not change a listing\'s category.',
    'Do not say the person qualifies, is eligible, is approved, or will receive help.',
    'Do not say a program has space, funding, or same-day availability.',
    'If a field is null, it is unknown. Do not turn an unknown into a fact. You may tell the person to ask the provider.',
    'State that a service is free, wheelchair accessible, for children or families, walk-in, or available without an appointment only when that listing records it.',
    'The person_note is context for this request only. Do not repeat it, and do not treat it as proof of eligibility.',
    'steps: 3 to 5 short ordered actions. Set resource_id to the listing id when a step is about one listing. Use an empty string when the step is general.',
    'call_lines: one line per listing, in the same order as the listings. resource_id must be that listing\'s id. The line is what the person can say when they call or visit, and it must include the exact organization name.',
    'No markdown.',
  ].join('\n')
}

export function groundedPlanInput(matches: RankedMatch[], criteria: MatchCriteria): string {
  return JSON.stringify({
    location: criteria.locationLabel,
    zip: criteria.zip ?? null,
    selected_categories: criteria.categories,
    preferences: {
      free_only: criteria.freeOnly,
      transportation: criteria.transportation ?? null,
      children_or_family: criteria.childrenOrFamily,
      as_soon_as_possible: criteria.asSoonAsPossible,
      no_appointment: criteria.noAppointment,
    },
    person_note: criteria.description ?? null,
    listings: matches.map((match) => ({
      id: match.resource.id,
      name: match.resource.name,
      category: match.resource.category,
      description: match.resource.description,
      cost: match.resource.cost,
      address: match.resource.address,
      city: match.resource.city,
      service_area: match.resource.service_area,
      zip_codes: match.resource.zip_codes,
      eligibility: match.resource.eligibility,
      contact: match.resource.contact,
      source_url: match.resource.source_url,
      application_instructions: match.resource.application_instructions,
      wheelchair_accessible: match.resource.wheelchair_accessible,
      serves_children_or_families: match.resource.serves_children_or_families,
      appointment_required: match.resource.appointment_required,
      walk_in: match.resource.walk_in,
    })),
  })
}

export function groundedPlanSchema(listingCount: number) {
  const count = Math.max(1, Math.min(10, listingCount))
  return {
    name: 'grounded_action_plan',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['steps', 'call_lines'],
      properties: {
        steps: {
          type: 'array',
          minItems: 3,
          maxItems: 5,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['resource_id', 'text'],
            properties: {
              resource_id: { type: 'string' },
              text: { type: 'string' },
            },
          },
        },
        call_lines: {
          type: 'array',
          minItems: count,
          maxItems: count,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['resource_id', 'line'],
            properties: {
              resource_id: { type: 'string' },
              line: { type: 'string' },
            },
          },
        },
      },
    },
  }
}

export function acceptGroundedPlan(
  raw: unknown,
  matches: RankedMatch[],
  criteria: MatchCriteria,
): PlanDecision {
  if (matches.length === 0) return { ok: false, reason: 'no_listings' }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, reason: 'not_object' }

  const record = raw as { steps?: unknown; call_lines?: unknown }
  if (!Array.isArray(record.steps) || record.steps.length < 3 || record.steps.length > 5) {
    return { ok: false, reason: 'step_count' }
  }
  if (!Array.isArray(record.call_lines) || record.call_lines.length !== matches.length) {
    return { ok: false, reason: 'call_line_count' }
  }

  const context = buildCheckContext(matches, criteria)
  const steps: string[] = []
  for (const step of record.steps) {
    const parsed = readStep(step)
    if (!parsed) return { ok: false, reason: 'step_shape' }
    if (parsed.text.length < STEP_MIN || parsed.text.length > STEP_MAX) return { ok: false, reason: 'step_length' }
    const problem = checkText(parsed.text, parsed.resource_id, context, {
      requireOwnName: parsed.resource_id !== '',
      forbidOtherNames: false,
    })
    if (problem) return { ok: false, reason: problem }
    steps.push(parsed.text)
  }

  const linesById = new Map<string, string>()
  for (const entry of record.call_lines) {
    const parsed = readCallLine(entry)
    if (!parsed) return { ok: false, reason: 'call_line_shape' }
    if (parsed.line.length < LINE_MIN || parsed.line.length > LINE_MAX) return { ok: false, reason: 'call_line_length' }
    if (linesById.has(parsed.resource_id)) return { ok: false, reason: 'duplicate_call_line' }
    const problem = checkText(parsed.line, parsed.resource_id, context, {
      requireOwnName: true,
      forbidOtherNames: true,
    })
    if (problem) return { ok: false, reason: problem }
    linesById.set(parsed.resource_id, parsed.line)
  }

  const call_lines: CallLine[] = []
  for (const match of matches) {
    const line = linesById.get(match.resource.id)
    if (!line) return { ok: false, reason: 'missing_call_line' }
    call_lines.push({
      resource_id: match.resource.id,
      name: match.resource.name,
      line,
    })
  }

  return { ok: true, plan: { source: 'grok', steps, call_lines } }
}

type CheckContext = {
  matches: RankedMatch[]
  byId: Map<string, Resource>
  names: string[]
  allowedPhrases: string[]
  allowedPhones: Set<string>
  allowedUrls: string[]
  allowedZips: Set<string>
  note: string | undefined
  selectedCategories: string[]
}

function buildCheckContext(matches: RankedMatch[], criteria: MatchCriteria): CheckContext {
  const phones = new Set<string>()
  const zips = new Set<string>()
  if (criteria.zip) zips.add(criteria.zip)
  const urls: string[] = []
  const phrases = new Set<string>(['Seattle', criteria.locationLabel])
  if (criteria.cityLabel) phrases.add(criteria.cityLabel)

  for (const category of criteria.categories) {
    for (const label of categoryLabels(category)) phrases.add(label)
  }

  for (const match of matches) {
    const resource = match.resource
    phrases.add(resource.name)
    if (resource.category) {
      for (const label of categoryLabels(resource.category)) phrases.add(label)
    }
    for (const value of [resource.city, resource.service_area, resource.address]) {
      if (value) phrases.add(value)
    }
    for (const phone of phoneNumbers(resource.contact ?? '')) phones.add(phone)
    if (resource.source_url) urls.push(resource.source_url)
    for (const zip of resource.zip_codes ?? []) zips.add(zip)
    for (const zip of zipsIn(resource.address ?? '')) zips.add(zip)
    for (const zip of zipsIn(resource.service_area ?? '')) zips.add(zip)
  }

  return {
    matches,
    byId: new Map(matches.map((match) => [match.resource.id, match.resource])),
    names: matches.map((match) => match.resource.name),
    allowedPhrases: [...phrases].filter((phrase) => phrase.trim().length > 0),
    allowedPhones: phones,
    allowedUrls: urls,
    allowedZips: zips,
    note: criteria.description,
    selectedCategories: criteria.categories,
  }
}

function checkText(
  text: string,
  resourceId: string,
  context: CheckContext,
  options: { requireOwnName: boolean; forbidOtherNames: boolean },
): string | null {
  const resource = resourceId ? context.byId.get(resourceId) : undefined
  if (resourceId && !resource) return 'unknown_resource'

  if (options.requireOwnName && resource && !text.includes(resource.name)) return 'missing_name'
  if (resource && nameWasRewritten(text, resource.name)) return 'name_changed'
  for (const name of context.names) {
    if (nameWasRewritten(text, name)) return 'name_changed'
    if (options.forbidOtherNames && resource && name !== resource.name && text.toLowerCase().includes(name.toLowerCase())) {
      return 'other_listing'
    }
  }

  const unknown = unknownNames(text, context.allowedPhrases)
  if (unknown.length > 0) return `unknown_name:${unknown[0]}`

  if (assertsEligibility(text)) return 'eligibility_claim'
  if (repeatsNote(text, context.note)) return 'repeated_note'

  const categoryProblem = wrongCategory(text, resource?.category ?? null, context)
  if (categoryProblem) return 'category_changed'

  const phoneProblem = unsupportedPhones(text, context.allowedPhones)
  if (phoneProblem) return 'unknown_phone'
  const urlProblem = unsupportedUrls(text, context.allowedUrls)
  if (urlProblem) return 'unknown_url'
  const zipProblem = unsupportedZips(text, context.allowedZips)
  if (zipProblem) return 'unknown_zip'

  return unsupportedFacts(text, resourceId, context)
}

function readStep(value: unknown): { resource_id: string; text: string } | null {
  if (!value || typeof value !== 'object') return null
  const record = value as { resource_id?: unknown; text?: unknown }
  if (typeof record.resource_id !== 'string' || typeof record.text !== 'string') return null
  const text = record.text.trim()
  const resource_id = record.resource_id.trim()
  if (!text) return null
  return { resource_id, text }
}

function readCallLine(value: unknown): { resource_id: string; line: string } | null {
  if (!value || typeof value !== 'object') return null
  const record = value as { resource_id?: unknown; line?: unknown }
  if (typeof record.resource_id !== 'string' || typeof record.line !== 'string') return null
  const line = record.line.trim()
  const resource_id = record.resource_id.trim()
  if (!line || !resource_id) return null
  return { resource_id, line }
}

const FILLER = new Set(['a', 'an', 'and', 'at', 'de', 'for', 'in', 'la', 'of', 'on', 'or', 'the', 'to', 'with'])

function unknownNames(text: string, allowedPhrases: string[]): string[] {
  const found: string[] = []
  for (const span of text.match(TITLE_SPAN) ?? []) {
    if (!spanIsKnown(span, allowedPhrases)) found.push(span)
  }
  const remainder = stripPhrases(text, allowedPhrases)
  for (const match of remainder.match(ORG_WORD) ?? []) {
    if (!phraseAllows(match, allowedPhrases)) found.push(match)
  }
  return found
}

function spanIsKnown(span: string, allowedPhrases: string[]): boolean {
  if (phraseAllows(span, allowedPhrases)) return true
  const words = span.split(/\s+/)
  const phrases = allowedPhrases
    .map((phrase) => phrase.trim())
    .filter((phrase) => phrase.length > 0)
    .sort((a, b) => b.length - a.length)
  let index = 0
  while (index < words.length) {
    const rest = words.slice(index).join(' ')
    const match = phrases.find((phrase) => startsWithPhrase(rest, phrase))
    if (match) {
      index += match.split(/\s+/).length
      continue
    }
    if (LEAD_IN.has(words[index]) || FILLER.has(words[index].toLowerCase())) {
      index += 1
      continue
    }
    return false
  }
  return true
}

function startsWithPhrase(text: string, phrase: string): boolean {
  if (text.length < phrase.length) return false
  if (text.slice(0, phrase.length).toLowerCase() !== phrase.toLowerCase()) return false
  return text.length === phrase.length || text[phrase.length] === ' '
}

function phraseAllows(span: string, allowedPhrases: string[]): boolean {
  const needle = span.toLowerCase()
  return allowedPhrases.some((phrase) => phrase.toLowerCase().includes(needle))
}

function stripPhrases(text: string, allowedPhrases: string[]): string {
  const ordered = [...allowedPhrases].sort((a, b) => b.length - a.length)
  let remainder = text
  for (const phrase of ordered) {
    if (!phrase.trim()) continue
    remainder = remainder.replace(new RegExp(escapeRegExp(phrase), 'gi'), ' ')
  }
  return remainder
}

function nameWasRewritten(text: string, name: string): boolean {
  if (!text.toLowerCase().includes(name.toLowerCase())) return false
  return !text.includes(name)
}

function assertsEligibility(text: string): boolean {
  return text.split(/(?<=[.!?])\s+/).some((sentence) => {
    if (!ELIGIBILITY_CLAIMS.some((pattern) => pattern.test(sentence))) return false
    return !NEGATION.test(sentence)
  })
}

function repeatsNote(text: string, note: string | undefined): boolean {
  const compact = note?.trim().toLowerCase() ?? ''
  if (compact.length < 40) return false
  return text.toLowerCase().includes(compact.slice(0, 40))
}

function wrongCategory(text: string, scopedCategory: string | null, context: CheckContext): boolean {
  const allowed = new Set<string>()
  const permitted = scopedCategory
    ? [scopedCategory]
    : [...context.selectedCategories, ...context.matches.map((match) => match.resource.category ?? '')]
  for (const category of permitted) {
    for (const label of categoryLabels(category)) allowed.add(label.toLowerCase())
  }

  const lower = text.toLowerCase()
  for (const category of RESOURCE_CATEGORIES) {
    for (const label of categoryLabels(category)) {
      if (label.length < 4) continue
      if (allowed.has(label.toLowerCase())) continue
      if (lower.includes(label.toLowerCase())) return true
    }
  }
  return false
}

function categoryLabels(category: string): string[] {
  const labels = new Set<string>([category])
  if ((RESOURCE_CATEGORIES as readonly string[]).includes(category)) {
    for (const code of LANGUAGE_CODES) labels.add(translateCategory(code, category))
  }
  return [...labels]
}

function unsupportedPhones(text: string, allowed: Set<string>): boolean {
  return phoneNumbers(text).some((phone) => !allowed.has(phone))
}

function unsupportedUrls(text: string, allowed: string[]): boolean {
  const found = text.match(/https?:\/\/[^\s)]+/gi) ?? []
  return found.some((url) => {
    const normalized = url.replace(/[.,]+$/, '').replace(/\/+$/, '').toLowerCase()
    return !allowed.some((source) => source.replace(/\/+$/, '').toLowerCase() === normalized)
  })
}

function unsupportedZips(text: string, allowed: Set<string>): boolean {
  return zipsIn(text).some((zip) => !allowed.has(zip))
}

function unsupportedFacts(text: string, resourceId: string, context: CheckContext): string | null {
  const sentences = text.split(/(?<=[.!?])\s+/)
  for (const sentence of sentences) {
    const claims = factClaims(sentence)
    if (claims.length === 0) continue
    const scope = factScope(sentence, resourceId, context)
    if (scope === 'unscoped') {
      if (!HEDGE.test(sentence)) return 'unscoped_fact'
      continue
    }
    if (scope.length === 0) return 'unknown_resource'
    for (const claim of claims) {
      if (scope.some((resource) => !supports(resource, claim))) return 'unsupported_fact'
    }
  }
  return null
}

function factScope(sentence: string, resourceId: string, context: CheckContext): Resource[] | 'unscoped' {
  if (resourceId) {
    const resource = context.byId.get(resourceId)
    return resource ? [resource] : []
  }
  const named = context.matches.filter((match) => sentence.toLowerCase().includes(match.resource.name.toLowerCase()))
  if (named.length === 0) return 'unscoped'
  return named.map((match) => match.resource)
}

function factClaims(sentence: string): Fact[] {
  if (ASK.test(sentence) || sentence.includes('?')) return []
  const claims: Fact[] = []
  if (/wheelchair|silla de ruedas|轮椅|xe lăn|휠체어|ተሽከርካሪ ወንበር|upuang de gulong/i.test(sentence)) claims.push('wheelchair')
  if (/\b(serves|serving|atiende|sirve)\b[^.]{0,40}\b(children|families|niños|familias)\b/i.test(sentence)) claims.push('family')
  if (/walk-?\s?in/i.test(sentence)) claims.push('walk_in')
  if (/no appointment is required|appointment is not required|no se requiere cita/i.test(sentence)) claims.push('no_appointment')
  if (/\b(is|are|es|son)\s+free\b|\bes gratis\b|\bsin costo\b|免费/i.test(sentence)) claims.push('free')
  return claims
}

function supports(resource: Resource, fact: Fact): boolean {
  switch (fact) {
    case 'wheelchair':
      return resource.wheelchair_accessible === true
    case 'family':
      return resource.serves_children_or_families === true
    case 'walk_in':
      return resource.walk_in === true
    case 'no_appointment':
      return resource.appointment_required === false
    case 'free':
      return isExplicitlyFree(resource.cost)
    default:
      return false
  }
}

function phoneNumbers(text: string): string[] {
  return [...text.matchAll(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g)].map((match) => match[0].replace(/\D/g, ''))
}

function zipsIn(text: string): string[] {
  return [...text.matchAll(/\b\d{5}\b/g)].map((match) => match[0])
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
