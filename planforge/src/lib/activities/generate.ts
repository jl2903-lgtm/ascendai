// Server-side helper: generate a structured `activities[]` array for a lesson.
// We use OpenAI tool-calling to force the model into our JSON schema, then
// validate with Zod. Lives alongside (not replacing) the legacy plan generator
// so existing PDF / view flows keep working.

import { getOpenAIClient } from '@/lib/openai'
import {
  Activity,
  generateActivityId,
  parseActivities,
} from './schema'
import type { LessonFormData, ClassContext, LessonContent } from '@/types'

// JSON Schema for the OpenAI tool. Structurally mirrors Zod schema in ./schema.ts.
//
// v3.1 changes:
//   - image_url is gone from the tool schema. The model writes image_query;
//     a post-processor calls Unsplash and writes image_url itself. Hallucinated
//     URLs were the cause of broken lead-in images.
//   - teaching_guidance is required on every activity. Drives the four-section
//     Tutor Panel layout (Objective / How to run / Watch for / If they struggle).
const teachingGuidanceJsonSchema = {
  type: 'object',
  properties: {
    objective: { type: 'string' },
    // v3.2: trimmed verbosity to keep generation under 60s. 2–3 items per
    // section is enough to be useful without burning output tokens.
    how_to_run: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 3 },
    watch_for: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 3 },
    if_struggling: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 3 },
    timing_minutes: { type: 'integer', minimum: 1, maximum: 30 },
  },
  required: ['objective', 'how_to_run', 'watch_for', 'if_struggling', 'timing_minutes'],
} as const

const activityJsonSchema = {
  type: 'object',
  properties: {
    activities: {
      type: 'array',
      items: {
        oneOf: [
          {
            type: 'object',
            properties: {
              type: { const: 'reading_passage' },
              id: { type: 'string' },
              title: { type: 'string' },
              image_query: { type: 'string' },
              body: { type: 'string' },
              extra_paragraphs: { type: 'array', items: { type: 'string' } },
              tutor_notes: { type: 'string' },
              comprehension_hooks: { type: 'array', items: { type: 'string' } },
              teaching_guidance: teachingGuidanceJsonSchema,
            },
            required: ['type', 'id', 'title', 'body', 'image_query', 'teaching_guidance'],
          },
          {
            type: 'object',
            properties: {
              type: { const: 'multiple_choice' },
              id: { type: 'string' },
              question: { type: 'string' },
              options: { type: 'array', items: { type: 'string' }, minItems: 2 },
              correct_index: { type: 'integer', minimum: 0 },
              tutor_explanation: { type: 'string' },
              teaching_guidance: teachingGuidanceJsonSchema,
            },
            required: ['type', 'id', 'question', 'options', 'correct_index', 'teaching_guidance'],
          },
          {
            type: 'object',
            properties: {
              type: { const: 'gap_fill' },
              id: { type: 'string' },
              sentence_template: { type: 'string' },
              word_bank: { type: 'array', items: { type: 'string' } },
              answers: { type: 'array', items: { type: 'string' } },
              tutor_explanation: { type: 'string' },
              teaching_guidance: teachingGuidanceJsonSchema,
            },
            required: ['type', 'id', 'sentence_template', 'answers', 'teaching_guidance'],
          },
          {
            type: 'object',
            properties: {
              type: { const: 'discussion_questions' },
              id: { type: 'string' },
              title: { type: 'string' },
              image_query: { type: 'string' },
              intro: { type: 'string' },
              questions: { type: 'array', items: { type: 'string' }, minItems: 1 },
              tutor_followups: { type: 'array', items: { type: 'string' } },
              teaching_guidance: teachingGuidanceJsonSchema,
            },
            required: ['type', 'id', 'title', 'questions', 'image_query', 'teaching_guidance'],
          },
          {
            type: 'object',
            properties: {
              type: { const: 'writing_task' },
              id: { type: 'string' },
              prompt: { type: 'string' },
              min_words: { type: 'integer', minimum: 0 },
              model_answer: { type: 'string' },
              tutor_notes: { type: 'string' },
              success_criteria: { type: 'array', items: { type: 'string' } },
              teaching_guidance: teachingGuidanceJsonSchema,
            },
            required: ['type', 'id', 'prompt', 'teaching_guidance'],
          },
          {
            type: 'object',
            properties: {
              type: { const: 'vocab_presentation' },
              id: { type: 'string' },
              items: {
                type: 'array',
                minItems: 1,
                items: {
                  type: 'object',
                  properties: {
                    word: { type: 'string' },
                    pos: { type: 'string' },
                    pronunciation: { type: 'string' },
                    definition: { type: 'string' },
                    example: { type: 'string' },
                    collocation: { type: 'string' },
                  },
                  required: ['word', 'definition'],
                },
              },
              teaching_guidance: teachingGuidanceJsonSchema,
            },
            required: ['type', 'id', 'items', 'teaching_guidance'],
          },
          {
            type: 'object',
            properties: {
              type: { const: 'grammar_explanation' },
              id: { type: 'string' },
              rule_title: { type: 'string' },
              rule: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } },
              common_errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { wrong: { type: 'string' }, right: { type: 'string' } },
                  required: ['wrong', 'right'],
                },
              },
              practice_prompts: { type: 'array', items: { type: 'string' } },
              teaching_guidance: teachingGuidanceJsonSchema,
            },
            required: ['type', 'id', 'rule_title', 'rule', 'teaching_guidance'],
          },
          {
            type: 'object',
            properties: {
              type: { const: 'image_prompt' },
              id: { type: 'string' },
              image_query: { type: 'string' },
              prompt: { type: 'string' },
              tutor_followups: { type: 'array', items: { type: 'string' } },
              vocabulary_to_elicit: { type: 'array', items: { type: 'string' } },
              teaching_guidance: teachingGuidanceJsonSchema,
            },
            required: ['type', 'id', 'prompt', 'image_query', 'teaching_guidance'],
          },
        ],
      },
    },
  },
  required: ['activities'],
} as const

const SYSTEM = `You are an expert TEFL/EFL curriculum designer. You design interactive lesson activities that a tutor will run from inside a tutoring app while screen-sharing to a student via Zoom or Cambly. Always speak directly to the teacher in any tutor_* fields ("you", coaching tone). Always return valid structured output via the provided tool.`

// Length-scaled targets. We pass these explicitly to the model rather than
// asking it to estimate timing — its self-estimates are unreliable.
//
// v3.2: targets are split into two halves so we can run two parallel model
// calls instead of one long sequential call. Each half gets its own
// activityCount + arcSteps, plus a one-line note describing what the OTHER
// half will cover so the two halves stay coherent (no duplicate vocab,
// progression matches).
interface HalfTargets {
  activityCount: string // "4–5"
  arcSteps: string[]
  role: string // human-readable description of this half's role
  otherHalfNote: string // "(the second half will cover comprehension, discussion, writing)"
}

interface LengthTargets {
  totalActivityCount: string
  readingPassageCount: number
  productionGuidance: string
  firstHalf: HalfTargets
  secondHalf: HalfTargets
  // Combined arc, used to summarise both halves at once when needed.
  arcSteps: string[]
}

function lengthTargets(minutes: number): LengthTargets {
  if (minutes <= 30) {
    const firstHalf: HalfTargets = {
      activityCount: '4–5',
      role: 'first half — lead-in, vocabulary, reading exposure',
      otherHalfNote: '(the second half will cover comprehension MCQs, language focus, gap-fill, and ONE production activity)',
      arcSteps: [
        'Lead-in (image_prompt OR discussion_questions) — exactly 1',
        'vocab_presentation — exactly 1, 6–10 items',
        'reading_passage — exactly 1, full body + 3–5 extra paragraphs',
      ],
    }
    const secondHalf: HalfTargets = {
      activityCount: '4–5',
      role: 'second half — comprehension, language focus, production',
      otherHalfNote: '(the first half already covered the lead-in, vocab presentation, and reading passage)',
      arcSteps: [
        'multiple_choice — 4–6 items (one per question), all referring to the reading passage',
        'grammar_explanation — exactly 1',
        'gap_fill — exactly 1',
        'production: ONE of writing_task OR discussion_questions (not both)',
      ],
    }
    return {
      totalActivityCount: '8–10',
      readingPassageCount: 1,
      productionGuidance: 'Pick ONE production activity at the end: a writing_task OR a final discussion_questions, not both.',
      firstHalf,
      secondHalf,
      arcSteps: [...firstHalf.arcSteps, ...secondHalf.arcSteps],
    }
  }
  if (minutes <= 45) {
    const firstHalf: HalfTargets = {
      activityCount: '5–7',
      role: 'first half — lead-in, vocabulary, reading exposure',
      otherHalfNote: '(the second half will cover comprehension MCQs, grammar/gap-fill, discussion, and writing)',
      arcSteps: [
        'Lead-in (image_prompt OR discussion_questions) — exactly 1',
        'vocab_presentation — exactly 1, 6–10 items',
        'reading_passage — exactly 1',
      ],
    }
    const secondHalf: HalfTargets = {
      activityCount: '6–7',
      role: 'second half — comprehension + language focus + production',
      otherHalfNote: '(the first half already covered the lead-in, vocab presentation, and reading passage)',
      arcSteps: [
        'multiple_choice — 4–6 items',
        'grammar_explanation — exactly 1',
        'gap_fill — exactly 1',
        'discussion_questions — exactly 1',
        'writing_task — exactly 1',
      ],
    }
    return {
      totalActivityCount: '11–14',
      readingPassageCount: 1,
      productionGuidance: 'Include BOTH a writing_task and a discussion_questions production activity.',
      firstHalf,
      secondHalf,
      arcSteps: [...firstHalf.arcSteps, ...secondHalf.arcSteps],
    }
  }
  if (minutes <= 60) {
    const firstHalf: HalfTargets = {
      activityCount: '7–9',
      role: 'first half — lead-in, vocab #1, reading #1, comprehension #1, language focus',
      otherHalfNote: '(the second half will cover a second vocab set, second reading passage, second comprehension block, discussion, and writing)',
      arcSteps: [
        'Lead-in (image_prompt OR discussion_questions) — exactly 1',
        'vocab_presentation #1 — exactly 1',
        'reading_passage #1 — exactly 1',
        'multiple_choice — 4–6 items, on passage #1',
        'grammar_explanation — exactly 1',
        'gap_fill — exactly 1',
      ],
    }
    const secondHalf: HalfTargets = {
      activityCount: '8–9',
      role: 'second half — vocab #2, reading #2, comprehension #2, discussion, writing',
      otherHalfNote: '(the first half already covered lead-in, vocab #1, reading #1, comprehension #1, and language focus)',
      arcSteps: [
        'vocab_presentation #2 — exactly 1, on a related sub-topic, distinct from vocab #1',
        'reading_passage #2 — exactly 1, related sub-topic with a contrasting angle',
        'multiple_choice — 4–6 items, on passage #2',
        'discussion_questions — exactly 1',
        'writing_task — exactly 1',
      ],
    }
    return {
      totalActivityCount: '15–18',
      readingPassageCount: 2,
      productionGuidance: 'Full production phase: discussion_questions AND writing_task.',
      firstHalf,
      secondHalf,
      arcSteps: [...firstHalf.arcSteps, ...secondHalf.arcSteps],
    }
  }
  // 90+ min
  const firstHalf: HalfTargets = {
    activityCount: '10–13',
    role: 'first half — lead-in through first language focus',
    otherHalfNote: '(the second half will cover vocab #2, readings #2 and #3, comprehension #2, discussion, and writing)',
    arcSteps: [
      'Lead-in (image_prompt OR discussion_questions) — exactly 1',
      'vocab_presentation #1 — exactly 1',
      'reading_passage #1 — exactly 1',
      'multiple_choice — 4–6 items on passage #1',
      'grammar_explanation — exactly 1',
      'gap_fill — exactly 1',
    ],
  }
  const secondHalf: HalfTargets = {
    activityCount: '10–13',
    role: 'second half — second vocab set, second/third reading passages, comprehension, production',
    otherHalfNote: '(the first half already covered lead-in, vocab #1, reading #1, comprehension #1, grammar, gap-fill)',
    arcSteps: [
      'vocab_presentation #2 — exactly 1, distinct from vocab #1',
      'reading_passage #2 — exactly 1',
      'multiple_choice — 4–6 items on passage #2',
      'second gap_fill OR additional grammar drill',
      'reading_passage #3 — exactly 1, contrasting perspective',
      'extended discussion_questions — exactly 1',
      'writing_task — exactly 1',
    ],
  }
  return {
    totalActivityCount: '20–26',
    readingPassageCount: 3,
    productionGuidance: 'Extended production: include both extended discussion_questions and a substantial writing_task. You may add a second gap_fill or a second multiple_choice for more practice.',
    firstHalf,
    secondHalf,
    arcSteps: [...firstHalf.arcSteps, ...secondHalf.arcSteps],
  }
}

// Optional pre-existing lesson plan content to anchor the activities to.
// When provided, we tell the model it's converting an existing plan rather
// than designing from scratch — keeps tone, vocabulary, and progression
// consistent with what the teacher already saw on the lesson view page.
function buildPrompt(
  data: LessonFormData,
  classContext?: ClassContext | null,
  plan?: LessonContent | null,
  // v3.2: when 'first' or 'second', generate only that half of the lesson.
  // The two halves run in parallel and are concatenated by the caller.
  half: 'first' | 'second' | 'all' = 'all',
): string {
  const targets = lengthTargets(data.length)
  const halfTargets =
    half === 'first' ? targets.firstHalf
    : half === 'second' ? targets.secondHalf
    : null

  const arc = halfTargets
    ? `YOU ARE GENERATING THE ${half.toUpperCase()} HALF OF A ${data.length}-MINUTE LESSON.

This is the ${halfTargets.role}.
You MUST produce ${halfTargets.activityCount} activities, in the order below. ${halfTargets.otherHalfNote}

Stay strictly inside your half's scope. Do not produce activities that belong to the other half — they are being generated by a separate parallel call.

Activities to produce in this half (in order):
${halfTargets.arcSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Combined arc reference (DO NOT generate the whole arc, only your half):
${targets.arcSteps.map(s => `  - ${s}`).join('\n')}

${targets.productionGuidance}
`
    : `LESSON ARC FOR ${data.length} MINUTES:
You MUST produce ${targets.totalActivityCount} activities total, including exactly ${targets.readingPassageCount} reading_passage activit${targets.readingPassageCount === 1 ? 'y' : 'ies'}.
${targets.productionGuidance}

Recommended order (adapt to the topic, but stay close to this structure):
${targets.arcSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}
`

  const depth = `CONTENT DEPTH RULES — every activity must be substantial. Thin output is unacceptable.

reading_passage:
- body: 150–250 words MINIMUM. A real article-style passage, not 1–2 sentences.
- extra_paragraphs: 3–5 substantial paragraphs, 60–120 words each. Continue the topic with new vocabulary, examples, statistics, anecdotes, or a contrasting perspective.
- comprehension_hooks: 2–3 mid-read check-in questions the teacher can ask while the student reads. Phrase as direct teacher questions.
- tutor_notes: explicit pre-read advice — vocabulary to pre-teach, predicted difficulties for ${data.nationality} L1 students.

multiple_choice:
- ${targets.readingPassageCount === 1 ? 'The single comprehension MCQ activity must have 4–6 questions.' : `EACH comprehension MCQ activity must have 4–6 questions tied to its corresponding reading_passage.`}
  But each multiple_choice activity in our schema represents ONE question. So produce 4–6 separate multiple_choice activities per comprehension block.
- tutor_explanation MUST explain (a) WHY the correct answer is right, AND (b) WHY each distractor is wrong, one sentence per distractor minimum.

gap_fill:
- minimum 5 blanks per activity (sentence_template should contain at least {{0}}…{{4}}).
- word_bank must include every answer plus 2–3 distractors that look plausible.
- tutor_explanation: explain the target structure and the most likely L1-driven errors.

discussion_questions:
- minimum 4 questions per activity.
- tutor_followups: at least 2 follow-ups PER question (so 8+ items in tutor_followups for a 4-question activity). Phrase them as concrete probes ("If they say X, ask Y.").

writing_task:
- success_criteria: 3–4 specific, observable things the teacher should look for in the student's response. Make them targeted — name the structure or vocabulary the student should use, not generic ("good grammar").
- model_answer: full, fluent answer at the appropriate CEFR level, meeting the success criteria.

vocab_presentation:
- 6–10 items per activity (NOT 3–4).
- Every item: word, pos, pronunciation (IPA), definition (CEFR-appropriate), example sentence, AND a collocation field — a common phrase the word appears in. Example: word "binge-watch", collocation "binge-watch a series".

grammar_explanation:
- minimum 4 examples (full sentences using the structure).
- minimum 3 common_errors with both wrong and right forms filled in.
- practice_prompts: 2–3 quick verbal prompts the teacher can use to drill the structure orally ("Tell me three things you've been doing this week using present perfect continuous").

image_prompt:
- vocabulary_to_elicit: 4–6 specific words/phrases the teacher should try to draw out of the student during the discussion.
- tutor_followups: at least 3 entries.`

  const tutorTone = `TUTOR-ONLY FIELDS — tutor_notes, tutor_explanation, tutor_followups, success_criteria, comprehension_hooks, practice_prompts, vocabulary_to_elicit, common_errors, model_answer.
Speak directly to the teacher in second person ("you"). Coach them. Reference the student's L1 (${data.nationality}) when calling out predictable errors. Never address the student inside any tutor_* field.`

  const ctx = classContext
    ? `\nCLASS PROFILE — "${classContext.className}":
- Course type: ${classContext.courseType}
${classContext.weakAreas.length ? `- Known weak areas: ${classContext.weakAreas.join(', ')}\n` : ''}${classContext.focusSkills.length ? `- Priority skills: ${classContext.focusSkills.join(', ')}\n` : ''}${classContext.additionalNotes ? `- Additional context: ${classContext.additionalNotes}\n` : ''}Tailor activities, examples, and tutor notes accordingly.`
    : ''

  const planContext = plan
    ? `\nEXISTING LESSON PLAN — convert this into Teach Mode activities. Stay faithful to the topic, level, language focus, and target vocabulary; don't invent a different lesson:

Title: ${plan.title}
Objectives:
${(plan.overview?.objectives ?? []).map(o => `- ${o}`).join('\n')}
Language focus: ${plan.languageFocus?.grammar_or_vocab ?? '—'}
${plan.languageFocus?.explanation ? `Explanation: ${plan.languageFocus.explanation}\n` : ''}${plan.languageFocus?.examples?.length ? `Examples: ${plan.languageFocus.examples.join(' | ')}\n` : ''}${plan.warmer?.instructions ? `Warmer: ${plan.warmer.instructions}\n` : ''}${plan.mainActivity?.instructions ? `Main activity: ${plan.mainActivity.instructions}\n` : ''}${plan.speakingTask?.instructions ? `Speaking task: ${plan.speakingTask.instructions}\n` : ''}`
    : ''

  return `Design an interactive lesson as an array of activities for the Teach Mode runner.

PARAMETERS
- CEFR Level: ${data.level}
- Topic: ${data.topic}
- Lesson Length: ${data.length} minutes
- Age Group: ${data.ageGroup}
- Student Nationality / L1: ${data.nationality}
- Class Size: ${data.classSize}
- Special Focus: ${data.specialFocus.length > 0 ? data.specialFocus.join(', ') : 'None'}
${ctx}${planContext}

${arc}

${depth}

ACTIVITY RULES
- Every activity in the output array MUST have a "type" field set to EXACTLY one of these eight string values, no variations, no other types allowed:
    "reading_passage"
    "multiple_choice"
    "gap_fill"
    "discussion_questions"
    "writing_task"
    "vocab_presentation"
    "grammar_explanation"
    "image_prompt"
  Do not invent new types. Do not use camelCase or PascalCase or hyphens. Use these exact lowercase snake_case strings only.
- Every activity has a unique id of the form "act_<short>" (any short random string).
- gap_fill: write the sentence_template using {{0}}, {{1}}, etc. The answers array aligns with those indices in order.
- multiple_choice: correct_index is 0-based. Each activity is ONE question. Produce multiple multiple_choice activities in a row to form a comprehension block of 4–6 questions.
- vocab_presentation has no tutor-only fields — it's presented openly to the student.
- IMAGES: do NOT generate or guess image URLs — they will not work. For reading_passage, discussion_questions, and image_prompt activities, write a short concrete image_query string (3–6 words, e.g. "movies and tv remote control", "popcorn cinema seats", "person streaming laptop"). A separate post-processor will look up a real image on Unsplash from this query. Do not output an image_url field at all.
- Keep all student-facing copy at CEFR ${data.level}.

${tutorTone}

TEACHING_GUIDANCE — REQUIRED ON EVERY ACTIVITY
Every activity must include a teaching_guidance object with these four sections plus a timing_minutes integer. The Tutor Panel in the app renders these so the teacher can run the lesson from your output.

  • objective: one sentence, action-oriented, what the student should know / do / produce by the end of this slide.
  • how_to_run: 2–3 concrete teacher moves in order. Read like a recipe a substitute teacher could follow ("Read question aloud", "Wait for response", "Click 'Show correct answer' and discuss why other options are wrong"). Reference this activity's actual content, not generic advice.
  • watch_for: 2–3 specific student errors / hesitations / pronunciation issues to listen for. Cite the actual vocabulary, grammar, or concepts in this activity. Mention predictable L1-driven errors for ${data.nationality} students.
  • if_struggling: 2–3 concrete fallback moves (a simpler example, a scaffolding question, a personal example). Don't write "explain again" — give the alternative move.
  • timing_minutes: integer, 1–30. The teacher's rough budget for this slide. Across all activities the sum should approximately equal ${data.length} minutes.

EXAMPLE teaching_guidance for a multiple_choice activity on "binge-watching":
{
  "objective": "Student can correctly identify the meaning of 'binge-watch' from context.",
  "how_to_run": [
    "Read the question aloud once at natural pace.",
    "Ask the student to read each option and think before answering.",
    "Take their answer, then ask why they chose it before revealing the correct answer.",
    "Click 'Show correct answer' and discuss why the others are wrong."
  ],
  "watch_for": [
    "Student picking 'a couple' — they may be confusing binge-watching with regular viewing.",
    "Hesitation on 'many' vs 'a couple' — may signal weak quantifier vocabulary.",
    "Pronunciation of 'binge' — the soft G is often mispronounced as a hard G."
  ],
  "if_struggling": [
    "Give a personal example: 'Last weekend I watched 8 episodes of...' — then ask them to label it.",
    "If they pick 'only watch movies', draw their attention to the word 'shows' in the passage.",
    "If they get it instantly, ask: when does binge-watching become unhealthy?"
  ],
  "timing_minutes": 4
}

Call the generate_lesson_activities tool with the resulting array. Do not include commentary outside the tool call.`
}

const MODEL = 'gpt-4o'

// Single-half generation. Internal — used by generateActivitiesRaw which
// orchestrates the two parallel halves.
async function generateOneHalf(
  data: LessonFormData,
  classContext: ClassContext | null | undefined,
  plan: LessonContent | null | undefined,
  half: 'first' | 'second',
  retryHint?: string,
): Promise<unknown[]> {
  const client = getOpenAIClient()
  const base = buildPrompt(data, classContext, plan, half)
  const userMessage = retryHint ? `${base}\n\nRETRY NOTE: ${retryHint}` : base
  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    // Half the prompt = roughly half the output. 9000 is generous for a
    // single half (~10–13 activities at 90 min) without hitting any wall.
    max_tokens: 9000,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: userMessage },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'generate_lesson_activities',
          description: 'Return the ordered array of interactive lesson activities for the Teach Mode runner.',
          parameters: activityJsonSchema as any,
        },
      },
    ],
    tool_choice: { type: 'function', function: { name: 'generate_lesson_activities' } },
  })

  const call = completion.choices[0]?.message?.tool_calls?.[0]
  if (!call || call.type !== 'function') throw new Error(`No tool call in ${half}-half response`)
  const args = JSON.parse(call.function.arguments || '{}') as { activities?: unknown }
  if (!Array.isArray(args.activities)) throw new Error(`Tool call missing activities in ${half}-half`)
  return args.activities as unknown[]
}

// v3.2: split into two parallel halves. ~Halves total wall-time vs. the
// previous single sequential call. Concatenate first-half + second-half in
// arc order and return the raw (un-validated, no images) array. The endpoint
// runs normalize → resolve images → Zod validate → save afterwards.
//
// retryHint is propagated to BOTH halves on retry — they're regenerated in
// full so the failure context applies uniformly.
export async function generateActivitiesRaw(
  data: LessonFormData,
  classContext?: ClassContext | null,
  plan?: LessonContent | null,
  retryHint?: string,
): Promise<unknown[]> {
  const t0 = Date.now()
  const [first, second] = await Promise.all([
    generateOneHalf(data, classContext, plan, 'first', retryHint),
    generateOneHalf(data, classContext, plan, 'second', retryHint),
  ])
  const t1 = Date.now()
  console.log('[generate-activities] halves complete', {
    firstHalfCount: first.length,
    secondHalfCount: second.length,
    bothHalvesMs: t1 - t0,
  })
  return [...first, ...second]
}

// Backwards-compat wrapper for callers that want the validated shape directly
// (e.g. anywhere we still have legacy code paths). New code should use
// generateActivitiesRaw and run normalize → resolveImages → parseActivities
// in sequence so the Unsplash step lands before validation.
export async function generateActivities(
  data: LessonFormData,
  classContext?: ClassContext | null,
  plan?: LessonContent | null,
): Promise<Activity[]> {
  const raw = await generateActivitiesRaw(data, classContext, plan)
  return parseActivities(raw)
}

// Build an `activities[]` array from a legacy LessonContent plan. Used as a
// best-effort migration so old saved lessons can still be taught without
// re-running the generator. Output is intentionally simple — for richer output
// users can click "Regenerate as activities".
export function activitiesFromLegacyPlan(plan: LessonContent): Activity[] {
  const acts: Activity[] = []

  // Lead-in via warmer / discussion-style prompt
  if (plan.warmer?.instructions) {
    acts.push({
      type: 'discussion_questions',
      id: generateActivityId(),
      title: 'Warm-up',
      intro: plan.warmer.instructions,
      questions: plan.leadIn?.instructions ? [plan.leadIn.instructions] : ['Let\'s get started.'],
      tutor_followups: plan.warmer.teacherNotes ? [plan.warmer.teacherNotes] : [],
    })
  }

  // Language focus → grammar explanation
  if (plan.languageFocus) {
    acts.push({
      type: 'grammar_explanation',
      id: generateActivityId(),
      rule_title: plan.languageFocus.grammar_or_vocab || 'Language Focus',
      rule: plan.languageFocus.explanation || '',
      examples: plan.languageFocus.examples ?? [],
      common_errors: (plan.languageFocus.commonErrors ?? []).map(e => ({
        wrong: e,
        right: '',
      })),
    })
  }

  // Exercises → gap_fill / multiple_choice (legacy formats are flat strings,
  // so we render them as a reading_passage with the raw content; the teacher
  // can use the side panel notes for answers).
  for (const ex of plan.exercises ?? []) {
    acts.push({
      type: 'reading_passage',
      id: generateActivityId(),
      title: ex.type,
      body: ex.instructions || '',
      extra_paragraphs: ex.content ? [ex.content] : [],
      tutor_notes: ex.answerKey ? `Answer key: ${ex.answerKey}` : '',
    })
  }

  // Speaking task → discussion questions
  if (plan.speakingTask?.prompts?.length) {
    acts.push({
      type: 'discussion_questions',
      id: generateActivityId(),
      title: 'Speaking Task',
      intro: plan.speakingTask.instructions ?? '',
      questions: plan.speakingTask.prompts,
      tutor_followups: [],
    })
  }

  // Exit ticket → multiple discussion questions
  if (plan.exitTicket?.questions?.length) {
    acts.push({
      type: 'discussion_questions',
      id: generateActivityId(),
      title: 'Exit Ticket',
      intro: plan.exitTicket.instructions ?? '',
      questions: plan.exitTicket.questions,
      tutor_followups: [],
    })
  }

  // Homework → writing task
  if (plan.homework?.instructions) {
    acts.push({
      type: 'writing_task',
      id: generateActivityId(),
      prompt: plan.homework.instructions,
      min_words: 50,
      model_answer: '',
      tutor_notes: '',
    })
  }

  return acts
}
