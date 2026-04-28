'use client'

import { useState, ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'

// Hidden-by-default reveal block. The button text is intentionally subtle so
// a student watching the screen-share can't read the answer at a glance, but
// the teacher can find and click it. Used for inline answer reveals.
export function TutorReveal({
  label = 'Show answer',
  hideLabel,
  children,
  variant = 'answer',
}: {
  label?: string
  hideLabel?: string
  children: ReactNode
  variant?: 'answer' | 'tip' | 'note'
}) {
  const [open, setOpen] = useState(false)

  const tone =
    variant === 'tip'
      ? 'bg-amber-50 border-l-4 border-amber-500'
      : variant === 'note'
        ? 'bg-slate-50 border-l-4 border-slate-400'
        : 'bg-emerald-50 border-l-4 border-emerald-500'

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 rounded-md px-2.5 py-1 bg-white"
      >
        {open ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        {open ? (hideLabel ?? 'Hide') : label}
      </button>
      {open && (
        <div className={`${tone} rounded-md p-3 text-sm text-slate-800`}>
          {children}
        </div>
      )}
    </div>
  )
}
