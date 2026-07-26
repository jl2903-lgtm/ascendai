import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { getOpenAIClient } from '@/lib/openai'
import { checkRateLimit } from '@/lib/rate-limit'

// Per-message cap (chars). ESL practice turns are short — 1KB is generous
// and stops a caller from stuffing megabytes into a prompt.
const MAX_MESSAGE_CHARS = 1000
// Cap the history we forward to the model, regardless of what the client sent.
const MAX_HISTORY = 10

export async function POST(req: NextRequest) {
  try {
    const { shareCode, messages } = await req.json()
    if (!shareCode || !messages?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (typeof shareCode !== 'string' || shareCode.length > 32) {
      return NextResponse.json({ error: 'Invalid shareCode' }, { status: 400 })
    }
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }
    for (const m of messages) {
      if (typeof m?.content !== 'string' || m.content.length > MAX_MESSAGE_CHARS) {
        return NextResponse.json({ error: 'Message too long' }, { status: 400 })
      }
    }

    // Rate limit by share code + client IP so a scanner can't burn OpenAI
    // spend across many session codes. This route is public by design (students
    // access via a link the teacher gives them) so we can't key on user id.
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown'
    if (!checkRateLimit(`practice:${shareCode}`, 20, 60_000)) {
      return NextResponse.json({ error: 'Session busy — please slow down.' }, { status: 429 })
    }
    if (!checkRateLimit(`practice-ip:${ip}`, 60, 60_000)) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
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
        ...messages.slice(-MAX_HISTORY),
      ],
    })

    const reply = response.choices[0].message.content ?? ''
    return NextResponse.json({ reply })
  } catch (error) {
    console.error('[practice/chat]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
