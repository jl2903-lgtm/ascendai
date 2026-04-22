'use client'

interface Props {
  value: string | null
  submitting: boolean
  onSelect: (v: string) => void
}

const OPTIONS: Array<{ value: string; label: string; sub: string; desc: string }> = [
  { value: 'A2', label: 'Beginner', sub: 'A1–A2', desc: 'Can handle basic expressions and everyday phrases' },
  { value: 'B1', label: 'Intermediate', sub: 'B1–B2', desc: 'Can hold a conversation on familiar topics' },
  { value: 'C1', label: 'Advanced', sub: 'C1–C2', desc: 'Near-fluent, academic or professional use' },
  { value: 'B1', label: 'Mix of levels', sub: 'Varied', desc: "I'll set per-lesson", },
]

export function LevelFocusStep({ value, submitting, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">What level do you teach most?</h2>
        <p className="text-sm text-gray-500 mt-1">Last question — then you&apos;re generating lessons.</p>
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        {OPTIONS.map((opt, i) => {
          const selected = value === opt.value && !submitting
          return (
            <button
              key={`${opt.value}-${i}`}
              onClick={() => onSelect(opt.value)}
              disabled={submitting}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all disabled:opacity-60 ${
                selected
                  ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/20'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div
                className={`flex h-11 w-14 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  selected ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {opt.sub}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-900">{opt.label}</div>
                <div className="text-xs text-gray-500">{opt.desc}</div>
              </div>
            </button>
          )
        })}
      </div>
      {submitting && (
        <p className="text-xs text-center text-teal-600 font-medium">Setting up your workspace…</p>
      )}
    </div>
  )
}
