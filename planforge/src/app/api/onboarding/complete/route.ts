import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'

const TEACHING_CONTEXTS = ['private_tutor', 'classroom', 'both'] as const
type TeachingContext = (typeof TEACHING_CONTEXTS)[number]

const AGE_GROUPS = [
  'Young Learners (5-12)',
  'Teenagers (13-17)',
  'Adults',
  'Business Professionals',
] as const

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

interface Body {
  teaching_context?: TeachingContext | null
  default_age_group?: string | null
  default_level?: string | null
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as Body

    const update: Record<string, string | boolean | null> = {
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    }

    if (body.teaching_context !== undefined) {
      if (body.teaching_context !== null && !TEACHING_CONTEXTS.includes(body.teaching_context)) {
        return NextResponse.json({ error: 'Invalid teaching_context' }, { status: 400 })
      }
      update.teaching_context = body.teaching_context
    }

    if (body.default_age_group !== undefined) {
      if (body.default_age_group !== null && !AGE_GROUPS.includes(body.default_age_group as typeof AGE_GROUPS[number])) {
        return NextResponse.json({ error: 'Invalid default_age_group' }, { status: 400 })
      }
      update.default_age_group = body.default_age_group
    }

    if (body.default_level !== undefined) {
      if (body.default_level !== null && !LEVELS.includes(body.default_level as typeof LEVELS[number])) {
        return NextResponse.json({ error: 'Invalid default_level' }, { status: 400 })
      }
      update.default_level = body.default_level
    }

    const { error } = await supabase
      .from('users')
      .update(update)
      .eq('id', session.user.id)

    if (error) {
      console.error('[onboarding/complete]', error)
      return NextResponse.json({ error: 'Failed to save onboarding' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[onboarding/complete]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
