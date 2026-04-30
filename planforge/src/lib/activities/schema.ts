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
  // v3.1: image_url was required pre-3.1, but Unsplash failures now flow
  // through as null and the frontend renders a placeholder. Loosen to
  // nullable so post-processed rows still validate.
  image_query: z.string().optional(),
  image_url: z.string().nullable(),
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
