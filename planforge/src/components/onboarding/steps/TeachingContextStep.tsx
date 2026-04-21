'use client'
import { User, Users, Shuffle } from 'lucide-react'

type TeachingContext = 'private_tutor' | 'classroom' | 'both'

interface Props {
  value: TeachingContext | null
  onSelect: (v: TeachingContext) => void
}

const OPTIONS: Array<{ value: TeachingContext; label: string; desc: string; Icon: typeof User }> = [
  { value: 'private_tutor', label: 'Private tutor', desc: '1-on-1 or very small groups', Icon: User },
  { value: 'classroom', label: 'Classroom teacher', desc: 'Standard class sizes (7-20+)', Icon: Users },
  { value: 'both', label: 'A bit of both', desc: 'Mix of private and classroom', Icon: Shuffle },
]

export function TeachingContextStep({ value, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Where do you teach?</h2>
        <p className="text-sm text-gray-500 mt-1">This helps us suggest the right class size.</p>
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        {OPTIONS.map(({ value: v, label, desc, Icon }) => {
          const selected = value === v
          return (
            <button
              key={v}
              onClick={() => onSelect(v)}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                selected
                  ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/20'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                  selected ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900">{label}</div>
                <div className="text-xs text-gray-500">{desc}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
