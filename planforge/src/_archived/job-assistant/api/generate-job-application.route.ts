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
      .select('subscription_status, job_assistant_used_this_month')
      .eq('id', userId)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const isFree = profile.subscription_status === 'free' || profile.subscription_status === 'cancelled'
    if (isFree && profile.job_assistant_used_this_month >= 1) {
      return NextResponse.json({ error: 'limit_reached' }, { status: 402 })
    }

    const { type, schoolType, country, experienceLevel, certifications, motivation, schoolValues, classContext } = await req.json()
    if (!country) return NextResponse.json({ error: 'Country is required' }, { status: 400 })

    const isCoverLetter = type === 'cover_letter'
    const docType = isCoverLetter ? 'cover letter' : 'motivation statement'

    const classNote = classContext
      ? `\n- Teaching context: ${classContext.className} — ${classContext.cefrLevel} ${classContext.studentNationality} students, ${classContext.courseType}`
      : ''

    const response = await getOpenAIClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: 'You are an expert career coach specialising in TEFL/ESL job applications. Write genuine, human, compelling application materials. No corporate jargon. Return JSON only.',
      messages: [{
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
      await supabase.from('users').update({ job_assistant_used_this_month: profile.job_assistant_used_this_month + 1 }).eq('id', userId)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[generate-job-application]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
