import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'

import { getOpenAIClient } from '@/lib/openai'
import { checkRateLimit } from '@/lib/rate-limit'
import type { WorksheetFormData, WorksheetContent, ClassContext } from '@/types'



function buildClassContextNote(ctx: ClassContext): string {
  const lines: string[] = [`\n\nCLASS PROFILE — "${ctx.className}":`]
  lines.push(`- Nationality / L1: ${ctx.studentNationality}`)
  lines.push(`- Age group: ${ctx.studentAgeGroup}`)
  if (ctx.weakAreas.length > 0) lines.push(`- Known weak areas: ${ctx.weakAreas.join(', ')}`)
  if (ctx.focusSkills.length > 0) lines.push(`- Priority skills: ${ctx.focusSkills.join(', ')}`)
  if (ctx.additionalNotes) lines.push(`- Additional context: ${ctx.additionalNotes}`)
  lines.push('Tailor vocabulary choices and example sentences to suit these students.')
  return lines.join('\n')
}

function buildPrompt(data: WorksheetFormData, classContext?: ClassContext | null): string {
  const hasMatching = data.exerciseTypes.some(t => t.toLowerCase().includes('match'))
  const hasReading = data.exerciseTypes.some(t =>
    t.toLowerCase().includes('reading') || t.toLowerCase().includes('comprehension'))

  const criticalRules: string[] = []

  if (hasReading) {
    criticalRules.push(`CRITICAL — Reading comprehension: you MUST include a "passage" field with 150–200 words of real reading text written at ${data.level} level on the topic. This is not a placeholder — write the actual passage. The passage field must appear before "items". Example structure:
{
  "type": "Reading comprehension",
  "instructions": "Read the passage, then answer the questions.",
  "passage": "[150–200 words of actual reading text on the topic at ${data.level} level goes here]",
  "items": ["Question 1?", "Question 2?"],
  "answerKey": ["Answer 1", "Answer 2"]
}`)
  }

  if (hasMatching) {
    criticalRules.push(`CRITICAL — Matching exercises: use "matchingPairs" instead of "items"/"answerKey". Example:
{
  "type": "Matching",
  "instructions": "Match each word to its definition.",
  "items": [],
  "answerKey": [],
  "matchingPairs": [{"word": "term", "definition": "its meaning"}]
}
matchingPairs must have exactly ${data.questionCount} objects with "word" and "definition" fields.`)
  }

  const rulesBlock = criticalRules.length > 0
    ? `\n${criticalRules.map((r, i) => `RULE ${i + 1}: ${r}`).join('\n\n')}\n`
    : ''

  return `Create an ESL/EFL worksheet:
- Exercise Types: ${data.exerciseTypes.join(', ')}
- Topic: ${data.topic}
- CEFR Level: ${data.level}
- Items per exercise: ${data.questionCount}
- Include Answer Key: ${data.includeAnswerKey}
${rulesBlock}
Return JSON only:
{
  "title": "worksheet title",
  "level": "${data.level}",
  "topic": "${data.topic}",
  "exercises": [
    {
      "type": "exercise type name",
      "instructions": "student-facing instructions",
      "items": ["plain text only — no numbers or letters", "plain text only — no numbers or letters"],
      "answerKey": ["plain text only — no numbers or letters", "plain text only — no numbers or letters"]
    }
  ]
}
Create one section per exercise type requested. Each must have exactly ${data.questionCount} items. Make content engaging and topically relevant. items and answerKey entries must be plain text strings with NO leading numbers, letters, or punctuation — the renderer numbers them automatically.${classContext ? buildClassContextNote(classContext) : ''}`
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
      .select('subscription_status')
      .eq('id', userId)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const isFree = profile.subscription_status === 'free' || profile.subscription_status === 'cancelled'

    // Query user_stats early — used for both limit check and post-generation upsert
    const { data: existingStats } = await supabase
      .from('user_stats')
      .select('total_worksheets_created, worksheets_this_week, last_weekly_reset')
      .eq('user_id', userId)
      .single()

    if (isFree && (existingStats?.total_worksheets_created ?? 0) >= 5) {
      return NextResponse.json({ error: 'limit_reached' }, { status: 402 })
    }

    const body: WorksheetFormData & { classContext?: ClassContext } = await req.json()
    if (!body.exerciseTypes?.length || !body.topic || !body.level) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4096,
      messages: [
        { role: 'system', content: 'You are an expert ESL/EFL materials writer. Create engaging, pedagogically sound worksheets. Return valid JSON only, no markdown.' },
        { role: 'user', content: buildPrompt(body, body.classContext) },
      ],
    })

    const rawText = response.choices[0].message.content ?? ''
    let worksheetContent: WorksheetContent
    try {
      worksheetContent = JSON.parse(rawText)
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
      worksheetContent = JSON.parse(jsonMatch[0])
    }

    // Track stats for all users (upsert into user_stats)
    const now = new Date()
    const lastReset = existingStats?.last_weekly_reset ? new Date(existingStats.last_weekly_reset) : null
    const weekExpired = !lastReset || (now.getTime() - lastReset.getTime()) > 7 * 24 * 60 * 60 * 1000
    await supabase.from('user_stats').upsert({
      user_id: userId,
      total_worksheets_created: (existingStats?.total_worksheets_created ?? 0) + 1,
      worksheets_this_week: weekExpired ? 1 : (existingStats?.worksheets_this_week ?? 0) + 1,
      ...(weekExpired ? { last_weekly_reset: now.toISOString(), lessons_this_week: 0 } : {}),
    }, { onConflict: 'user_id' })

    return NextResponse.json(worksheetContent)
  } catch (error) {
    console.error('[generate-worksheet]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
