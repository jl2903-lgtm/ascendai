'use client'

import { useState } from 'react'
import type { ReadingPassage as TReading } from '@/lib/activities/schema'

export function ReadingPassage({ activity }: { activity: TReading }) {
  const [showExtra, setShowExtra] = useState(false)
  const extras = activity.extra_paragraphs ?? []

  return (
    <article className="space-y-5">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">{activity.title}</h2>
      </header>
      {activity.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={activity.image_url} alt="" className="w-full max-h-80 object-cover rounded-xl border border-slate-200" />
      )}
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
    </article>
  )
}
