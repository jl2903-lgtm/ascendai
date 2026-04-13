'use client'

import { useState } from 'react'
import { STUDENT_LEVELS, SCHOOL_TYPES, EXPERIENCE_LEVELS, DEMO_LENGTHS } from '@/lib/utils'
import { ThinkingLoader } from '@/components/ui/ThinkingLoader'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import { generateLessonPDF } from '@/lib/pdf'
import { Star, Zap, Download, Copy, ChevronDown, Info, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

// Defined outside component to prevent remounting on every keystroke
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-2">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

interface DemoLesson {
  title: string
  targetSchool: string
  overview: { level: string; duration: string; objectives: string[]; methodology: string }
  stages: Array<{ name: string; duration: string; activities: string; whyItWorks: string }>
  methodologyNotes: string
  interviewTips: string[]
}

export default function DemoLessonPage() {
  const [form, setForm] = useState({
    schoolType: 'Language school',
    country: '',
    topic: '',
    level: 'B1',
    demoLength: 20,
    experienceLevel: '1-3 years',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DemoLesson | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.topic.trim()) e.topic = 'Topic is required'
    if (!form.country.trim()) e.country = 'Country is required'
    return e
  }

  const generate = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      const res = await fetch('/api/generate-demo-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.status === 402) { setShowUpgrade(true); return }
      if (!res.ok) { toast.error(data.error || 'Generation failed.'); return }
      setResult(data)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!result) return
    const text = result.stages.map(s => `${s.name} (${s.duration})\n${s.activities}\n\nWhy it works: ${s.whyItWorks}`).join('\n\n---\n\n')
    navigator.clipboard.writeText(`${result.title}\n\n${text}`)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-600/15 border border-amber-600/30 rounded-xl flex items-center justify-center">
          <Star className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Demo Lesson Builder</h1>
          <p className="text-sm text-gray-500">Interview-ready lesson plans that impress hiring panels</p>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-200 leading-relaxed">
          Every stage includes a <strong className="text-amber-300">"Why this works"</strong> sidebar — so you can speak confidently about your methodology in the interview. Impress with substance, not just presentation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 sticky top-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Interview Details</h2>

            <Field label="Target School Type">
              <div className="relative">
                <select value={form.schoolType} onChange={e => setForm(f => ({ ...f, schoolType: e.target.value }))} className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 pr-9">
                  {SCHOOL_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </Field>

            <Field label="Country Applying To" error={errors.country}>
              <input
                type="text"
                value={form.country}
                onChange={e => { setForm(f => ({ ...f, country: e.target.value })); setErrors(p => ({ ...p, country: '' })) }}
                placeholder="e.g. South Korea, Vietnam, Spain"
                className={`w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 ${errors.country ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-teal-500 focus:ring-teal-500'}`}
              />
            </Field>

            <Field label="Lesson Topic" error={errors.topic}>
              <input
                type="text"
                value={form.topic}
                onChange={e => { setForm(f => ({ ...f, topic: e.target.value })); setErrors(p => ({ ...p, topic: '' })) }}
                placeholder="e.g. Ordering food in a restaurant"
                className={`w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 ${errors.topic ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-teal-500 focus:ring-teal-500'}`}
              />
            </Field>

            <Field label="Student Level">
              <div className="relative">
                <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 pr-9">
                  {STUDENT_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </Field>

            <Field label="Demo Length">
              <div className="grid grid-cols-3 gap-1.5">
                {DEMO_LENGTHS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setForm(f => ({ ...f, demoLength: d.value }))}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all ${form.demoLength === d.value ? 'bg-amber-600 text-white' : 'bg-gray-50 border border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    {d.value}m
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Your Experience Level">
              <div className="relative">
                <select value={form.experienceLevel} onChange={e => setForm(f => ({ ...f, experienceLevel: e.target.value }))} className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 pr-9">
                  {EXPERIENCE_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </Field>

            <button
              onClick={generate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all text-sm"
            >
              {loading ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Generating...</> : <><Zap className="w-4 h-4" />Generate Demo Lesson</>}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="bg-white border border-gray-200 rounded-2xl min-h-[500px] flex items-center justify-center">
              <ThinkingLoader />
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Title */}
              <div className="bg-gradient-to-br from-amber-600/20 to-white border border-amber-600/40 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-gray-900">{result.title}</h2>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[result.targetSchool, result.overview.level, result.overview.duration].map(t => (
                    <span key={t} className="text-xs px-2.5 py-1 bg-gray-100/80 border border-gray-200 rounded-lg text-gray-500">{t}</span>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="text-xs font-semibold text-gray-500 mb-2">Learning Objectives</div>
                  <ul className="space-y-1">
                    {result.overview.objectives.map((o, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-amber-400 flex-shrink-0">•</span> {o}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Lesson stages */}
              <div className="space-y-4">
                {result.stages.map((stage, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="bg-gray-50 px-5 py-3 flex items-center justify-between border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-xs font-bold text-white">{i + 1}</span>
                        <span className="font-semibold text-gray-900 text-sm">{stage.name}</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" /> {stage.duration}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                      <div className="p-5">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Activities</div>
                        <p className="text-sm text-gray-700 leading-relaxed">{stage.activities}</p>
                      </div>
                      <div className="p-5 bg-amber-500/5">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Info className="w-3.5 h-3.5 text-amber-400" />
                          <div className="text-xs font-semibold text-amber-400">Why This Works</div>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed italic">{stage.whyItWorks}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interview tips */}
              {result.interviewTips?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">Interview Tips</h3>
                  <ul className="space-y-2">
                    {result.interviewTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-amber-400 flex-shrink-0">💡</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap gap-3">
                <button onClick={handleCopy} className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-all">
                  <Copy className="w-4 h-4" />
                  Copy Lesson
                </button>
                <button className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border border-gray-200 hover:border-teal-500 text-gray-500 hover:text-white transition-all">
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl min-h-[400px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-amber-600/10 rounded-2xl flex items-center justify-center mb-4">
                <Star className="w-8 h-8 text-amber-600/50" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Build your interview lesson</h3>
              <p className="text-sm text-gray-500 max-w-xs">Every stage comes with a methodology explanation to help you speak confidently in your interview. Get the job.</p>
            </div>
          )}
        </div>
      </div>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} toolName="Demo Lesson Builder" limit={1} />
    </div>
  )
}
