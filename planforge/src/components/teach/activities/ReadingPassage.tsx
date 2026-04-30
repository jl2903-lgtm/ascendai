'use client'

import { useState } from 'react'
import type { ReadingPassage as TReading } from '@/lib/activities/schema'
import { TutorReveal } from '../TutorReveal'
import { ActivityImage } from '../ActivityImage'

export function ReadingPassage({ activity, rehearsal }: { activity: TReading; rehearsal?: boolean }) {
  const [showExtra, setShowExtra] = useState(!!rehearsal)
  const extras = activity.extra_paragraphs ?? []
  const hooks = activity.comprehension_hooks ?? []
  // [IMG-DEBUG] Layer 7: component-level render log (browser console).
  if (typeof window !== 'undefined') {
    console.log('[IMG-DEBUG] ReadingPassage rendering', {
      activityId: activity.id,
      title: activity.title,
      image_url: activity.image_url ?? null,
      image_query: activity.image_query ?? null,
    })
  }

  return (
    <article className="space-y-5">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">{activity.title}</h2>
      </header>
      <ActivityImage src={activity.image_url} decorative aspect="max-h-80" />
      <p className="text-base leading-relaxed text-slate-800 whitespace-pre-wrap">{activity.body}</p>
      {extras.length > 0 && (
        <div className="space-y-3">
          {showExtra && extras.map((p, i) => (
            <p key={i} className="text-base leading-relaxed text-slate-800 whitespace-pre-wrap">{p}</p>
          ))}
          <button
            type="button"
            onClick={() => setShowExtra(s => !s)}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 rounded-md px-2.5 py-1 bg-white"
          >
            {showExtra ? 'Hide extra paragraphs' : `Show ${extras.length} more paragraph${extras.length === 1 ? '' : 's'}`}
          </button>
        </div>
      )}
      {hooks.length > 0 && (
        <TutorReveal label="Show check-in questions" hideLabel="Hide check-in questions" variant="tip" defaultOpen={rehearsal}>
          <div className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">Mid-read check-ins</div>
            <ul className="space-y-1.5 list-disc pl-5">
              {hooks.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          </div>
        </TutorReveal>
      )}
    </article>
  )
}
