'use client'

import type { ImagePrompt as TIP } from '@/lib/activities/schema'
import { TutorReveal } from '../TutorReveal'

export function ImagePrompt({ activity, rehearsal }: { activity: TIP; rehearsal?: boolean }) {
  const elicit = activity.vocabulary_to_elicit ?? []
  return (
    <div className="space-y-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={activity.image_url}
        alt=""
        className="w-full max-h-[420px] object-cover rounded-xl border border-slate-200"
      />
      <p className="text-lg text-slate-900 leading-relaxed">{activity.prompt}</p>
      {elicit.length > 0 && (
        <TutorReveal label="Show vocabulary to elicit" hideLabel="Hide vocabulary to elicit" variant="tip" defaultOpen={rehearsal}>
          <div className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">Try to draw out</div>
            <div className="flex flex-wrap gap-2">
              {elicit.map((v, i) => (
                <span key={i} className="rounded-full bg-white border border-amber-300 px-3 py-1 text-sm text-amber-900">{v}</span>
              ))}
            </div>
          </div>
        </TutorReveal>
      )}
    </div>
  )
}
