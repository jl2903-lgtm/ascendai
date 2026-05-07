import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getOpenAIClient } from '@/lib/openai'
import { FREE_LIMITS } from '@/lib/utils'
import { FREE_TRIAL_CUTOFF } from '@/lib/constants'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value } }
  )
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: userProfile } = await supabase
    .from('users')
    .select('subscription_status, created_at, lessons_used_this_month')
    .eq('id', session.user.id)
    .single()

  const isLegacyUser = !!userProfile?.created_at && new Date(userProfile.created_at) < FREE_TRIAL_CUTOFF
  if (isLegacyUser) {
    const isPaid = userProfile?.subscription_status === 'pro' || userProfile?.subscription_status === 'trialing'
    if (!isPaid && (userProfile?.lessons_used_this_month ?? 0) >= FREE_LIMITS.lessons) {
      return NextResponse.json({ error: 'limit_reached' }, { status: 402 })
    }
  } else {
    const hasAccess = userProfile?.subscription_status === 'trialing' || userProfile?.subscription_status === 'pro'
    if (!hasAccess) {
      return NextResponse.json({ error: 'subscription_required' }, { status: 402 })
    }
  }

  const { cvText, jobTitle, jobDescription, targetCountry, experienceLevel } = await req.json()

  if (!cvText?.trim()) return NextResponse.json({ error: 'CV text is required' }, { status: 400 })
  if (!jobTitle?.trim()) return NextResponse.json({ error: 'Job title is required' }, { status: 400 })

  const words = cvText.trim().split(/\s+/)
  const truncated = words.length > 3000
  const processedCv = truncated ? words.slice(0, 3000).join(' ') : cvText

  const prompt = `You are an expert CV reviewer and career coach specialising in English language teaching (ELT) jobs.${truncated ? ' Note: the CV below has been truncated to 3,000 words for processing — your review should reflect only the content provided.' : ''}

Analyse the following CV for a ${jobTitle} position${targetCountry ? ` in ${targetCountry}` : ''}.
${jobDescription ? `\nJob Description:\n${jobDescription}\n` : ''}
Experience Level: ${experienceLevel || 'Not specified'}

CV Text:
${processedCv}

Provide a detailed CV review and optimisation in the following JSON format:
{
  "overallScore": <number 1-10>,
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": [
    {
      "section": "<section name e.g. Summary, Experience, Skills>",
      "issue": "<what is weak or missing>",
      "suggestion": "<specific actionable fix>"
    }
  ],
  "keywordsToAdd": ["<keyword 1>", "<keyword 2>", "<keyword 3>", "<keyword 4>", "<keyword 5>"],
  "rewrittenSummary": "<a rewritten professional summary/objective section of 3-4 sentences tailored to this role>",
  "tailoringTips": ["<tip specific to this country/school type>", "<tip 2>", "<tip 3>"]
}

Be specific and actionable. Focus on ELT-specific requirements like teaching certifications, methodology knowledge, classroom experience, and cultural adaptability.`

  try {
    const message = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.choices[0].message.content ?? ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Invalid response format')
    const result = JSON.parse(jsonMatch[0])

    // Increment usage counter for legacy free users only
    if (isLegacyUser) {
      const isPaid = userProfile?.subscription_status === 'pro' || userProfile?.subscription_status === 'trialing'
      if (!isPaid) {
        await supabase
          .from('users')
          .update({ lessons_used_this_month: (userProfile?.lessons_used_this_month ?? 0) + 1 })
          .eq('id', session.user.id)
      }
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('CV review error:', err)
    return NextResponse.json({ error: 'CV review failed. Please try again.' }, { status: 500 })
  }
}
