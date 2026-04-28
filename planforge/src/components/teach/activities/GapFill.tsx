'use client'

import { useMemo, useState, Fragment } from 'react'
import type { GapFill as TGap } from '@/lib/activities/schema'
import { TutorReveal } from '../TutorReveal'

interface SegmentText { kind: 'text'; text: string }
interface SegmentBlank { kind: 'blank'; index: number }
type Segment = SegmentText | SegmentBlank

// Parse "I can't stop {{0}} The Great British Bake Off." into a list of
// alternating text / blank segments. Tolerates malformed input by treating
// unknown placeholders as plain text.
function splitTemplate(tpl: string): Segment[] {
  const out: Segment[] = []
  const re = /\{\{(\d+)\}\}/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(tpl)) != null) {
    if (m.index > last) out.push({ kind: 'text', text: tpl.slice(last, m.index) })
    out.push({ kind: 'blank', index: parseInt(m[1], 10) })
    last = m.index + m[0].length
  }
  if (last < tpl.length) out.push({ kind: 'text', text: tpl.slice(last) })
  return out
}

export function GapFill({ activity, flashAnswer }: { activity: TGap; flashAnswer?: number }) {
  const segments = useMemo(() => splitTemplate(activity.sentence_template), [activity.sentence_template])
  const blankCount = segments.filter(s => s.kind === 'blank').length
  const [filled, setFilled] = useState<Record<number, string>>({})
  const [showAnswers, setShowAnswers] = useState(false)
  const reveal = showAnswers || (flashAnswer != null && flashAnswer > 0)

  const setBlank = (i: number, v: string) => setFilled(p => ({ ...p, [i]: v }))

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold uppercase tracking-wider text-slate-500">Fill in the blanks</h2>
      <p className="text-lg leading-loose text-slate-900">
        {segments.map((s, i) => {
          if (s.kind === 'text') return <Fragment key={i}>{s.text}</Fragment>
          const value = filled[s.index] ?? ''
          const answer = activity.answers[s.index]
          if (reveal) {
            return (
              <span key={i} className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-900 text-base font-medium">
                {answer}
              </span>
            )
          }
          return (
            <input
              key={i}
              type="text"
              value={value}
              onChange={e => setBlank(s.index, e.target.value)}
              className="inline-block w-32 border-b-2 border-slate-400 focus:border-teal-500 outline-none mx-1 text-center bg-transparent text-slate-900"
              aria-label={`blank ${s.index + 1}`}
            />
          )
        })}
      </p>
      {activity.word_bank.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activity.word_bank.map((w, i) => (
            <span key={i} className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-sm text-slate-700">{w}</span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowAnswers(s => !s)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 rounded-md px-2.5 py-1 bg-white"
        >
          {showAnswers ? 'Hide answers' : `Show ${blankCount} answer${blankCount === 1 ? '' : 's'}`}
        </button>
        {activity.tutor_explanation && (
          <TutorReveal label="Show explanation" hideLabel="Hide explanation" variant="tip">
            {activity.tutor_explanation}
          </TutorReveal>
        )}
      </div>
    </div>
  )
}
