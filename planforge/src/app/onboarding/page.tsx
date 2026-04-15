'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronRight, BookOpen, Users, BarChart2, Target, Layers, CheckCircle } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { NATIONALITIES, AGE_GROUPS } from '@/lib/utils'
import { cn } from '@/lib/utils'

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const WEAK_AREAS_OPTIONS = [
  'Grammar accuracy', 'Vocabulary range', 'Pronunciation', 'Reading comprehension',
  'Listening skills', 'Writing fluency', 'Speaking confidence', 'Exam technique',
]

const FOCUS_SKILLS_OPTIONS = [
  'Speaking', 'Listening', 'Reading', 'Writing',
  'Grammar', 'Vocabulary', 'Pronunciation', 'Exam prep',
]

const COURSE_TYPES = [
  'General English', 'Business English', 'Exam Preparation', 'Conversation',
  'Academic English', 'Young Learners', 'One-to-one', 'Online',
]

interface FormData {
  class_name: string
  student_nationality: string
  student_age_group: string
  class_size: number
  cefr_level: string
  course_type: string
  textbook: string
  weak_areas: string[]
  focus_skills: string[]
}

const STEPS = [
  { id: 1, icon: BookOpen, title: "What's your class called?", subtitle: 'Give it a name you\'ll recognise, like "Tuesday B2" or "Morning Adults".' },
  { id: 2, icon: Users, title: 'Tell us about your students', subtitle: 'We use this to tailor lessons, activities, and L1 tips.' },
  { id: 3, icon: BarChart2, title: "What's their level?", subtitle: 'Pick the CEFR level that best describes your class.' },
  { id: 4, icon: Target, title: 'What do they struggle with?', subtitle: 'Select any weak areas. We\'ll factor these into every lesson.' },
  { id: 5, icon: Layers, title: 'What should we focus on?', subtitle: 'Choose the skills you want to practise most.' },
  { id: 6, icon: CheckCircle, title: 'Any textbook or course?', subtitle: 'Optional — helps us align materials. You can skip this.' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormData>({
    class_name: '',
    student_nationality: 'Chinese (Mandarin)',
    student_age_group: 'Adults',
    class_size: 15,
    cefr_level: 'B1',
    course_type: 'General English',
    textbook: '',
    weak_areas: [],
    focus_skills: [],
  })

  const toggleChip = (field: 'weak_areas' | 'focus_skills', value: string) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter(v => v !== value)
        : [...f[field], value],
    }))
  }

  const canAdvance = () => {
    if (step === 1) return form.class_name.trim().length > 0
    return true
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      // Create the class profile
      await fetch('/api/class-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          class_size: Number(form.class_size),
          textbook: form.textbook.trim() || null,
        }),
      })

      // Mark onboarding complete
      await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', session.user.id)

      router.push('/dashboard')
    } catch {
      // Still redirect on error — don't block the user
      router.push('/dashboard')
    }
  }

  const handleSkip = async () => {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }
      await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', session.user.id)
    } catch {
      // best-effort
    }
    router.push('/dashboard')
  }

  const current = STEPS[step - 1]
  const Icon = current.icon

  return (
    <div className="relative isolate min-h-screen bg-[#FAFAF8] flex items-center justify-center px-6 py-12">
      {/* Background decorations */}
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-dot-pattern" style={{ zIndex: -1 }} />
      <div className="blob-peach w-72 h-72 top-0 right-0 opacity-50" style={{ position: 'fixed', zIndex: -1 }} />
      <div className="blob-mint w-64 h-64 bottom-0 -left-10 opacity-40" style={{ position: 'fixed', zIndex: -1 }} />

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" href="/" />
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-soft">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step {step} of {STEPS.length}</span>
              <button
                onClick={handleSkip}
                className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
              >
                Skip setup
              </button>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${(step / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon className="w-7 h-7 text-teal-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{current.title}</h2>
            <p className="text-sm text-gray-500 font-medium">{current.subtitle}</p>
          </div>

          {/* Step content */}
          <div className="space-y-4">
            {step === 1 && (
              <input
                type="text"
                value={form.class_name}
                onChange={e => setForm(f => ({ ...f, class_name: e.target.value }))}
                placeholder='e.g. "Tuesday B2 Adults" or "Morning Conversation"'
                autoFocus
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-teal-500 focus:ring-teal-500 font-medium text-sm"
              />
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Student Nationality / L1</label>
                  <select
                    value={form.student_nationality}
                    onChange={e => setForm(f => ({ ...f, student_nationality: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  >
                    {NATIONALITIES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Age Group</label>
                  <div className="grid grid-cols-2 gap-2">
                    {AGE_GROUPS.map(a => (
                      <button
                        key={a.value}
                        onClick={() => setForm(f => ({ ...f, student_age_group: a.value }))}
                        className={cn(
                          'py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all',
                          form.student_age_group === a.value
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        )}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Class Size</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={40}
                      value={form.class_size}
                      onChange={e => setForm(f => ({ ...f, class_size: Number(e.target.value) }))}
                      className="flex-1 accent-teal-600"
                    />
                    <span className="w-10 text-center text-sm font-bold text-gray-900">{form.class_size}</span>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {CEFR_LEVELS.map(l => (
                    <button
                      key={l}
                      onClick={() => setForm(f => ({ ...f, cefr_level: l }))}
                      className={cn(
                        'py-3 rounded-xl border text-sm font-bold transition-all',
                        form.cefr_level === l
                          ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 mt-4">Course Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {COURSE_TYPES.map(c => (
                      <button
                        key={c}
                        onClick={() => setForm(f => ({ ...f, course_type: c }))}
                        className={cn(
                          'py-2 px-3 rounded-xl border text-xs font-semibold transition-all text-left',
                          form.course_type === c
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-wrap gap-2">
                {WEAK_AREAS_OPTIONS.map(area => (
                  <button
                    key={area}
                    onClick={() => toggleChip('weak_areas', area)}
                    className={cn(
                      'px-4 py-2 rounded-full border text-sm font-semibold transition-all',
                      form.weak_areas.includes(area)
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {area}
                  </button>
                ))}
              </div>
            )}

            {step === 5 && (
              <div className="flex flex-wrap gap-2">
                {FOCUS_SKILLS_OPTIONS.map(skill => (
                  <button
                    key={skill}
                    onClick={() => toggleChip('focus_skills', skill)}
                    className={cn(
                      'px-4 py-2 rounded-full border text-sm font-semibold transition-all',
                      form.focus_skills.includes(skill)
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <input
                  type="text"
                  value={form.textbook}
                  onChange={e => setForm(f => ({ ...f, textbook: e.target.value }))}
                  placeholder='e.g. "Headway Upper-Intermediate", "New English File B2"'
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-teal-500 focus:ring-teal-500 font-medium text-sm"
                />
                <p className="text-xs text-gray-400 font-medium">Leave blank if you don't use a set textbook.</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="text-sm text-gray-500 hover:text-gray-700 font-semibold transition-colors"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length ? (
              <button
                onClick={() => canAdvance() && setStep(s => s + 1)}
                disabled={!canAdvance()}
                className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Setting up...
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    Start teaching!
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
