'use client'

interface Props {
  value: string | null
  onSelect: (v: string) => void
}

const OPTIONS: Array<{ value: string; emoji: string; label: string; desc: string }> = [
  { value: 'Young Learners (5-12)', emoji: '🧒', label: 'Young Learners', desc: 'Ages 5–12' },
  { value: 'Teenagers (13-17)', emoji: '🧑', label: 'Teenagers', desc: 'Ages 13–17' },
  { value: 'Adults', emoji: '👩', label: 'Adults', desc: '18+ general English' },
  { value: 'Business Professionals', emoji: '💼', label: 'Business Pros', desc: 'Professional / business English' },
]

export function AgeGroupStep({ value, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Who do you teach most?</h2>
        <p className="text-sm text-gray-500 mt-1">We&apos;ll default your lessons to this age group.</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {OPTIONS.map(({ value: v, emoji, label, desc }) => {
          const selected = value === v
          return (
            <button
              key={v}
              onClick={() => onSelect(v)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-5 text-center transition-all ${
                selected
                  ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/20'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-3xl mb-1">{emoji}</div>
              <div className="text-sm font-semibold text-gray-900">{label}</div>
              <div className="text-xs text-gray-500">{desc}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
