'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import type { MultipleChoice as TMC } from '@/lib/activities/schema'
import { TutorReveal } from '../TutorReveal'

export function MultipleChoice({ activity, flashAnswer }: { activity: TMC; flashAnswer?: number }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [showCorrect, setShowCorrect] = useState(false)
  const correct = activity.correct_index
  const reveal = showCorrect || (flashAnswer != null && flashAnswer > 0)

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-slate-900">{activity.question}</h2>
      <ul className="space-y-2.5">
        {activity.options.map((opt, i) => {
          const isSelected = selected === i
          const isCorrect = reveal && i === correct
          const isWrong = reveal && isSelected && i !== correct
          const cls = isCorrect
            ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
            : isWrong
              ? 'bg-rose-50 border-rose-400 text-rose-900'
              : isSelected
                ? 'bg-slate-100 border-slate-400 text-slate-900'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => setSelected(i)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${cls}`}
              >
                <span className={`flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-xs font-semibold ${isCorrect ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 text-slate-600 bg-white'}`}>
                  {isCorrect ? <Check className="w-4 h-4" /> : String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => setShowCorrect(s => !s)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 rounded-md px-2.5 py-1 bg-white"
        >
          {showCorrect ? 'Hide correct answer' : 'Show correct answer'}
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
