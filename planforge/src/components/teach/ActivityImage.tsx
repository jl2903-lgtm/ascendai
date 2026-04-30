'use client'

import { useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'

// Renders an activity's image_url with three fail-safe states:
//   - null / empty src        → clean placeholder (no broken-icon)
//   - load error (404, etc.)  → same clean placeholder
//   - decorative=true + no    → returns null (collapses; no layout reservation)
//                  src
//
// Used in ReadingPassage, DiscussionQuestions, ImagePrompt, LessonPreview.
export function ActivityImage({
  src,
  alt = '',
  className = '',
  decorative = false,
  aspect = 'h-64',
}: {
  src?: string | null
  alt?: string
  className?: string
  decorative?: boolean
  aspect?: string
}) {
  const [errored, setErrored] = useState(false)
  const trimmed = (src ?? '').trim()
  const valid = trimmed.length > 0 && /^https?:\/\//.test(trimmed) && !errored

  if (!valid) {
    if (decorative) return null
    return (
      <div
        className={`w-full ${aspect} rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 ${className}`}
        aria-hidden="true"
      >
        <ImageIcon className="w-6 h-6" />
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={trimmed}
      alt={alt}
      className={`w-full object-cover rounded-xl border border-slate-200 ${aspect} ${className}`}
      onError={() => setErrored(true)}
    />
  )
}
