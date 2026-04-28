'use client'

import type { DiscussionQuestions as TDQ } from '@/lib/activities/schema'

export function DiscussionQuestions({ activity }: { activity: TDQ }) {
  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">{activity.title}</h2>
        {activity.intro && <p className="text-base text-slate-700 mt-2 leading-relaxed">{activity.intro}</p>}
      </header>
      {activity.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={activity.image_url} alt="" className="w-full max-h-72 object-cover rounded-xl border border-slate-200" />
      )}
      <ol className="space-y-4">
        {activity.questions.map((q, i) => (
          <li key={i} className="flex gap-4">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-teal-600 text-white text-sm font-semibold flex items-center justify-center">{i + 1}</span>
            <p className="text-base text-slate-800 leading-relaxed pt-0.5">{q}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
