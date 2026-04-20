import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'

import { getOpenAIClient } from '@/lib/openai'
import { checkRateLimit } from '@/lib/rate-limit'
import type { LessonFormData, LessonContent, ClassContext } from '@/types'



const SYSTEM_PROMPT = `You are an expert TEFL/EFL curriculum designer with 15 years of experience teaching English as a Foreign Language across Asia, Europe, and Latin America. You create highly practical, communicative, student-centred lesson plans that follow best practices in ELT methodology. You understand the specific linguistic challenges that learners from different L1 backgrounds face when learning English. Always return your response as a valid JSON object only, with no additional text.`

function buildClassContextNote(ctx: ClassContext): string {
  const lines: string[] = [`\n\nCLASS PROFILE — "${ctx.className}":`]
  lines.push(`- Course type: ${ctx.courseType}`)
  if (ctx.weakAreas.length > 0) lines.push(`- Known weak areas: ${ctx.weakAreas.join(', ')}`)
  if (ctx.focusSkills.length > 0) lines.push(`- Priority skills: ${ctx.focusSkills.join(', ')}`)
  if (ctx.additionalNotes) lines.push(`- Additional context: ${ctx.additionalNotes}`)
  lines.push('Please tailor activities, examples, and teacher notes to address these specifics.')
  return lines.join('\n')
}

function buildPrompt(data: LessonFormData, classContext?: ClassContext | null): string {
  return `Create a complete EFL lesson plan with these parameters:
- CEFR Level: ${data.level}
- Topic: ${data.topic}
- Lesson Length: ${data.length} minutes
- Age Group: ${data.ageGroup}
- Student Nationality / L1: ${data.nationality}
- Class Size: ${data.classSize}
- Special Focus: ${data.specialFocus.length > 0 ? data.specialFocus.join(', ') : 'None'}

CRITICAL REQUIREMENTS FOR THE "exercises" SECTION — these are real worksheet sections a teacher will print and use in class, not placeholders:
- Gap fill: generate 8–10 complete sentences, each with one blank marked as _____ . Number them 1–10. The answer key must list every answer.
- Multiple choice: generate 5–6 questions, each with exactly three options labelled a), b), c). Number them 1–6. The answer key must list the correct letter for every question.
- Matching: generate 8–10 pairs — Column A numbered 1–10, Column B labelled a–j, mixed order so the answers are not sequential. The answer key must list every pair.
- Every sentence, question, and pair must be fully written out — no "etc.", no "example 1", no placeholders. Content must reinforce the target language from languageFocus and be appropriate for ${data.level} level.

Return a JSON object with this exact structure:
{
  "title": "engaging lesson title",
  "overview": {
    "level": "${data.level}",
    "timing": "${data.length} minutes",
    "objectives": ["objective 1", "objective 2", "objective 3"],
    "materials": ["material 1", "material 2"]
  },
  "warmer": {
    "duration": "5 minutes",
    "instructions": "detailed teacher instructions",
    "teacherNotes": "tips and anticipated issues"
  },
  "leadIn": {
    "duration": "5 minutes",
    "instructions": "how to introduce the topic",
    "context": "background or rationale"
  },
  "mainActivity": {
    "duration": "20 minutes",
    "instructions": "step-by-step instructions",
    "variations": "adaptations for different scenarios",
    "teacherNotes": "management tips"
  },
  "languageFocus": {
    "grammar_or_vocab": "target language item",
    "explanation": "clear teacher-facing explanation",
    "examples": ["example 1", "example 2", "example 3"],
    "commonErrors": ["common mistake 1", "common mistake 2"]
  },
  "l1Notes": {
    "nationality": "${data.nationality}",
    "specificChallenges": ["L1-specific challenge 1", "challenge 2", "challenge 3"],
    "tips": ["teaching tip 1", "tip 2", "tip 3"]
  },
  "culturalNote": {
    "hasCulturalConsideration": true,
    "note": "cultural sensitivity or context note"
  },
  "exercises": [
    {
      "type": "Gap fill",
      "instructions": "student-facing instructions",
      "content": "1. Sentence with _____ blank.\n2. Another sentence with _____.\n3. Third sentence _____ here.\n4. Fourth _____ sentence.\n5. Fifth sentence with _____.\n6. Sixth _____ sentence.\n7. Seventh sentence _____ here.\n8. Eighth sentence with _____.",
      "answerKey": "1. word, 2. word, 3. word, 4. word, 5. word, 6. word, 7. word, 8. word"
    },
    {
      "type": "Multiple choice",
      "instructions": "student-facing instructions",
      "content": "1. Question text here?\n   a) option one\n   b) option two\n   c) option three\n\n2. Second question?\n   a) option one\n   b) option two\n   c) option three\n\n3. Third question?\n   a) option one\n   b) option two\n   c) option three\n\n4. Fourth question?\n   a) option one\n   b) option two\n   c) option three\n\n5. Fifth question?\n   a) option one\n   b) option two\n   c) option three",
      "answerKey": "1. b, 2. a, 3. c, 4. a, 5. b"
    },
    {
      "type": "Matching",
      "instructions": "student-facing instructions",
      "content": "Column A: 1. word/phrase, 2. word/phrase, 3. word/phrase, 4. word/phrase, 5. word/phrase, 6. word/phrase, 7. word/phrase, 8. word/phrase\nColumn B: a. definition/match, b. definition/match, c. definition/match, d. definition/match, e. definition/match, f. definition/match, g. definition/match, h. definition/match",
      "answerKey": "1-c, 2-a, 3-f, 4-b, 5-h, 6-d, 7-g, 8-e"
    }
  ],
  "speakingTask": {
    "duration": "10 minutes",
    "instructions": "student-facing instructions",
    "prompts": ["discussion prompt 1", "prompt 2", "prompt 3"]
  },
  "exitTicket": {
    "instructions": "how to administer",
    "questions": ["quick check question 1", "question 2"]
  },
  "homework": {
    "optional": true,
    "instructions": "clear homework task"
  }
}${classContext ? buildClassContextNote(classContext) : ''}`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    if (!checkRateLimit(userId, 10, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('subscription_status, lessons_used_this_month')
      .eq('id', userId)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const isFree = profile.subscription_status === 'free' || profile.subscription_status === 'cancelled'
    if (isFree && profile.lessons_used_this_month >= 5) {
      return NextResponse.json({ error: 'limit_reached' }, { status: 402 })
    }

    const body: LessonFormData & { classContext?: ClassContext } = await req.json()
    if (!body.level || !body.topic || !body.length || !body.ageGroup || !body.nationality) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 6000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildPrompt(body, body.classContext) },
      ],
    })

    const rawText = response.choices[0].message.content ?? ''
    let lessonContent: LessonContent
    try {
      lessonContent = JSON.parse(rawText)
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
      lessonContent = JSON.parse(jsonMatch[0])
    }

    if (isFree) {
      await supabase.from('users').update({ lessons_used_this_month: profile.lessons_used_this_month + 1 }).eq('id', userId)
    }

    // Track stats for all users (upsert into user_stats)
    const { data: existingStats } = await supabase.from('user_stats').select('total_lessons_created, lessons_this_week, last_weekly_reset').eq('user_id', userId).single()
    const now = new Date()
    const lastReset = existingStats?.last_weekly_reset ? new Date(existingStats.last_weekly_reset) : null
    const weekExpired = !lastReset || (now.getTime() - lastReset.getTime()) > 7 * 24 * 60 * 60 * 1000
    await supabase.from('user_stats').upsert({
      user_id: userId,
      total_lessons_created: (existingStats?.total_lessons_created ?? 0) + 1,
      lessons_this_week: weekExpired ? 1 : (existingStats?.lessons_this_week ?? 0) + 1,
      ...(weekExpired ? { last_weekly_reset: now.toISOString(), worksheets_this_week: 0 } : {}),
    }, { onConflict: 'user_id' })

    return NextResponse.json(lessonContent)
  } catch (error) {
    console.error('[generate-lesson]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
