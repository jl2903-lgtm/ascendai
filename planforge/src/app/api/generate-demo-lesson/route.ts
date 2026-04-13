import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'

import { getAnthropicClient } from '@/lib/anthropic'
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
      .select('subscription_status, demo_lesson_used_this_month')
      .eq('id', userId)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const isFree = profile.subscription_status === 'free' || profile.subscription_status === 'cancelled'
    if (isFree && profile.demo_lesson_used_this_month >= 1) {
      return NextResponse.json({ error: 'limit_reached' }, { status: 402 })
    }

    const { schoolType, country, topic, level, demoLength, experienceLevel } = await req.json()
    if (!topic || !country) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const response = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: 'You are an expert TEFL trainer who helps teachers ace job interviews. Create polished, methodologically strong demo lesson plans with clear pedagogical explanations. Return valid JSON only.',
      messages: [{
        role: 'user',
        content: `Create an interview-ready ${demoLength}-minute demo lesson for a ${schoolType} in ${country}:
- Topic: ${topic}
- Level: ${level}
- Teacher experience: ${experienceLevel}

Return JSON only:
{
  "title": "lesson title",
  "targetSchool": "${schoolType} in ${country}",
  "overview": {
    "level": "${level}",
    "duration": "${demoLength} minutes",
    "objectives": ["objective 1", "objective 2", "objective 3"],
    "methodology": "brief methodological approach description"
  },
  "stages": [
    {
      "name": "stage name (e.g. Warmer, Presentation, Practice, Production)",
      "duration": "X minutes",
      "activities": "detailed description of teacher and student activities",
      "whyItWorks": "pedagogical rationale — helps the teacher discuss methodology confidently in the interview"
    }
  ],
  "methodologyNotes": "overall notes on methodology for interview discussion",
  "interviewTips": ["interview tip 1", "tip 2", "tip 3"]
}`,
      }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    let result
    try {
      result = JSON.parse(rawText)
    } catch {
      const m = rawText.match(/\{[\s\S]*\}/)
      if (!m) return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 })
      result = JSON.parse(m[0])
    }

    if (isFree) {
      await supabase.from('users').update({ demo_lesson_used_this_month: profile.demo_lesson_used_this_month + 1 }).eq('id', userId)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[generate-demo-lesson]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
