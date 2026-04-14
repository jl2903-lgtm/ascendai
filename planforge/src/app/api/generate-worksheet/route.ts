import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'

import { getAnthropicClient } from '@/lib/anthropic'
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
  return `Create an ESL/EFL worksheet:
- Exercise Types: ${data.exerciseTypes.join(', ')}
- Topic: ${data.topic}
- CEFR Level: ${data.level}
- Items per exercise: ${data.questionCount}
- Include Answer Key: ${data.includeAnswerKey}

Return JSON only:
{
  "title": "worksheet title",
  "level": "${data.level}",
  "topic": "${data.topic}",
  "exercises": [
    {
      "type": "exercise type name",
      "instructions": "student-facing instructions",
      "items": ["item 1", "item 2", "item 3"],
      "answerKey": ["answer 1", "answer 2", "answer 3"]
    }
  ]
}
Create one section per exercise type requested. Each must have exactly ${data.questionCount} items. Make content engaging and topically relevant.${classContext ? buildClassContextNote(classContext) : ''}`
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
      .select('subscription_status, worksheets_used_this_month')
      .eq('id', userId)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const isFree = profile.subscription_status === 'free' || profile.subscription_status === 'cancelled'
    if (isFree && profile.worksheets_used_this_month >= 5) {
      return NextResponse.json({ error: 'limit_reached' }, { status: 402 })
    }

    const body: WorksheetFormData & { classContext?: ClassContext } = await req.json()
    if (!body.exerciseTypes?.length || !body.topic || !body.level) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const response = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: 'You are an expert ESL/EFL materials writer. Create engaging, pedagogically sound worksheets. Return valid JSON only, no markdown.',
      messages: [{ role: 'user', content: buildPrompt(body, body.classContext) }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    let worksheetContent: WorksheetContent
    try {
      worksheetContent = JSON.parse(rawText)
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
      worksheetContent = JSON.parse(jsonMatch[0])
    }

    if (isFree) {
      await supabase.from('users').update({ worksheets_used_this_month: profile.worksheets_used_this_month + 1 }).eq('id', userId)
    }

    return NextResponse.json(worksheetContent)
  } catch (error) {
    console.error('[generate-worksheet]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
