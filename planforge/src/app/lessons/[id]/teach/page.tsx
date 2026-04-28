import { redirect } from 'next/navigation'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { ActivitiesSchema } from '@/lib/activities/schema'
import { activitiesFromLegacyPlan } from '@/lib/activities/generate'
import { TeachShell } from '@/components/teach/TeachShell'
import { TeachRunner } from '@/components/teach/TeachRunner'

// Server component — loads the saved lesson, validates activities, falls back
// to a best-effort conversion from the legacy plan if activities is null.
//
// Honors ?mode=rehearsal — opens the runner with the tutor panel expanded,
// the amber rehearsal banner, and all hidden tutor content revealed.
export default async function TeachLessonPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { mode?: string; step?: string }
}) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, user_id, title, lesson_content, activities')
    .eq('id', params.id)
    .single()

  if (!lesson || lesson.user_id !== session.user.id) {
    redirect('/dashboard/saved')
  }

  // Prefer the structured activities column. If it's null or fails validation
  // (legacy / corrupt row), derive activities from lesson_content so the
  // teacher still has something to run — they can click "Regenerate as
  // activities" later for a richer flow.
  let activities = null as null | ReturnType<typeof ActivitiesSchema.parse>
  if (lesson.activities) {
    const parsed = ActivitiesSchema.safeParse(lesson.activities)
    if (parsed.success) activities = parsed.data
  }
  if (!activities && lesson.lesson_content) {
    activities = activitiesFromLegacyPlan(lesson.lesson_content as any)
  }

  if (!activities || activities.length === 0) {
    redirect(`/lessons/${params.id}`)
  }

  const rehearsal = searchParams?.mode === 'rehearsal'
  // Exit goes back to the lesson view (per re-entry bug fix), not the dashboard.
  const exitHref = `/lessons/${params.id}`
  // Live href drops mode=rehearsal, preserves step (TeachRunner adds it).
  const liveHref = `/lessons/${params.id}/teach`

  return (
    <TeachShell>
      <TeachRunner
        title={lesson.title}
        activities={activities}
        exitHref={exitHref}
        rehearsal={rehearsal}
        liveHref={rehearsal ? liveHref : undefined}
      />
    </TeachShell>
  )
}
