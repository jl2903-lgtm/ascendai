'use client'

import type { ImagePrompt as TIP } from '@/lib/activities/schema'

export function ImagePrompt({ activity }: { activity: TIP }) {
  return (
    <div className="space-y-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={activity.image_url}
        alt=""
        className="w-full max-h-[420px] object-cover rounded-xl border border-slate-200"
      />
      <p className="text-lg text-slate-900 leading-relaxed">{activity.prompt}</p>
    </div>
  )
}
