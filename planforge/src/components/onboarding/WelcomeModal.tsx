'use client'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Sparkles, Zap, Clock } from 'lucide-react'
import { OnboardingWizard } from './OnboardingWizard'

interface WelcomeModalProps {
  isOpen: boolean
  firstName: string
  onClose: () => void
  onComplete: () => void
}

export function WelcomeModal({ isOpen, firstName, onClose, onComplete }: WelcomeModalProps) {
  const [showWizard, setShowWizard] = useState(false)
  const [skipping, setSkipping] = useState(false)

  const handleSkip = async () => {
    setSkipping(true)
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    } catch {}
    onComplete()
  }

  if (showWizard) {
    return (
      <OnboardingWizard
        isOpen={isOpen}
        onClose={onClose}
        onComplete={onComplete}
      />
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md" disableBackdropClose>
      <div className="flex flex-col items-center gap-5 text-center py-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-600/15 ring-1 ring-teal-500/40">
          <Sparkles className="h-8 w-8 text-teal-600" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome to Tyoutor Pro{firstName ? `, ${firstName}` : ''}! 👋
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed px-2">
            Let&apos;s get you to your first lesson in under 60 seconds.
          </p>
        </div>

        <ul className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-left space-y-3">
          <li className="flex items-start gap-3 text-sm text-gray-700">
            <Zap className="h-4 w-4 flex-shrink-0 text-teal-600 mt-0.5" />
            <span>Answer <strong>3 quick questions</strong> so we can tailor lessons to your students</span>
          </li>
          <li className="flex items-start gap-3 text-sm text-gray-700">
            <Clock className="h-4 w-4 flex-shrink-0 text-teal-600 mt-0.5" />
            <span>Then generate your first lesson plan — takes about 45 seconds</span>
          </li>
        </ul>

        <button
          onClick={() => setShowWizard(true)}
          className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-3.5 rounded-xl transition-colors shadow-lg shadow-teal-600/20"
        >
          Get Started →
        </button>

        <button
          onClick={handleSkip}
          disabled={skipping}
          className="text-xs text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          {skipping ? 'Skipping…' : 'Skip for now'}
        </button>
      </div>
    </Modal>
  )
}
