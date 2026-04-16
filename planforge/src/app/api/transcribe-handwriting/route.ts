import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getOpenAIClient } from '@/lib/openai'

export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value } }
  )
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { imageBase64, mediaType } = await req.json()
  if (!imageBase64) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

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
