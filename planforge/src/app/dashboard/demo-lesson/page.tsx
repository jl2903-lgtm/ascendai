'use client'

import { useState } from 'react'
import { STUDENT_LEVELS, SCHOOL_TYPES, EXPERIENCE_LEVELS, DEMO_LENGTHS } from '@/lib/utils'
import { ThinkingLoader } from '@/components/ui/ThinkingLoader'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import { ClassSelector } from '@/components/dashboard/ClassSelector'
import { ClassProfile, ClassContext } from '@/types'
import { Star, Zap, Download, Copy, ChevronDown, Info, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

// Defined outside component to prevent remounting on every keystroke
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#6B6860] mb-2">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
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
  const [classContext, setClassContext] = useState<ClassContext | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DemoLesson | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleClassSelected = (profile: ClassProfile | null) => {
    if (profile) {
      setForm(f => ({ ...f, level: profile.cefr_level }))
      setClassContext({
        className: profile.class_name,
        cefrLevel: profile.cefr_level,
        studentAgeGroup: profile.student_age_group,
        studentNationality: profile.student_nationality,
        courseType: profile.course_type,
        weakAreas: profile.weak_areas,
        focusSkills: profile.focus_skills,
        additionalNotes: profile.additional_notes ?? undefined,
      })
    } else {
      setClassContext(null)
    }
  }

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
        body: JSON.stringify({ ...form, classContext }),
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
    <div className="relative isolate max-w-5xl mx-auto space-y-6">
      {/* Background decorations */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dot-pattern" style={{ zIndex: -1 }} />
      <div aria-hidden style={{ position:'absolute',width:350,height:350,top:-80,right:-80,borderRadius:'50%',filter:'blur(80px)',background:'radial-gradient(ellipse,#FFE5D9,#FECDA6)',opacity:0.18,pointerEvents:'none',zIndex:-1,animation:'blobFloat 8s ease-in-out 0s infinite alternate' }} />
      <div aria-hidden style={{ position:'absolute',width:280,height:280,bottom:60,left:-60,borderRadius:'50%',filter:'blur(80px)',background:'radial-gradient(ellipse,#D4E8D0,#A7C4A0)',opacity:0.15,pointerEvents:'none',zIndex:-1,animation:'blobFloat 8s ease-in-out 3s infinite alternate' }} />
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-600/15 border border-amber-600/30 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#2D2D2D]">Demo Lesson Builder</h1>
            <p className="text-sm text-[#6B6860]">Interview-ready lesson plans that impress hiring panels</p>
          </div>
        </div>
        <ClassSelector onClassSelected={handleClassSelected} />
      </div>

      {classContext && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-sm text-teal-700 font-medium">
          Using class profile: <strong>{classContext.className}</strong> — {classContext.cefrLevel}, {classContext.studentNationality}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 leading-relaxed font-medium">
          Every stage includes a <strong>&quot;Why this works&quot;</strong> sidebar — so you can speak confidently about your methodology in the interview. Impress with substance, not just presentation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6 space-y-5 sticky top-6">
            <h2 className="text-sm font-semibold text-[#6B6860] uppercase tracking-wider">Interview Details</h2>

            <Field label="Target School Type">
              <div className="relative">
                <select value={form.schoolType} onChange={e => setForm(f => ({ ...f, schoolType: e.target.value }))} className="w-full appearance-none bg-[#F7F6F2] border border-[#E8E4DE] rounded-xl px-4 py-2.5 text-sm text-[#2D2D2D] focus:outline-none focus:border-teal-500 pr-9">
                  {SCHOOL_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8880] pointer-events-none" />
              </div>
            </Field>

            <Field label="Country Applying To" error={errors.country}>
              <input
                type="text"
                value={form.country}
                onChange={e => { setForm(f => ({ ...f, country: e.target.value })); setErrors(p => ({ ...p, country: '' })) }}
                placeholder="e.g. South Korea, Vietnam, Spain"
                className={`w-full bg-[#F7F6F2] border rounded-xl px-4 py-2.5 text-sm text-[#2D2D2D] placeholder-[#8C8880] focus:outline-none focus:ring-1 ${errors.country ? 'border-red-500 focus:ring-red-500' : 'border-[#E8E4DE] focus:border-teal-500 focus:ring-teal-500'}`}
              />
            </Field>

            <Field label="Lesson Topic" error={errors.topic}>
              <input
                type="text"
                value={form.topic}
                onChange={e => { setForm(f => ({ ...f, topic: e.target.value })); setErrors(p => ({ ...p, topic: '' })) }}
                placeholder="e.g. Ordering food in a restaurant"
                className={`w-full bg-[#F7F6F2] border rounded-xl px-4 py-2.5 text-sm text-[#2D2D2D] placeholder-[#8C8880] focus:outline-none focus:ring-1 ${errors.topic ? 'border-red-500 focus:ring-red-500' : 'border-[#E8E4DE] focus:border-teal-500 focus:ring-teal-500'}`}
              />
            </Field>

            <Field label="Student Level">
              <div className="relative">
                <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} className="w-full appearance-none bg-[#F7F6F2] border border-[#E8E4DE] rounded-xl px-4 py-2.5 text-sm text-[#2D2D2D] focus:outline-none focus:border-teal-500 pr-9">
                  {STUDENT_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8880] pointer-events-none" />
              </div>
            </Field>

            <Field label="Demo Length">
              <div className="grid grid-cols-3 gap-1.5">
                {DEMO_LENGTHS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setForm(f => ({ ...f, demoLength: d.value }))}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all ${form.demoLength === d.value ? 'bg-amber-600 text-white' : 'bg-[#F7F6F2] border border-[#E8E4DE] text-[#6B6860] hover:border-[#D4D0CA]'}`}
                  >
                    {d.value}m
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Your Experience Level">
              <div className="relative">
                <select value={form.experienceLevel} onChange={e => setForm(f => ({ ...f, experienceLevel: e.target.value }))} className="w-full appearance-none bg-[#F7F6F2] border border-[#E8E4DE] rounded-xl px-4 py-2.5 text-sm text-[#2D2D2D] focus:outline-none focus:border-teal-500 pr-9">
                  {EXPERIENCE_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8880] pointer-events-none" />
              </div>
            </Field>

            <button
              onClick={generate}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Generating...</> : <><Zap className="w-4 h-4" />Generate Demo Lesson</>}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="glass-card min-h-[500px] flex items-center justify-center">
              <ThinkingLoader />
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Title */}
              <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-[#2D2D2D]">{result.title}</h2>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[result.targetSchool, result.overview.level, result.overview.duration].map(t => (
                    <span key={t} className="text-xs px-2.5 py-1 bg-white border border-[#E8E4DE] rounded-lg text-[#4A473E] font-medium">{t}</span>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="text-xs font-semibold text-[#6B6860] mb-2">Learning Objectives</div>
                  <ul className="space-y-1">
                    {result.overview.objectives.map((o, i) => (
                      <li key={i} className="text-sm text-[#4A473E] flex items-start gap-2">
                        <span className="text-amber-500 flex-shrink-0">•</span> {o}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Lesson stages */}
              <div className="space-y-4">
                {result.stages.map((stage, i) => (
                  <div key={i} className="bg-white border border-[#E8E4DE] rounded-2xl overflow-hidden">
                    <div className="bg-[#F7F6F2] px-5 py-3 flex items-center justify-between border-b border-[#E8E4DE]">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-xs font-bold text-white">{i + 1}</span>
                        <span className="font-semibold text-[#2D2D2D] text-sm">{stage.name}</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-[#6B6860]">
                        <Clock className="w-3 h-3" /> {stage.duration}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E8E4DE]">
                      <div className="p-5">
                        <div className="text-xs font-semibold text-[#6B6860] uppercase tracking-wider mb-2">Activities</div>
                        <p className="text-sm text-[#4A473E] leading-relaxed">{stage.activities}</p>
                      </div>
                      <div className="p-5 bg-amber-50/50">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Info className="w-3.5 h-3.5 text-amber-500" />
                          <div className="text-xs font-semibold text-amber-600">Why This Works</div>
                        </div>
                        <p className="text-sm text-[#4A473E] leading-relaxed italic">{stage.whyItWorks}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interview tips */}
              {result.interviewTips?.length > 0 && (
                <div className="bg-white border border-[#E8E4DE] rounded-2xl p-5">
                  <h3 className="font-semibold text-[#2D2D2D] mb-3">Interview Tips</h3>
                  <ul className="space-y-2">
                    {result.interviewTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#4A473E]">
                        <span className="text-amber-500 flex-shrink-0">💡</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="bg-white border border-[#E8E4DE] rounded-2xl p-4 flex flex-wrap gap-3">
                <button onClick={handleCopy} className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-all">
                  <Copy className="w-4 h-4" />
                  Copy Lesson
                </button>
                <button onClick={() => window.print()} className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border border-[#E8E4DE] hover:border-amber-400 text-[#4A473E] hover:text-amber-700 transition-all">
                  <Download className="w-4 h-4" />
                  Print View
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E8E4DE] rounded-2xl min-h-[400px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-amber-600/10 rounded-2xl flex items-center justify-center mb-4">
                <Star className="w-8 h-8 text-amber-600/50" />
              </div>
              <h3 className="text-lg font-semibold text-[#2D2D2D] mb-2">Build your interview lesson</h3>
              <p className="text-sm text-[#6B6860] max-w-xs">Every stage comes with a methodology explanation to help you speak confidently in your interview. Get the job.</p>
            </div>
          )}
        </div>
      </div>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} toolName="Demo Lesson Builder" limit={1} />
    </div>
  )
}
