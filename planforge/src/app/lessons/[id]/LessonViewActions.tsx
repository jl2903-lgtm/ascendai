'use client'

import { useState } from 'react'
import { Download, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { generateLessonPDF } from '@/lib/pdf'
import { ActivitiesSchema } from '@/lib/activities/schema'
import { formatDate } from '@/lib/utils'

// Client-side action buttons for the lesson view page. Handles PDF download
// (refetches the lesson + its validated activities) and the print-preview
// shortcut. Kept in a separate component so the parent stays a server component.
export function LessonViewActions({ lessonId }: { lessonId: string; hasActivities: boolean }) {
  const [downloading, setDownloading] = useState(false)

  const onDownload = async () => {
    setDownloading(true)
    try {
      const supabase = createClient()
      const [{ data: lesson }, { data: { session } }] = await Promise.all([
        supabase
          .from('lessons')
          .select('lesson_content, student_level, topic, created_at, activities')
          .eq('id', lessonId)
          .single(),
        supabase.auth.getSession(),
      ])
      if (!lesson) { toast.error('Lesson not found.'); return }
      const teacherName = session?.user?.user_metadata?.full_name ?? 'Teacher'
      const parsed = ActivitiesSchema.safeParse(lesson.activities)
      await generateLessonPDF(
        lesson.lesson_content as any,
        { level: lesson.student_level, topic: lesson.topic, date: formatDate(lesson.created_at) },
        teacherName,
        parsed.success ? parsed.data : undefined,
      )
    } catch {
      toast.error('PDF generation failed.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onDownload}
        disabled={downloading}
        className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-700 border border-slate-300 hover:border-slate-400 disabled:opacity-50 text-sm font-medium px-4 py-2.5"
      >
        <Download className="w-4 h-4" /> {downloading ? 'Generating…' : 'Download PDF'}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-700 border border-slate-300 hover:border-slate-400 text-sm font-medium px-4 py-2.5"
      >
        <Printer className="w-4 h-4" /> Print preview
      </button>
    </>
  )
}
