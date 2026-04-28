'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { VocabPresentation as TVP } from '@/lib/activities/schema'

export function VocabPresentation({ activity }: { activity: TVP }) {
  const [idx, setIdx] = useState(0)
  const items = activity.items
  const item = items[idx]

  const prev = () => setIdx(i => Math.max(0, i - 1))
  const next = () => setIdx(i => Math.min(items.length - 1, i + 1))

  return (
    <div className="space-y-6">
      <header className="text-center">
        <div className="text-xs uppercase tracking-wider text-slate-400">Vocabulary</div>
        <div className="text-sm text-slate-500 mt-1">{idx + 1} of {items.length}</div>
      </header>
      <div className="bg-white rounded-2xl border border-slate-200 px-8 py-10 shadow-sm">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h2 className="text-3xl font-bold text-slate-900">{item.word}</h2>
          {item.pos && <span className="text-sm italic text-slate-500">{item.pos}</span>}
          {item.pronunciation && <span className="text-sm text-slate-500 font-mono">{item.pronunciation}</span>}
        </div>
        <p className="mt-5 text-lg text-slate-800 leading-relaxed">{item.definition}</p>
        {item.example && (
          <p className="mt-4 text-base text-slate-600 italic border-l-4 border-teal-500 pl-4">&ldquo;{item.example}&rdquo;</p>
        )}
        {item.collocation && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Collocation</span>
            <span className="font-medium">{item.collocation}</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={prev}
          disabled={idx === 0}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 disabled:opacity-40 rounded-lg px-3 py-1.5 bg-white"
        >
          <ChevronLeft className="w-4 h-4" /> Previous word
        </button>
        <button
          type="button"
          onClick={next}
          disabled={idx === items.length - 1}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 disabled:opacity-40 rounded-lg px-3 py-1.5 bg-white"
        >
          Next word <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
