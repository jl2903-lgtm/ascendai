import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { getOpenAIClient } from '@/lib/openai'

export async function POST(req: NextRequest) {
  try {
    const { shareCode, messages } = await req.json()
    if (!shareCode || !messages?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createRouteClient()
    const { data: session } = await supabase
      .from('practice_sessions')
      .select('lesson_topic, lesson_level, student_nationality, grammar_focus, lesson_content')
      .eq('share_code', shareCode)
      .single()

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const systemPrompt = `You are a friendly English language practice partner for ESL students. The student just had a lesson about "${session.lesson_topic}" at ${session.lesson_level} level. Their native language background is ${session.student_nationality || 'various'}. The main grammar focus was: ${session.grammar_focus}.

Only use vocabulary and grammar structures from this lesson. Keep responses short (2-3 sentences max). Be encouraging and gently correct any errors by showing the correct form naturally in your response. Never explain grammar rules directly — just model correct usage. If they make a mistake, respond naturally using the correct form.`

    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-10),
      ],
    })

    const reply = response.choices[0].message.content ?? ''
    return NextResponse.json({ reply })
  } catch (error) {
    console.error('[practice/chat]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
