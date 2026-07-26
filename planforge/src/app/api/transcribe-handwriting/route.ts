import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getOpenAIClient } from '@/lib/openai'
import { checkRateLimit } from '@/lib/rate-limit'
import { ensureProfile } from '@/lib/supabase/ensure-profile'
import { isLegacyUser } from '@/lib/constants'
import { FREE_LIMITS } from '@/lib/utils'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value } }
  )
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!checkRateLimit(session.user.id, 10, 60000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // Subscription gate — same policy as correct-writing (this route is the
  // Error Coach's photo pipeline, so it shares the error_coach counter).
  const { profile, error: profileErr } = await ensureProfile<{
    subscription_status: string
    created_at: string | null
    error_coach_used_this_month: number | null
  }>(supabase, session, 'subscription_status, created_at, error_coach_used_this_month')
  if (profileErr || !profile) {
    return NextResponse.json({ error: profileErr ?? 'Profile not found' }, { status: 500 })
  }
  const isPaid = profile.subscription_status === 'pro' || profile.subscription_status === 'trialing'
  const legacy = isLegacyUser(profile.created_at)
  if (legacy) {
    if (!isPaid && (profile.error_coach_used_this_month ?? 0) >= FREE_LIMITS.errorCoach) {
      return NextResponse.json({ error: 'limit_reached' }, { status: 402 })
    }
  } else if (!isPaid) {
    return NextResponse.json({ error: 'subscription_required' }, { status: 402 })
  }

  const { imageBase64, mediaType } = await req.json()
  if (!imageBase64) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

  // Size cap BEFORE sending to GPT-4o Vision — a 50 MB base64 blob otherwise
  // becomes ~15 MB of image tokens per call. 8 MB base64 ≈ 6 MB decoded image,
  // more than enough for a photo of a page.
  if (typeof imageBase64 !== 'string' || imageBase64.length > 8 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image too large (8 MB max)' }, { status: 413 })
  }

  const validMediaTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const type = validMediaTypes.includes(mediaType) ? mediaType : 'image/jpeg'

  try {
    const message = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${type};base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: 'Please transcribe all handwritten text from this image exactly as written, preserving every error, spelling mistake, and grammatical issue. Do not correct anything. Return only the transcribed text with no commentary, labels, or additional formatting. If you cannot read a word clearly, use [unclear] as a placeholder.',
            },
          ],
        },
      ],
    })

    const transcription = message.choices[0].message.content ?? ''
    return NextResponse.json({ transcription })
  } catch (err) {
    console.error('Transcription error:', err)
    return NextResponse.json({ error: 'Transcription failed. Please try again.' }, { status: 500 })
  }
}
