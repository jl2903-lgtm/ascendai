import { redirect } from 'next/navigation'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { ActivitiesSchema } from '@/lib/activities/schema'
import { TeachShell } from '@/components/teach/TeachShell'
import { TeachRunner } from '@/components/teach/TeachRunner'
import { GenerationScreen } from '@/components/teach/GenerationScreen'

export const dynamic = 'force-dynamic'

// Server component — gates on activities_status.
//   ready      → render the runner (current behavior)
//   not_started / generating / failed → render the GenerationScreen, which
//                  triggers /api/lessons/[id]/generate-activities and polls
//                  /api/lessons/[id] until ready.
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
    .select('id, user_id, title, lesson_content, activities, activities_status, activities_error')
    .eq('id', params.id)
    .single()

  if (!lesson || lesson.user_id !== session.user.id) {
    redirect('/dashboard/saved')
  }

  // [IMG-DEBUG] Layer 6: DB read at teach-page load. Reports image_url for
  // every image-bearing activity exactly as it comes back from Postgres.
  if (Array.isArray(lesson.activities)) {
    (lesson.activities as any[]).forEach((a, i) => {
      const t = a?.type
      if (t === 'reading_passage' || t === 'discussion_questions' || t === 'image_prompt') {
        console.log('[IMG-DEBUG] DB read on teach page', {
          lessonId: lesson.id,
          activityIndex: i,
          activityId: a?.id,
          type: t,
          activities_status: lesson.activities_status,
          image_url: a?.image_url ?? 'NULL_OR_MISSING',
        })
      }
    })
  } else {
    console.log('[IMG-DEBUG] DB read on teach page (no activities array)', {
      lessonId: lesson.id,
      activities_status: lesson.activities_status,
      activitiesType: typeof lesson.activities,
    })
  }

  const teachHref = `/lessons/${params.id}/teach`
  const exitHref = `/lessons/${params.id}`

  // Show generation screen unless activities are populated and validate.
  let activities = null as null | ReturnType<typeof ActivitiesSchema.parse>
  if (lesson.activities_status === 'ready' && lesson.activities) {
    const parsed = ActivitiesSchema.safeParse(lesson.activities)
    if (parsed.success) activities = parsed.data
  }

  if (!activities || activities.length === 0) {
    return (
      <TeachShell>
        <GenerationScreen
          lessonId={lesson.id}
          initialStatus={(lesson.activities_status as any) ?? 'not_started'}
          initialError={lesson.activities_error}
          teachHref={teachHref}
          exitHref={exitHref}
        />
      </TeachShell>
    )
  }

  const rehearsal = searchParams?.mode === 'rehearsal'
  const liveHref = rehearsal ? teachHref : undefined

  return (
    <TeachShell>
      <TeachRunner
        title={lesson.title}
        activities={activities}
        exitHref={exitHref}
        rehearsal={rehearsal}
        liveHref={liveHref}
      />
    </TeachShell>
  )
}
