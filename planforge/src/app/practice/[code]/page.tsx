import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PracticeHub } from './PracticeHub'
import type { PracticeSession } from '@/types'

export const dynamic = 'force-dynamic'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

interface Props {
  params: { code: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { data } = await getAdminClient()
      .from('practice_sessions')
      .select('lesson_topic')
      .eq('share_code', params.code)
      .single()

    if (!data) return { title: 'Practice · Tyoutor Pro' }
    return {
      title: `${data.lesson_topic} Practice · Tyoutor Pro`,
      description: 'Practice your English lesson with flashcards, exercises, and AI conversation.',
      robots: { index: true, follow: true },
    }
  } catch {
    return { title: 'Practice · Tyoutor Pro' }
  }
}

export default async function PracticePage({ params }: Props) {
  const db = getAdminClient()
  const { data: session, error } = await db
    .from('practice_sessions')
    .select('*')
    .eq('share_code', params.code)
    .single()

  if (error || !session) notFound()

  // Increment view count (fire and forget)
  db.from('practice_sessions')
    .update({ view_count: (session.view_count ?? 0) + 1 })
    .eq('share_code', params.code)
    .then(() => {})

  return <PracticeHub session={session as PracticeSession} />
}
