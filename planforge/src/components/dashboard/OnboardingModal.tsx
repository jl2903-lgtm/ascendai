'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { STUDENT_LEVELS, NATIONALITIES } from '@/lib/utils'
import { BookOpen, Users, Target, ChevronRight } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  onComplete: (prefs: { default_level: string; default_nationality: string; main_goal: string }) => void
}

const steps = [
  { id: 1, icon: BookOpen, title: 'What level do you mainly teach?', subtitle: "We'll pre-fill your forms with this." },
  { id: 2, icon: Users, title: 'Where are your students from?', subtitle: "We'll add L1-specific tips automatically." },
  { id: 3, icon: Target, title: "What's your main goal?", subtitle: 'Help us personalise your experience.' },
]

const GOALS = [
  { value: 'Daily lesson planning', label: '📚 Daily lesson planning', desc: 'I need regular lesson plans for my classes' },
  { value: 'Job interview prep', label: '🎯 Job interview prep', desc: 'I have an interview and need a demo lesson' },
  { value: 'Just exploring', label: '🔍 Just exploring', desc: "I'm curious about what Tyoutor Pro can do" },
]

export function OnboardingModal({ isOpen, onClose, userId, onComplete }: Props) {
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [prefs, setPrefs] = useState({ default_level: 'B1', default_nationality: 'Chinese (Mandarin)', main_goal: 'Daily lesson planning' })
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleComplete = async () => {
    setSaving(true)
    await supabase.from('users').update({ ...prefs, onboarding_completed: true }).eq('id', userId)
    setSaving(false)
    onComplete(prefs)
  }

  const current = steps[step - 1]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {/* Progress dots */}
        <div className="flex gap-2 justify-center mb-8">
          {steps.map(s => (
            <div key={s.id} className={`h-1.5 rounded-full transition-all duration-300 ${s.id === step ? 'w-8 bg-teal-500' : s.id < step ? 'w-4 bg-teal-700' : 'w-4 bg-gray-100'}`} />
          ))}
        </div>

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-teal-600/15 border border-teal-600/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <current.icon className="w-7 h-7 text-teal-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{current.title}</h2>
          <p className="text-sm text-gray-500">{current.subtitle}</p>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-2 gap-2">
            {STUDENT_LEVELS.map(l => (
              <button
                key={l.value}
                onClick={() => setPrefs(p => ({ ...p, default_level: l.value }))}
                className={`p-3 rounded-xl border text-sm font-medium transition-all ${prefs.default_level === l.value ? 'border-teal-500 bg-teal-500/10 text-teal-400' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <select
            value={prefs.default_nationality}
            onChange={e => setPrefs(p => ({ ...p, default_nationality: e.target.value }))}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm"
          >
            {NATIONALITIES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
          </select>
        )}

        {step === 3 && (
          <div className="space-y-3">
            {GOALS.map(g => (
              <button
                key={g.value}
                onClick={() => setPrefs(p => ({ ...p, main_goal: g.value }))}
                className={`w-full p-4 rounded-xl border text-left transition-all ${prefs.main_goal === g.value ? 'border-teal-500 bg-teal-500/10' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="font-medium text-sm text-gray-900">{g.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{g.desc}</div>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-8">
          <button
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-gray-500 transition-colors"
          >
            Skip
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={saving}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
            >
              {saving ? 'Saving...' : "Let's go! 🚀"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
