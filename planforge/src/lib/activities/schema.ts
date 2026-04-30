import { z } from 'zod'

// ── Activity schemas ──────────────────────────────────────────────────────────
// Eight activity types. Every activity has a stable client-generated id (act_<uuid>)
// and a discriminator `type`. Tutor-only fields (tutor_notes / tutor_explanation /
// tutor_followups / model_answer / common_errors) are hidden by default in Teach
// Mode and only revealed when the teacher explicitly clicks Show.

// v3.1: Structured per-slide teaching guidance. Optional for backwards compat
// with v1/v2/v3 lessons. When present, the Tutor Panel renders the four
// sections; when absent, it falls back to whatever legacy tutor_* fields the
// activity has.
export const TeachingGuidanceSchema = z.object({
  objective: z.string(),
  how_to_run: z.array(z.string()).default([]),
  watch_for: z.array(z.string()).default([]),
  if_struggling: z.array(z.string()).default([]),
  timing_minutes: z.number().int().nonnegative().default(0),
})
export type TeachingGuidance = z.infer<typeof TeachingGuidanceSchema>

export const ReadingPassageSchema = z.object({
  type: z.literal('reading_passage'),
  id: z.string(),
  title: z.string(),
  // v3.1: model writes image_query; the Unsplash post-processor writes
  // image_url. image_url stays optional so backfilled rows still validate.
  image_query: z.string().optional(),
  image_url: z.string().nullable().optional(),
  body: z.string(),
  extra_paragraphs: z.array(z.string()).default([]),
  tutor_notes: z.string().default(''),
  comprehension_hooks: z.array(z.string()).optional(),
  teaching_guidance: TeachingGuidanceSchema.optional(),
})

export const MultipleChoiceSchema = z.object({
  type: z.literal('multiple_choice'),
  id: z.string(),
  question: z.string(),
  options: z.array(z.string()).min(2),
  correct_index: z.number().int().nonnegative(),
  tutor_explanation: z.string().default(''),
  teaching_guidance: TeachingGuidanceSchema.optional(),
})

export const GapFillSchema = z.object({
  type: z.literal('gap_fill'),
  id: z.string(),
  sentence_template: z.string(),
  word_bank: z.array(z.string()).default([]),
  answers: z.array(z.string()).default([]),
  tutor_explanation: z.string().default(''),
  teaching_guidance: TeachingGuidanceSchema.optional(),
})

export const DiscussionQuestionsSchema = z.object({
  type: z.literal('discussion_questions'),
  id: z.string(),
  title: z.string(),
  image_query: z.string().optional(),
  image_url: z.string().nullable().optional(),
  intro: z.string().default(''),
  questions: z.array(z.string()).min(1),
  tutor_followups: z.array(z.string()).default([]),
  teaching_guidance: TeachingGuidanceSchema.optional(),
})

export const WritingTaskSchema = z.object({
  type: z.literal('writing_task'),
  id: z.string(),
  prompt: z.string(),
  min_words: z.number().int().nonnegative().default(50),
  model_answer: z.string().default(''),
  tutor_notes: z.string().default(''),
  success_criteria: z.array(z.string()).optional(),
  teaching_guidance: TeachingGuidanceSchema.optional(),
})

export const VocabPresentationSchema = z.object({
  type: z.literal('vocab_presentation'),
  id: z.string(),
  items: z.array(z.object({
    word: z.string(),
    pos: z.string().default(''),
    pronunciation: z.string().default(''),
    definition: z.string(),
    example: z.string().default(''),
    collocation: z.string().optional(),
  })).min(1),
  teaching_guidance: TeachingGuidanceSchema.optional(),
})

export const GrammarExplanationSchema = z.object({
  type: z.literal('grammar_explanation'),
  id: z.string(),
  rule_title: z.string(),
  rule: z.string(),
  examples: z.array(z.string()).default([]),
  common_errors: z.array(z.object({
    wrong: z.string(),
    right: z.string(),
  })).default([]),
  practice_prompts: z.array(z.string()).optional(),
  teaching_guidance: TeachingGuidanceSchema.optional(),
})

export const ImagePromptSchema = z.object({
  type: z.literal('image_prompt'),
  id: z.string(),
  // v3.1.1: image_url is fully optional + nullable. The model writes
  // image_query; the Unsplash post-processor populates image_url, which is
  // null when the lookup fails or no key is set. The frontend renders a
  // placeholder card for null/undefined either way.
  image_query: z.string().optional(),
  image_url: z.string().nullable().optional(),
  prompt: z.string(),
  tutor_followups: z.array(z.string()).default([]),
  vocabulary_to_elicit: z.array(z.string()).optional(),
  teaching_guidance: TeachingGuidanceSchema.optional(),
})

export const ActivitySchema = z.discriminatedUnion('type', [
  ReadingPassageSchema,
  MultipleChoiceSchema,
  GapFillSchema,
  DiscussionQuestionsSchema,
  WritingTaskSchema,
  VocabPresentationSchema,
  GrammarExplanationSchema,
  ImagePromptSchema,
])

export const ActivitiesSchema = z.array(ActivitySchema)

export type ReadingPassage = z.infer<typeof ReadingPassageSchema>
export type MultipleChoice = z.infer<typeof MultipleChoiceSchema>
export type GapFill = z.infer<typeof GapFillSchema>
export type DiscussionQuestions = z.infer<typeof DiscussionQuestionsSchema>
export type WritingTask = z.infer<typeof WritingTaskSchema>
export type VocabPresentation = z.infer<typeof VocabPresentationSchema>
export type GrammarExplanation = z.infer<typeof GrammarExplanationSchema>
export type ImagePrompt = z.infer<typeof ImagePromptSchema>
export type Activity = z.infer<typeof ActivitySchema>

// Generate a stable id for new activities (works in both browser and node).
export function generateActivityId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `act_${crypto.randomUUID()}`
  }
  return `act_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

// Coerce loose AI output into a valid activity array. Fills in missing ids and
// trims unknown fields. Throws if any item fails the discriminated union.
export function parseActivities(raw: unknown): Activity[] {
  if (!Array.isArray(raw)) throw new Error('activities must be an array')
  const withIds = raw.map((a: any) => {
    if (a && typeof a === 'object' && (!a.id || typeof a.id !== 'string')) {
      return { ...a, id: generateActivityId() }
    }
    return a
  })
  return ActivitiesSchema.parse(withIds)
}

// ── v3.1.1 type normalization ─────────────────────────────────────────────────
// Defensive layer between the model's tool-call output and Zod validation.
// We've seen the model occasionally produce camelCase / whitespace / unknown
// activity types (Bug B). Drop unknowns rather than fail the whole batch —
// safer than wrong-typing an activity and the rest of the lesson still works.

const VALID_TYPES = new Set<Activity['type']>([
  'reading_passage',
  'multiple_choice',
  'gap_fill',
  'discussion_questions',
  'writing_task',
  'vocab_presentation',
  'grammar_explanation',
  'image_prompt',
])

// camelCase / PascalCase → snake_case ("MultipleChoice" → "multiple_choice").
// Idempotent on already-snake-cased input.
function toSnake(s: string): string {
  return s
    .trim()
    .replace(/[\s\-]+/g, '_')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/_+/g, '_')
    .toLowerCase()
}

export interface NormalizeResult {
  activities: unknown[]
  droppedTypes: string[] // for server-side logging
}

// Normalize an arbitrary activities array: coerce `type` to snake_case, drop
// any items whose type doesn't match the eight valid literals. Returns the
// kept items and the dropped raw type strings for logging.
export function normalizeActivityTypes(raw: unknown): NormalizeResult {
  if (!Array.isArray(raw)) return { activities: [], droppedTypes: [] }
  const kept: unknown[] = []
  const dropped: string[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      dropped.push(String((item as any)?.type ?? '<not-an-object>'))
      continue
    }
    const rawType = (item as any).type
    if (typeof rawType !== 'string') {
      dropped.push(String(rawType))
      continue
    }
    const normalized = toSnake(rawType)
    if (!VALID_TYPES.has(normalized as Activity['type'])) {
      dropped.push(rawType)
      continue
    }
    kept.push({ ...(item as object), type: normalized })
  }
  return { activities: kept, droppedTypes: dropped }
}
