'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TeachRunner } from '@/components/teach/TeachRunner'
import { ActivitiesSchema, type Activity } from '@/lib/activities/schema'
import { readDraftLesson } from '@/lib/teach-draft'

export function DraftTeachRunner() {
  const router = useRouter()
  const [state, setState] = useState<{ title: string; activities: Activity[] } | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    const draft = readDraftLesson()
    if (!draft) { setMissing(true); return }
    const parsed = ActivitiesSchema.safeParse(draft.activities)
    if (!parsed.success) { setMissing(true); return }
    setState({ title: draft.title, activities: parsed.data })
  }, [])

  if (missing) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div className="max-w-sm">
          <h2 className="text-lg font-semibold text-slate-800">No lesson loaded</h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Generate a lesson first, then click <strong>Teach this lesson</strong> to start the runner.
          </p>
          <button
            onClick={() => router.push('/dashboard/lesson-generator')}
            className="mt-5 inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            Go to lesson generator
          </button>
        </div>
      </div>
    )
  }

  if (!state) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>

  return <TeachRunner title={state.title} activities={state.activities} exitHref="/dashboard/lesson-generator" />
}
