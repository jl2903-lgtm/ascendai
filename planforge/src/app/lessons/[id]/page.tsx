import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Play, ClipboardList, Loader2 } from 'lucide-react'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { ActivitiesSchema, type Activity } from '@/lib/activities/schema'
import { LessonPreview } from '@/components/teach/LessonPreview'
import { PlanPreview } from '@/components/teach/PlanPreview'
import { LessonViewActions } from './LessonViewActions'
import type { LessonContent } from '@/types'

export const dynamic = 'force-dynamic'

// Server-rendered lesson view. Reflects the current activities_status:
//  - ready       → "Teach this lesson" + "Rehearse"; preview = activities
//  - generating  → spinner button "Building activities…" (disabled)
//  - not_started → "Teach this lesson" (CTA still works — it triggers Stage 2
//                  generation on the teach route)
//  - failed      → "Teach this lesson" (re-enters the generation screen which
//                  shows the error + Try again)
//
// The scrollable preview shows activities when ready (richer), otherwise
// renders the saved lesson_content via PlanPreview so the page is never empty.
export default async function LessonViewPage({ params }: { params: { id: string } }) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, user_id, title, student_level, topic, lesson_length, student_age_group, student_nationality, lesson_content, activities, activities_status, created_at')
    .eq('id', params.id)
    .single()

  if (!lesson || lesson.user_id !== session.user.id) notFound()

  let activities: Activity[] | null = null
  if (lesson.activities_status === 'ready' && lesson.activities) {
    const parsed = ActivitiesSchema.safeParse(lesson.activities)
    if (parsed.success) activities = parsed.data
  }

  const status = (lesson.activities_status ?? 'not_started') as
    | 'not_started' | 'generating' | 'ready' | 'failed'

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
            {status === 'ready' && activities ? (
              <span className="rounded-full bg-white border border-slate-200 px-3 py-1">{activities.length} activities</span>
            ) : null}
            <span className="rounded-full bg-white border border-slate-200 px-3 py-1">Created {created}</span>
          </div>

          {/* Primary actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            {status === 'generating' ? (
              <button
                disabled
                className="inline-flex items-center gap-2 rounded-xl bg-[#2D6A4F]/70 text-white text-sm font-semibold px-5 py-2.5 cursor-not-allowed"
              >
                <Loader2 className="w-4 h-4 animate-spin" /> Building activities…
              </button>
            ) : (
              <Link
                href={`/lessons/${lesson.id}/teach`}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2D6A4F] hover:bg-[#256048] text-white text-sm font-semibold px-5 py-2.5"
              >
                <Play className="w-4 h-4" /> Teach this lesson
              </Link>
            )}
            {status === 'ready' ? (
              <Link
                href={`/lessons/${lesson.id}/teach?mode=rehearsal`}
                className="inline-flex items-center gap-2 rounded-xl bg-white text-[#2D6A4F] border border-[#2D6A4F] hover:bg-[#2D6A4F]/5 text-sm font-semibold px-5 py-2.5"
              >
                <ClipboardList className="w-4 h-4" /> Rehearse
              </Link>
            ) : null}
            <LessonViewActions lessonId={lesson.id} hasActivities={status === 'ready'} />
          </div>

          {(status === 'not_started' || status === 'failed') && (
            <p className="mt-3 text-xs text-slate-500">
              Interactive activities will be built when you start teaching (about 60–90 seconds).
            </p>
          )}
        </div>

        {/* Scrollable preview */}
        <div className="mt-8 lesson-preview-print-root">
          {activities && activities.length > 0 ? (
            <LessonPreview activities={activities} lessonTitle={lesson.title} />
          ) : lesson.lesson_content ? (
            <PlanPreview lesson={lesson.lesson_content as LessonContent} lessonTitle={lesson.title} />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-slate-600">
              No content yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
