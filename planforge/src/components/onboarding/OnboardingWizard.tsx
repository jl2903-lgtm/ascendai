'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { TeachingContextStep } from './steps/TeachingContextStep'
import { AgeGroupStep } from './steps/AgeGroupStep'
import { LevelFocusStep } from './steps/LevelFocusStep'

type TeachingContext = 'private_tutor' | 'classroom' | 'both'

interface OnboardingWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export function OnboardingWizard({ isOpen, onClose, onComplete }: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [teachingContext, setTeachingContext] = useState<TeachingContext | null>(null)
  const [ageGroup, setAgeGroup] = useState<string | null>(null)
  const [level, setLevel] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalSteps = 3

  const persist = async (payload: {
    teaching_context: TeachingContext | null
    default_age_group: string | null
    default_level: string | null
  }) => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to save')
      }
      onComplete()
      router.push('/dashboard/lesson-generator?from=onboarding')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  const handleFinish = (finalLevel: string | null) => {
    persist({
      teaching_context: teachingContext,
      default_age_group: ageGroup,
      default_level: finalLevel,
    })
  }

  const handleSkipAll = () => {
    persist({
      teaching_context: teachingContext,
      default_age_group: ageGroup,
      default_level: level,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg" disableBackdropClose>
      <div className="flex flex-col gap-6">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? 'w-8 bg-teal-600'
                  : i < step
                  ? 'w-4 bg-teal-600/60'
                  : 'w-4 bg-gray-200'
              }`}
            />
          ))}
          <span className="text-xs text-gray-400 ml-2">
            {step + 1} of {totalSteps}
          </span>
        </div>

        {/* Step content */}
        {step === 0 && (
          <TeachingContextStep
            value={teachingContext}
            onSelect={(v) => {
              setTeachingContext(v)
              setStep(1)
            }}
          />
        )}
        {step === 1 && (
          <AgeGroupStep
            value={ageGroup}
            onSelect={(v) => {
              setAgeGroup(v)
              setStep(2)
            }}
          />
        )}
        {step === 2 && (
          <LevelFocusStep
            value={level}
            submitting={submitting}
            onSelect={(v) => {
              setLevel(v)
              handleFinish(v)
            }}
          />
        )}

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        {/* Footer nav */}
        <div className="flex items-center justify-between text-xs">
          {step > 0 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={submitting}
              className="text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
              ← Back
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={handleSkipAll}
            disabled={submitting}
            className="text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>
      </div>
    </Modal>
  )
}
