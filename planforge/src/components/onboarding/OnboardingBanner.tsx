'use client'
import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'

interface Props {
  onDismiss?: () => void
}

export function OnboardingBanner({ onDismiss }: Props) {
  const [hidden, setHidden] = useState(false)

  if (hidden) return null

  return (
    <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl px-4 py-3 flex items-start gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-teal-600/15">
        <Sparkles className="h-4 w-4 text-teal-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-teal-900">
          You&apos;re all set! Just add a topic and hit <span className="whitespace-nowrap">Generate Lesson ↓</span>
        </div>
        <div className="text-xs text-teal-700/80 mt-0.5">
          We pre-filled the form with your preferences. Tweak anything you like.
        </div>
      </div>
      <button
        onClick={() => {
          setHidden(true)
          onDismiss?.()
        }}
        aria-label="Dismiss"
        className="text-teal-700/70 hover:text-teal-900 transition-colors flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
