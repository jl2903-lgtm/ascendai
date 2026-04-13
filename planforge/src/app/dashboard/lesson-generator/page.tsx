'use client'

import { useState } from 'react'
import { LessonContent, LessonFormData } from '@/types'
import { STUDENT_LEVELS, LESSON_LENGTHS, AGE_GROUPS, NATIONALITIES, CLASS_SIZES, SPECIAL_FOCUS_OPTIONS } from '@/lib/utils'
import { ThinkingLoader } from '@/components/ui/ThinkingLoader'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import { LessonOutput } from '@/components/dashboard/LessonOutput'
import { BookOpen, Zap, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

const defaultForm: LessonFormData = {
  level: 'B1',
  topic: '',
  length: 60,
  ageGroup: 'Adults',
  nationality: 'Chinese (Mandarin)',
  classSize: 'Standard class (7-20)',
  specialFocus: [],
}

export default function LessonGeneratorPage() {
  const [form, setForm] = useState<LessonFormData>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [lesson, setLesson] = useState<LessonContent | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [adjusting, setAdjusting] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.topic.trim()) e.topic = 'Please enter a topic or skill focus'
    return e
  }

  const generate = async (overrides?: Partial<LessonFormData>) => {
    const payload = { ...form, ...overrides }
    const errs = validate()
    if (Object.keys(errs).length && !overrides) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      const res = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.status === 402) { setShowUpgrade(true); return }
      if (res.status === 429) { toast.error('Too many requests. Please wait a moment.'); return }
      if (!res.ok) { toast.error(data.error || 'Failed to generate lesson. Please try again.'); return }
      setLesson(data)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
      setAdjusting(false)
    }
  }

  const handleAdjust = async (type: string) => {
    if (!lesson) return
    setAdjusting(true)
    const adjustments: Record<string, Partial<LessonFormData>> = {
      harder: { level: bumpLevel(form.level, 1) },
      easier: { level: bumpLevel(form.level, -1) },
      shorter: { length: Math.max(30, form.length - 15) },
      longer: { length: Math.min(90, form.length + 15) },
      speaking: { specialFocus: Array.from(new Set([...form.specialFocus, 'More speaking'])) },
      writing: { specialFocus: Array.from(new Set([...form.specialFocus, 'More writing'])) },
    }
    const adj = adjustments[type] || {}
    setForm(f => ({ ...f, ...adj }))
    await generate({ ...form, ...adj, topic: form.topic + ` [Adjusted: ${type}]` })
  }

  const toggleFocus = (val: string) => {
    setForm(f => ({
      ...f,
      specialFocus: f.specialFocus.includes(val) ? f.specialFocus.filter(x => x !== val) : [...f.specialFocus, val],
    }))
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-600/15 border border-teal-600/30 rounded-xl flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lesson Generator</h1>
          <p className="text-sm text-gray-500">Complete, communicative lesson plans in 60 seconds</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form panel */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 sticky top-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Class Details</h2>

            {/* Level */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Student Level</label>
              <div className="relative">
                <select
                  value={form.level}
                  onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 pr-9"
                >
                  {STUDENT_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Topic or Skill Focus <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={form.topic}
                onChange={e => { setForm(f => ({ ...f, topic: e.target.value })); if (errors.topic) setErrors({}) }}
                placeholder="e.g. Present Perfect, Job interviews, Travel"
                className={`w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-colors ${errors.topic ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-teal-500 focus:ring-teal-500'}`}
              />
              {errors.topic && <p className="text-red-400 text-xs mt-1">{errors.topic}</p>}
            </div>

            {/* Length */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Lesson Length</label>
              <div className="grid grid-cols-4 gap-1.5">
                {LESSON_LENGTHS.map(l => (
                  <button
                    key={l.value}
                    onClick={() => setForm(f => ({ ...f, length: l.value }))}
                    className={`py-2 rounded-lg text-xs font-medium transition-all ${form.length === l.value ? 'bg-teal-600 text-white' : 'bg-gray-50 border border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    {l.value}m
                  </button>
                ))}
              </div>
            </div>

            {/* Age group */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Student Age Group</label>
              <div className="relative">
                <select
                  value={form.ageGroup}
                  onChange={e => setForm(f => ({ ...f, ageGroup: e.target.value }))}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 pr-9"
                >
                  {AGE_GROUPS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Nationality */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Student Nationality / L1</label>
              <div className="relative">
                <select
                  value={form.nationality}
                  onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 pr-9"
                >
                  {NATIONALITIES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Class size */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Class Size</label>
              <div className="relative">
                <select
                  value={form.classSize}
                  onChange={e => setForm(f => ({ ...f, classSize: e.target.value }))}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 pr-9"
                >
                  {CLASS_SIZES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Special focus */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Special Focus <span className="text-gray-400 font-normal">(optional)</span></label>
              <div className="flex flex-wrap gap-2">
                {SPECIAL_FOCUS_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => toggleFocus(o.value)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${form.specialFocus.includes(o.value) ? 'border-teal-500 bg-teal-500/10 text-teal-400' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => generate()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-teal-600/20 text-sm mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Generate Lesson
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output panel */}
        <div className="lg:col-span-3 min-h-[400px]">
          {loading ? (
            <div className="bg-white border border-gray-200 rounded-2xl h-full min-h-[500px] flex items-center justify-center">
              <ThinkingLoader />
            </div>
          ) : lesson ? (
            <LessonOutput
              lesson={lesson}
              formData={form}
              onAdjust={handleAdjust}
              adjusting={adjusting}
            />
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-teal-600/10 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-teal-600/50" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your lesson will appear here</h3>
              <p className="text-sm text-gray-500 max-w-xs">Fill in your class details and click Generate Lesson to create a complete, communicative lesson plan in seconds.</p>
              <div className="mt-6 grid grid-cols-2 gap-2 w-full max-w-xs">
                {['Warmer Activity', 'Language Focus', 'Main Task', 'Exit Ticket'].map(s => (
                  <div key={s} className="bg-gray-50 rounded-xl p-3 text-xs text-gray-400 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-700" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} toolName="Lesson Generator" limit={5} />
    </div>
  )
}

function bumpLevel(current: string, dir: 1 | -1): string {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const idx = levels.indexOf(current)
  return levels[Math.max(0, Math.min(levels.length - 1, idx + dir))]
}
