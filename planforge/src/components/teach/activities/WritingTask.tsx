'use client'

import { useState } from 'react'
import type { WritingTask as TWT } from '@/lib/activities/schema'
import { TutorReveal } from '../TutorReveal'

export function WritingTask({ activity, rehearsal }: { activity: TWT; rehearsal?: boolean }) {
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const wordCount = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length
  const meetsMin = wordCount >= activity.min_words

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-base font-semibold uppercase tracking-wider text-slate-500">Writing</h2>
        <p className="text-lg text-slate-900 mt-1 leading-relaxed">{activity.prompt}</p>
      </header>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Start writing here..."
        rows={8}
        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 leading-relaxed"
      />
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          <span className={meetsMin ? 'text-emerald-700 font-medium' : 'text-slate-600'}>{wordCount}</span>
          <span className="text-slate-400"> / {activity.min_words} words minimum</span>
        </div>
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          disabled={submitted}
          className="bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg"
        >
          {submitted ? 'Submitted' : 'Submit'}
        </button>
      </div>
      <div className="flex flex-wrap items-start gap-3 pt-2">
        {activity.model_answer && (
          <TutorReveal label="Show model answer" hideLabel="Hide model answer" defaultOpen={rehearsal}>
            <div className="whitespace-pre-wrap leading-relaxed">{activity.model_answer}</div>
          </TutorReveal>
        )}
        {activity.tutor_notes && (
          <TutorReveal label="Show tutor notes" hideLabel="Hide tutor notes" variant="tip" defaultOpen={rehearsal}>
            {activity.tutor_notes}
          </TutorReveal>
        )}
        {activity.success_criteria && activity.success_criteria.length > 0 && (
          <TutorReveal label="Show success criteria" hideLabel="Hide success criteria" variant="note" defaultOpen={rehearsal}>
            <div className="space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Success criteria</div>
              <ul className="list-disc pl-5 space-y-1">
                {activity.success_criteria.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          </TutorReveal>
        )}
      </div>
    </div>
  )
}
