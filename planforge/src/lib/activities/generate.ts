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

function buildPrompt(data: LessonFormData, classContext?: ClassContext | null): string {
  const arc = `Default lesson arc (you may adapt to the topic and level):
1. Lead-in: image_prompt or discussion_questions
2. Vocabulary: vocab_presentation (5–8 words)
3. Reading: reading_passage
4. Comprehension: multiple_choice (3–5 questions)
5. Language focus: grammar_explanation + gap_fill
6. Discussion: discussion_questions
7. Production: writing_task

Pick a number of activities appropriate to the lesson length:
- 30 min → 5–6 activities
- 45 min → 7–8 activities
- 60 min → 9–10 activities
- 90 min → 11–13 activities
`

  const tutorTone = `For every tutor_notes / tutor_explanation / tutor_followups field, write a coaching message addressed to the teacher. Tell them what to look out for, common student mistakes for the L1 (${data.nationality}), and concrete follow-up questions. Never address the student in tutor_* fields.`

  const ctx = classContext
    ? `\nCLASS PROFILE — "${classContext.className}":
- Course type: ${classContext.courseType}
${classContext.weakAreas.length ? `- Known weak areas: ${classContext.weakAreas.join(', ')}\n` : ''}${classContext.focusSkills.length ? `- Priority skills: ${classContext.focusSkills.join(', ')}\n` : ''}${classContext.additionalNotes ? `- Additional context: ${classContext.additionalNotes}\n` : ''}Tailor activities and tutor notes accordingly.`
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

ACTIVITY RULES
- Every activity must have a unique id of the form "act_<short>" (you can use any random short string).
- For gap_fill, write the sentence_template using {{0}}, {{1}}, etc. as placeholders. The answers array must align with those indices in order. The word_bank should include every answer plus 1–2 distractors.
- For multiple_choice, correct_index is 0-based.
- For vocab_presentation, no tutor-only fields exist — vocab is presented openly to the student.
- For image_prompt, image_url is required; use a generic placeholder URL ("https://images.unsplash.com/<query>") if no specific image is mandated.
- Keep all student-facing copy at the appropriate CEFR level.

${tutorTone}

Call the generate_lesson_activities tool with the resulting array. Do not include any commentary outside the tool call.`
}

const MODEL = 'gpt-4o'

export async function generateActivities(
  data: LessonFormData,
  classContext?: ClassContext | null,
): Promise<Activity[]> {
  const client = getOpenAIClient()
  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 8000,
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
