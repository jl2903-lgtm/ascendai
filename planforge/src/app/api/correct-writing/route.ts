import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'

import { getOpenAIClient } from '@/lib/openai'
import { checkRateLimit } from '@/lib/rate-limit'



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
      .select('subscription_status, error_coach_used_this_month')
      .eq('id', userId)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const hasAccess = profile.subscription_status === 'trialing' || profile.subscription_status === 'pro'
    if (!hasAccess) {
      return NextResponse.json({ error: 'subscription_required' }, { status: 402 })
    }

    const { text, level, nationality, classContext } = await req.json()
    if (!text || !level || !nationality) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    if (text.length > 5000) return NextResponse.json({ error: 'Text too long (max 5000 characters)' }, { status: 400 })

    const classNote = classContext
      ? `\n\nClass profile — "${classContext.className}": ${classContext.courseType}${classContext.weakAreas?.length ? `, known weak areas: ${classContext.weakAreas.join(', ')}` : ''}. Factor these into your focus recommendation.`
      : ''

    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4096,
      messages: [
        { role: 'system', content: 'You are an expert EFL writing coach. Analyse student writing, identify errors, and provide clear constructive feedback. Return valid JSON only.' },
        {
          role: 'user',
          content: `Analyse this ${level} student writing from a ${nationality} learner:${classNote}

"""
${text}
"""

Return JSON only:
{
  "correctedText": "fully corrected version of the text",
  "errors": [
    {
      "original": "erroneous phrase or word",
      "corrected": "corrected version",
      "explanation": "clear student-friendly explanation of the error and rule",
      "type": "grammar",
      "position": 0
    }
  ],
  "summary": {
    "total": 0,
    "byType": { "grammar": 0, "vocabulary": 0, "punctuation": 0, "wordOrder": 0, "articleUsage": 0 }
  },
  "focusRecommendation": "2-3 sentence personalised recommendation referencing L1 if relevant"
}
Type must be one of: grammar, vocabulary, punctuation, wordOrder, articleUsage`,
        },
      ],
    })

    const rawText2 = response.choices[0].message.content ?? ''
    let result
    try {
      result = JSON.parse(rawText2)
    } catch {
      const m = rawText2.match(/\{[\s\S]*\}/)
      if (!m) return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 })
      result = JSON.parse(m[0])
    }


    return NextResponse.json(result)
  } catch (error) {
    console.error('[correct-writing]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
