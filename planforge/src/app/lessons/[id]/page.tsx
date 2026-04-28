import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Play, ClipboardList } from 'lucide-react'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { ActivitiesSchema, type Activity } from '@/lib/activities/schema'
import { activitiesFromLegacyPlan } from '@/lib/activities/generate'
import { LessonPreview } from '@/components/teach/LessonPreview'
import { LessonViewActions } from './LessonViewActions'

export const dynamic = 'force-dynamic'

// Server-rendered lesson view. Loads the lesson by id, validates activities,
// falls back to the legacy plan when activities is null, and renders the
// preview + the primary "Teach this lesson" CTA at the top.
export default async function LessonViewPage({ params }: { params: { id: string } }) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, user_id, title, student_level, topic, lesson_length, student_age_group, student_nationality, lesson_content, activities, created_at')
    .eq('id', params.id)
    .single()

  if (!lesson || lesson.user_id !== session.user.id) notFound()

  let activities: Activity[] | null = null
  let activitiesAreFresh = false
  if (lesson.activities) {
    const parsed = ActivitiesSchema.safeParse(lesson.activities)
    if (parsed.success) {
      activities = parsed.data
      activitiesAreFresh = true
    }
  }
  if (!activities && lesson.lesson_content) {
    activities = activitiesFromLegacyPlan(lesson.lesson_content as any)
  }

  const created = new Date(lesson.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="lesson-preview-no-print mb-6">
          <Link
            href="/dashboard/saved"
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> Back to my lessons
          </Link>
        </div>

        {/* Title + meta */}
        <div className="lesson-preview-no-print">
          <h1 className="text-3xl font-bold text-slate-900">{lesson.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded-full bg-white border border-slate-200 px-3 py-1">CEFR {lesson.student_level}</span>
            <span className="rounded-full bg-white border border-slate-200 px-3 py-1">{lesson.lesson_length} min</span>
            <span className="rounded-full bg-white border border-slate-200 px-3 py-1">{lesson.student_age_group}</span>
            <span className="rounded-full bg-white border border-slate-200 px-3 py-1">{lesson.student_nationality}</span>
            <span className="rounded-full bg-white border border-slate-200 px-3 py-1">{activities?.length ?? 0} activities</span>
            <span className="rounded-full bg-white border border-slate-200 px-3 py-1">Created {created}</span>
          </div>

          {/* Primary actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            {activities && activities.length > 0 ? (
              <Link
                href={`/lessons/${lesson.id}/teach`}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2D6A4F] hover:bg-[#256048] text-white text-sm font-semibold px-5 py-2.5"
              >
                <Play className="w-4 h-4" /> Teach this lesson
              </Link>
            ) : null}
            {activities && activities.length > 0 ? (
              <Link
                href={`/lessons/${lesson.id}/teach?mode=rehearsal`}
                className="inline-flex items-center gap-2 rounded-xl bg-white text-[#2D6A4F] border border-[#2D6A4F] hover:bg-[#2D6A4F]/5 text-sm font-semibold px-5 py-2.5"
              >
                <ClipboardList className="w-4 h-4" /> Rehearse
              </Link>
            ) : null}
            <LessonViewActions lessonId={lesson.id} hasActivities={activitiesAreFresh} />
          </div>
        </div>

        {/* Scrollable preview */}
        {activities && activities.length > 0 ? (
          <div className="mt-8 lesson-preview-print-root">
            <LessonPreview activities={activities} lessonTitle={lesson.title} />
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white px-6 py-10 text-center">
            <div className="text-slate-700 font-medium">This lesson doesn&apos;t have activity data yet.</div>
            <p className="text-sm text-slate-500 mt-2">Click &ldquo;Regenerate as activities&rdquo; on the dashboard to enable Teach Mode.</p>
            <Link href="/dashboard/saved" className="inline-block mt-4 text-sm text-teal-700 underline">Go to my lessons</Link>
          </div>
        )}
      </div>
    </div>
  )
}
