import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { ensureProfile } from '@/lib/supabase/ensure-profile'
import { isLegacyUser } from '@/lib/constants'
import { getOpenAIClient } from '@/lib/openai'
import { checkRateLimit } from '@/lib/rate-limit'

// share_code doubles as a capability token — anyone who has it can chat with
// the practice session. Math.random() is guessable; use a CSPRNG and enough
// bits (12 chars of base64url ≈ 72 bits) to make scanning infeasible.
function generateShareCode(): string {
  return randomBytes(9).toString('base64url')
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate-limit + subscription gate. Practice-session creation calls
    // gpt-4o-mini and would otherwise be spam-callable by any signed-in user.
    if (!checkRateLimit(session.user.id, 10, 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    const { profile, error: profileErr } = await ensureProfile<{
      subscription_status: string
      created_at: string | null
    }>(supabase, session, 'subscription_status, created_at')
    if (profileErr || !profile) {
      return NextResponse.json({ error: profileErr ?? 'Profile not found' }, { status: 500 })
    }
    const isPaid = profile.subscription_status === 'pro' || profile.subscription_status === 'trialing'
    // Legacy users get through without a separate counter (this feature
    // predates limits and is bundled with their lesson access).
    if (!isPaid && !isLegacyUser(profile.created_at)) {
      return NextResponse.json({ error: 'subscription_required' }, { status: 402 })
    }

    const body = await req.json()
    const { lessonTitle, lessonTopic, lessonLevel, studentNationality, lessonContent } = body

    if (!lessonTitle || !lessonTopic || !lessonLevel || !lessonContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const extractionPrompt = `You are an ESL materials designer. Extract practice content from this lesson plan for a student self-study session.

Lesson content:
${lessonContent.slice(0, 6000)}

Return valid JSON only (no markdown):
{
  "vocabulary": [
    {"word": "word or phrase", "definition": "clear definition", "example": "natural example sentence using this word"}
  ],
  "grammar_focus": "One sentence describing the main grammar point of this lesson",
  "practice_sentences": [
    {"sentence": "The full sentence with ________ where the target word goes", "blank_word": "the correct word", "hint": "part of speech or short clue"}
  ]
}

Rules:
- vocabulary: extract 8-10 key words/phrases from the lesson, with student-friendly definitions
- grammar_focus: describe the main grammar structure in one clear sentence
- practice_sentences: create exactly 5 fill-in-the-blank sentences testing vocabulary or grammar from this lesson. The sentence must make sense with the blank_word inserted.`

    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 2000,
      messages: [
        { role: 'system', content: 'You are an expert ESL materials designer. Return valid JSON only.' },
        { role: 'user', content: extractionPrompt },
      ],
    })

    const rawText = response.choices[0].message.content ?? ''
    let extracted: { vocabulary: unknown[]; grammar_focus: string; practice_sentences: unknown[] }
    try {
      extracted = JSON.parse(rawText)
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/)
      if (!match) return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
      extracted = JSON.parse(match[0])
    }

    // Generate unique share_code
    let shareCode = generateShareCode()
    let attempts = 0
    while (attempts < 5) {
      const { data: existing } = await supabase.from('practice_sessions').select('id').eq('share_code', shareCode).single()
      if (!existing) break
      shareCode = generateShareCode()
      attempts++
    }

    const { data: saved, error } = await supabase.from('practice_sessions').insert({
      share_code: shareCode,
      user_id: session.user.id,
      lesson_title: lessonTitle,
      lesson_topic: lessonTopic,
      lesson_level: lessonLevel,
      student_nationality: studentNationality || '',
      vocabulary: extracted.vocabulary ?? [],
      grammar_focus: extracted.grammar_focus ?? '',
      practice_sentences: extracted.practice_sentences ?? [],
      lesson_content: lessonContent.slice(0, 8000),
    }).select('share_code').single()

    if (error) throw error
    return NextResponse.json({ shareCode: saved.share_code })
  } catch (error) {
    console.error('[practice/create]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
