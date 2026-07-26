import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'

import { getOpenAIClient } from '@/lib/openai'
import { checkRateLimit } from '@/lib/rate-limit'
import { FREE_LIMITS } from '@/lib/utils'
import { isLegacyUser } from '@/lib/constants'
import { ensureProfile } from '@/lib/supabase/ensure-profile'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    if (!checkRateLimit(userId, 10, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { profile, error: profileErr } = await ensureProfile<{
      subscription_status: string
      created_at: string | null
      job_assistant_used_this_month: number | null
    }>(supabase, session, 'subscription_status, created_at, job_assistant_used_this_month')

    if (profileErr || !profile) {
      return NextResponse.json({ error: profileErr ?? 'Profile not found' }, { status: 500 })
    }

    const legacy = isLegacyUser(profile.created_at)
    if (legacy) {
      const isPaid = profile.subscription_status === 'pro' || profile.subscription_status === 'trialing'
      if (!isPaid && (profile.job_assistant_used_this_month ?? 0) >= FREE_LIMITS.jobAssistant) {
        return NextResponse.json({ error: 'limit_reached' }, { status: 402 })
      }
    } else {
      const hasAccess = profile.subscription_status === 'trialing' || profile.subscription_status === 'pro'
      if (!hasAccess) {
        return NextResponse.json({ error: 'subscription_required' }, { status: 402 })
      }
    }

    const { type, schoolType, country, experienceLevel, certifications, motivation, schoolValues, classContext } = await req.json()
    if (!country) return NextResponse.json({ error: 'Country is required' }, { status: 400 })

    const isCoverLetter = type === 'cover_letter'
    const docType = isCoverLetter ? 'cover letter' : 'motivation statement'

    const classNote = classContext
      ? `\n- Teaching context: ${classContext.className} — ${classContext.cefrLevel} ${classContext.studentNationality} students, ${classContext.courseType}`
      : ''

    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2048,
      messages: [
        { role: 'system', content: 'You are an expert career coach specialising in TEFL/ESL job applications. Write genuine, human, compelling application materials. No corporate jargon. Return JSON only.' },
        {
          role: 'user',
          content: `Write a professional, genuine ${docType} for an ESL teaching position:
- School type: ${schoolType}
- Country: ${country}
- Experience: ${experienceLevel}
- Certifications: ${certifications || 'None specified'}
- Motivation: ${motivation || 'Not specified'}
${!isCoverLetter && schoolValues ? `- School values: ${schoolValues}` : ''}${classNote}

Warm, genuine tone. Show real passion for teaching. No clichés. Return JSON only:
{
  "content": "the complete ${docType} text, ready to use, formatted with paragraph breaks",
  "tips": ["specific application tip 1", "tip 2", "tip 3"]
}`,
        },
      ],
    })

    const rawText = response.choices[0].message.content ?? ''
    let result
    try {
      result = JSON.parse(rawText)
    } catch {
      const m = rawText.match(/\{[\s\S]*\}/)
      if (!m) return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 })
      result = JSON.parse(m[0])
    }

    // Increment monthly counter for legacy free users
    if (legacy) {
      const isPaid = profile.subscription_status === 'pro' || profile.subscription_status === 'trialing'
      if (!isPaid) {
        await supabase
          .from('users')
          .update({ job_assistant_used_this_month: (profile.job_assistant_used_this_month ?? 0) + 1 })
          .eq('id', userId)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[generate-job-application]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
