import { redirect } from 'next/navigation'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { ActivitiesSchema } from '@/lib/activities/schema'
import { activitiesFromLegacyPlan } from '@/lib/activities/generate'
import { TeachShell } from '@/components/teach/TeachShell'
import { TeachRunner } from '@/components/teach/TeachRunner'

// Server component — loads the saved lesson, validates activities, falls back
// to a best-effort conversion from the legacy plan if activities is null.
export default async function TeachLessonPage({ params }: { params: { id: string } }) {
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
    redirect('/dashboard/saved')
  }

  return (
    <TeachShell>
      <TeachRunner title={lesson.title} activities={activities} exitHref="/dashboard/saved" />
    </TeachShell>
  )
}
