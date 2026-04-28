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
// v2: extra optional fields (comprehension_hooks, success_criteria, collocation,
// practice_prompts, vocabulary_to_elicit) — old lessons without them still pass.
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
              image_url: { type: ['string', 'null'] },
              body: { type: 'string' },
              extra_paragraphs: { type: 'array', items: { type: 'string' } },
              tutor_notes: { type: 'string' },
              comprehension_hooks: { type: 'array', items: { type: 'string' } },
            },
            required: ['type', 'id', 'title', 'body'],
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
            },
            required: ['type', 'id', 'question', 'options', 'correct_index'],
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
            },
            required: ['type', 'id', 'sentence_template', 'answers'],
          },
          {
            type: 'object',
            properties: {
              type: { const: 'discussion_questions' },
              id: { type: 'string' },
              title: { type: 'string' },
              image_url: { type: ['string', 'null'] },
              intro: { type: 'string' },
              questions: { type: 'array', items: { type: 'string' }, minItems: 1 },
              tutor_followups: { type: 'array', items: { type: 'string' } },
            },
            required: ['type', 'id', 'title', 'questions'],
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
            },
            required: ['type', 'id', 'prompt'],
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
            },
            required: ['type', 'id', 'items'],
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
            },
            required: ['type', 'id', 'rule_title', 'rule'],
          },
          {
            type: 'object',
            properties: {
              type: { const: 'image_prompt' },
              id: { type: 'string' },
              image_url: { type: 'string' },
              prompt: { type: 'string' },
              tutor_followups: { type: 'array', items: { type: 'string' } },
              vocabulary_to_elicit: { type: 'array', items: { type: 'string' } },
            },
            required: ['type', 'id', 'prompt'],
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
interface LengthTargets {
  activityCount: string
  readingPassageCount: number
  productionGuidance: string
  arcSteps: string[]
}

function lengthTargets(minutes: number): LengthTargets {
  if (minutes <= 30) {
    return {
      activityCount: '8–10',
      readingPassageCount: 1,
      productionGuidance: 'Pick ONE production activity at the end: a writing_task OR a final discussion_questions, not both.',
      arcSteps: [
        'Lead-in (image_prompt OR discussion_questions)',
        'vocab_presentation',
        'reading_passage',
        'multiple_choice (4–6 comprehension questions)',
        'grammar_explanation',
        'gap_fill',
        'production (writing_task OR discussion_questions — pick one)',
      ],
    }
  }
  if (minutes <= 45) {
    return {
      activityCount: '11–14',
      readingPassageCount: 1,
      productionGuidance: 'Include BOTH a writing_task and a discussion_questions production activity.',
      arcSteps: [
        'Lead-in (image_prompt OR discussion_questions)',
        'vocab_presentation',
        'reading_passage',
        'multiple_choice (4–6 comprehension questions)',
        'grammar_explanation',
        'gap_fill',
        'discussion_questions',
        'writing_task',
      ],
    }
  }
  if (minutes <= 60) {
    return {
      activityCount: '15–18',
      readingPassageCount: 2,
      productionGuidance: 'Full production phase: discussion_questions AND writing_task.',
      arcSteps: [
        'Lead-in (image_prompt OR discussion_questions)',
        'vocab_presentation #1',
        'reading_passage #1',
        'multiple_choice #1 (4–6 comprehension questions on passage 1)',
        'grammar_explanation + gap_fill',
        'vocab_presentation #2 (related sub-topic vocab)',
        'reading_passage #2 (related sub-topic, contrasting angle)',
        'multiple_choice #2 (4–6 comprehension questions on passage 2)',
        'discussion_questions',
        'writing_task',
      ],
    }
  }
  // 90+ min
  return {
    activityCount: '20–26',
    readingPassageCount: 3,
    productionGuidance: 'Extended production: include both extended discussion_questions and a substantial writing_task. You may add a second gap_fill or a second multiple_choice for more practice.',
    arcSteps: [
      'Lead-in (image_prompt OR discussion_questions)',
      'vocab_presentation #1',
      'reading_passage #1',
      'multiple_choice #1 (4–6 comprehension questions)',
      'grammar_explanation + gap_fill',
      'vocab_presentation #2',
      'reading_passage #2',
      'multiple_choice #2 (4–6 comprehension questions)',
      'second gap_fill OR additional grammar drill',
      'reading_passage #3 (optional — contrasting perspective)',
      'extended discussion_questions',
      'writing_task',
    ],
  }
}

function buildPrompt(data: LessonFormData, classContext?: ClassContext | null): string {
  const targets = lengthTargets(data.length)
  const arc = `LESSON ARC FOR ${data.length} MINUTES:
You MUST produce ${targets.activityCount} activities total, including exactly ${targets.readingPassageCount} reading_passage activit${targets.readingPassageCount === 1 ? 'y' : 'ies'}.
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

  return `Design an interactive lesson as an array of activities for the Teach Mode runner.

PARAMETERS
- CEFR Level: ${data.level}
- Topic: ${data.topic}
- Lesson Length: ${data.length} minutes
- Age Group: ${data.ageGroup}
- Student Nationality / L1: ${data.nationality}
- Class Size: ${data.classSize}
- Special Focus: ${data.specialFocus.length > 0 ? data.specialFocus.join(', ') : 'None'}
${ctx}

${arc}

${depth}

ACTIVITY RULES
- Every activity has a unique id of the form "act_<short>" (any short random string).
- gap_fill: write the sentence_template using {{0}}, {{1}}, etc. The answers array aligns with those indices in order.
- multiple_choice: correct_index is 0-based. Each activity is ONE question. Produce multiple multiple_choice activities in a row to form a comprehension block of 4–6 questions.
- vocab_presentation has no tutor-only fields — it's presented openly to the student.
- image_prompt: image_url is required; if no specific image is mandated, use a stable Unsplash search URL like "https://images.unsplash.com/photo-<id>" or "https://source.unsplash.com/800x600/?<query>".
- Keep all student-facing copy at CEFR ${data.level}.

${tutorTone}

Call the generate_lesson_activities tool with the resulting array. Do not include commentary outside the tool call.`
}

const MODEL = 'gpt-4o'

export async function generateActivities(
  data: LessonFormData,
  classContext?: ClassContext | null,
): Promise<Activity[]> {
  const client = getOpenAIClient()
  const completion = await client.chat.completions.create({
    model: MODEL,
    // v2 lessons can be 20+ activities with 150–250 word reading passages and
    // 3–5 paragraphs of extras — token budget needs headroom.
    max_tokens: 16000,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: buildPrompt(data, classContext) },
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
  if (!call || call.type !== 'function') throw new Error('No tool call in response')
  const args = JSON.parse(call.function.arguments || '{}') as { activities?: unknown }
  if (!args.activities) throw new Error('Tool call missing activities')
  return parseActivities(args.activities)
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
