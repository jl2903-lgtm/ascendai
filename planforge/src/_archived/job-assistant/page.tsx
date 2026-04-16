'use client'

import { useState, useRef } from 'react'
import { SCHOOL_TYPES, EXPERIENCE_LEVELS } from '@/lib/utils'
import { ThinkingLoader } from '@/components/ui/ThinkingLoader'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import { Briefcase, Zap, Copy, Download, RefreshCw, ChevronDown, Upload, FileText, X, Star, Tag, Lightbulb } from 'lucide-react'
import toast from 'react-hot-toast'

// Defined outside component to prevent remounting on every keystroke
function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-2">{label}</label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 pr-9">
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
}

interface JobResult { content: string; tips: string[] }

interface CVReviewResult {
  overallScore: number
  summary: string
  strengths: string[]
  improvements: Array<{ section: string; issue: string; suggestion: string }>
  keywordsToAdd: string[]
  rewrittenSummary: string
  tailoringTips: string[]
}

export default function JobAssistantPage() {
  const [tab, setTab] = useState<'cover_letter' | 'cv_review'>('cover_letter')

  // Cover letter state
  const [form, setForm] = useState({
    schoolType: 'Language school',
    country: '',
    experienceLevel: '1-3 years',
    certifications: '',
    motivation: '',
  })
  const [coverLoading, setCoverLoading] = useState(false)
  const [coverResult, setCoverResult] = useState<JobResult | null>(null)
  const [coverErrors, setCoverErrors] = useState<Record<string, string>>({})

  // CV Review state
  const [cvText, setCvText] = useState('')
  const [cvFileName, setCvFileName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [cvCountry, setCvCountry] = useState('')
  const [cvExperience, setCvExperience] = useState('1-3 years')
  const [cvLoading, setCvLoading] = useState(false)
  const [cvResult, setCvResult] = useState<CVReviewResult | null>(null)
  const [cvErrors, setCvErrors] = useState<Record<string, string>>({})
  const [extracting, setExtracting] = useState(false)

  const [showUpgrade, setShowUpgrade] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Cover Letter ---
  const generateCoverLetter = async () => {
    if (!form.country.trim()) { setCoverErrors({ country: 'Country is required' }); return }
    setCoverErrors({})
    setCoverLoading(true)
    setCoverResult(null)
    try {
      const res = await fetch('/api/generate-job-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type: 'cover_letter' }),
      })
      const data = await res.json()
      if (res.status === 402) { setShowUpgrade(true); return }
      if (!res.ok) { toast.error(data.error || 'Generation failed.'); return }
      setCoverResult(data)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setCoverLoading(false)
    }
  }

  const handleCopyCover = () => {
    if (!coverResult) return
    navigator.clipboard.writeText(coverResult.content)
    toast.success('Copied to clipboard!')
  }

  // --- CV Review ---
  const handleCVFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCvFileName(file.name)
    setExtracting(true)

    // Read file as text (works for plain text; for PDF/DOCX we extract what we can)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      // Basic cleanup of non-printable characters
      const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ').replace(/\s{3,}/g, '\n\n').trim()
      setCvText(cleaned || '')
      setExtracting(false)
      if (cleaned.length < 50) {
        toast.error('Could not extract text from this file. Please paste your CV text manually.')
      } else {
        toast.success('CV text extracted. Review and edit if needed.')
      }
    }
    reader.onerror = () => {
      setExtracting(false)
      toast.error('Could not read file. Please paste your CV text manually.')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const clearCV = () => {
    setCvText('')
    setCvFileName('')
    setCvResult(null)
  }

  const reviewCV = async () => {
    const errs: Record<string, string> = {}
    if (!cvText.trim()) errs.cvText = 'Please paste or upload your CV text'
    if (!jobTitle.trim()) errs.jobTitle = 'Job title is required'
    if (Object.keys(errs).length) { setCvErrors(errs); return }
    setCvErrors({})
    setCvLoading(true)
    setCvResult(null)
    try {
      const res = await fetch('/api/review-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText, jobTitle, jobDescription, targetCountry: cvCountry, experienceLevel: cvExperience }),
      })
      const data = await res.json()
      if (res.status === 402) { setShowUpgrade(true); return }
      if (!res.ok) { toast.error(data.error || 'CV review failed.'); return }
      setCvResult(data)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setCvLoading(false)
    }
  }

  const scoreColor = (score: number) =>
    score >= 8 ? 'text-teal-600' : score >= 6 ? 'text-amber-600' : 'text-red-500'

  const scoreBarColor = (score: number) =>
    score >= 8 ? 'bg-teal-500' : score >= 6 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="relative isolate max-w-5xl mx-auto space-y-6">
      {/* Background decorations */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dot-pattern" style={{ zIndex: -1 }} />
      <div aria-hidden style={{ position:'absolute',width:350,height:350,top:-80,right:-80,borderRadius:'50%',filter:'blur(80px)',background:'radial-gradient(ellipse,#FFE5D9,#FECDA6)',opacity:0.16,pointerEvents:'none',zIndex:-1,animation:'blobFloat 8s ease-in-out 0s infinite alternate' }} />
      <div aria-hidden style={{ position:'absolute',width:280,height:280,bottom:60,left:-60,borderRadius:'50%',filter:'blur(80px)',background:'radial-gradient(ellipse,#F9D5D3,#F4A9A8)',opacity:0.14,pointerEvents:'none',zIndex:-1,animation:'blobFloat 8s ease-in-out 3s infinite alternate' }} />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-rose-600/15 border border-rose-600/30 rounded-xl flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Job Application Assistant</h1>
          <p className="text-sm text-gray-500">Cover letters and CV optimisation for ELT teachers</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card p-1 flex w-fit">
        {[
          { key: 'cover_letter', label: 'Cover Letter' },
          { key: 'cv_review', label: 'CV Review' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? 'bg-gray-50 text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Cover Letter ── */}
      {tab === 'cover_letter' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <div className="glass-card p-6 space-y-5 sticky top-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Your Details</h2>

              <SelectField label="Type of School" value={form.schoolType} onChange={v => setForm(f => ({ ...f, schoolType: v }))} options={SCHOOL_TYPES} />

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Country Applying To <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={form.country}
                  onChange={e => { setForm(f => ({ ...f, country: e.target.value })); setCoverErrors({}) }}
                  placeholder="e.g. South Korea, Thailand, UAE"
                  className={`w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 ${coverErrors.country ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-teal-500 focus:ring-teal-500'}`}
                />
                {coverErrors.country && <p className="text-red-400 text-xs mt-1">{coverErrors.country}</p>}
              </div>

              <SelectField label="Your Experience Level" value={form.experienceLevel} onChange={v => setForm(f => ({ ...f, experienceLevel: v }))} options={EXPERIENCE_LEVELS} />

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Certifications <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="text" value={form.certifications} onChange={e => setForm(f => ({ ...f, certifications: e.target.value }))} placeholder="e.g. CELTA, 120-hour TEFL, MA TESOL" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Why do you want to teach there? <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea value={form.motivation} onChange={e => setForm(f => ({ ...f, motivation: e.target.value }))} placeholder="Any personal reasons, goals, or relevant experience..." rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none" />
              </div>

              <button onClick={generateCoverLetter} disabled={coverLoading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {coverLoading ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Writing...</> : <><Zap className="w-4 h-4" />Generate Cover Letter</>}
              </button>
            </div>
          </div>

          <div className="lg:col-span-3">
            {coverLoading ? (
              <div className="glass-card min-h-[500px] flex items-center justify-center"><ThinkingLoader /></div>
            ) : coverResult ? (
              <div className="space-y-4">
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Cover Letter</h3>
                    <button onClick={generateCoverLetter} className="flex items-center gap-1.5 text-xs border border-gray-200 hover:border-teal-500 text-gray-500 hover:text-teal-600 px-3 py-1.5 rounded-lg transition-all">
                      <RefreshCw className="w-3 h-3" /> Regenerate
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-serif">{coverResult.content}</div>
                </div>
                {coverResult.tips?.length > 0 && (
                  <div className="glass-card p-5">
                    <h3 className="font-semibold text-gray-900 mb-3">Application Tips</h3>
                    <ul className="space-y-2">{coverResult.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-500"><span className="text-rose-400 flex-shrink-0">→</span>{tip}</li>
                    ))}</ul>
                  </div>
                )}
                <div className="glass-card p-4 flex flex-wrap gap-3">
                  <button onClick={handleCopyCover} className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all">
                    <Copy className="w-4 h-4" />Copy to Clipboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-card min-h-[400px] flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-rose-600/10 rounded-2xl flex items-center justify-center mb-4"><Briefcase className="w-8 h-8 text-rose-600/50" /></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cover letter will appear here</h3>
                <p className="text-sm text-gray-500 max-w-xs">Written in a genuine, human tone. No corporate boilerplate. Tailored to the school type and country you&apos;re applying to.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CV Review ── */}
      {tab === 'cv_review' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <div className="glass-card p-6 space-y-5 sticky top-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">CV Details</h2>

              {/* CV Upload / Paste */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Your CV <span className="text-red-400">*</span></label>
                {cvFileName ? (
                  <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5">
                    <FileText className="w-4 h-4 text-teal-600 flex-shrink-0" />
                    <span className="text-sm text-teal-700 font-medium truncate flex-1">{cvFileName}</span>
                    <button onClick={clearCV} className="text-teal-400 hover:text-teal-600 flex-shrink-0"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={extracting}
                    className="w-full flex items-center gap-2 bg-gray-50 border border-dashed border-gray-300 hover:border-teal-400 hover:bg-teal-50/30 rounded-xl px-4 py-2.5 text-sm text-gray-500 hover:text-teal-600 transition-all disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4 flex-shrink-0" />
                    {extracting ? 'Extracting text...' : 'Upload CV (.txt, .pdf, .docx)'}
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept=".txt,.pdf,.docx,text/plain" onChange={handleCVFile} className="hidden" />
                <textarea
                  value={cvText}
                  onChange={e => { setCvText(e.target.value); setCvErrors(p => ({ ...p, cvText: '' })) }}
                  placeholder="Or paste your CV text here..."
                  rows={6}
                  className={`mt-2 w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 resize-none ${cvErrors.cvText ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-teal-500 focus:ring-teal-500'}`}
                />
                {cvErrors.cvText && <p className="text-red-400 text-xs mt-1">{cvErrors.cvText}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Job Title Applying For <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={e => { setJobTitle(e.target.value); setCvErrors(p => ({ ...p, jobTitle: '' })) }}
                  placeholder="e.g. English Teacher, Academic Manager"
                  className={`w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 ${cvErrors.jobTitle ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-teal-500 focus:ring-teal-500'}`}
                />
                {cvErrors.jobTitle && <p className="text-red-400 text-xs mt-1">{cvErrors.jobTitle}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Target Country <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="text" value={cvCountry} onChange={e => setCvCountry(e.target.value)} placeholder="e.g. Japan, Spain, Saudi Arabia" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Job Description <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the job ad text for a more targeted review..." rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none" />
              </div>

              <SelectField label="Your Experience Level" value={cvExperience} onChange={setCvExperience} options={EXPERIENCE_LEVELS} />

              <button onClick={reviewCV} disabled={cvLoading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {cvLoading ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Reviewing...</> : <><Zap className="w-4 h-4" />Optimise My CV</>}
              </button>
            </div>
          </div>

          <div className="lg:col-span-3">
            {cvLoading ? (
              <div className="glass-card min-h-[500px] flex items-center justify-center"><ThinkingLoader /></div>
            ) : cvResult ? (
              <div className="space-y-4">
                {/* Score */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">CV Score</h3>
                    <span className={`text-3xl font-bold ${scoreColor(cvResult.overallScore)}`}>{cvResult.overallScore}<span className="text-base font-normal text-gray-400">/10</span></span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                    <div className={`h-full rounded-full transition-all duration-700 ${scoreBarColor(cvResult.overallScore)}`} style={{ width: `${cvResult.overallScore * 10}%` }} />
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{cvResult.summary}</p>
                </div>

                {/* Strengths */}
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-teal-500" />
                    <h3 className="font-semibold text-gray-900">Strengths</h3>
                  </div>
                  <ul className="space-y-2">
                    {cvResult.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-teal-500 flex-shrink-0 mt-0.5">✓</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <h3 className="font-semibold text-gray-900">Improvements</h3>
                  </div>
                  <div className="space-y-3">
                    {cvResult.improvements.map((imp, i) => (
                      <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="text-xs font-semibold text-amber-700 mb-1">{imp.section}</div>
                        <p className="text-xs text-gray-500 mb-2">{imp.issue}</p>
                        <p className="text-sm text-gray-700"><span className="font-medium text-amber-700">Fix: </span>{imp.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Keywords */}
                {cvResult.keywordsToAdd?.length > 0 && (
                  <div className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-purple-500" />
                      <h3 className="font-semibold text-gray-900">Keywords to Add</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cvResult.keywordsToAdd.map((kw, i) => (
                        <span key={i} className="text-xs px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-full font-medium">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rewritten summary */}
                {cvResult.rewrittenSummary && (
                  <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Rewritten Professional Summary</h3>
                      <button
                        onClick={() => { navigator.clipboard.writeText(cvResult.rewrittenSummary); toast.success('Copied!') }}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-teal-600 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4 font-serif">{cvResult.rewrittenSummary}</p>
                  </div>
                )}

                {/* Tailoring tips */}
                {cvResult.tailoringTips?.length > 0 && (
                  <div className="glass-card p-5">
                    <h3 className="font-semibold text-gray-900 mb-3">Country / Role Tailoring Tips</h3>
                    <ul className="space-y-2">
                      {cvResult.tailoringTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                          <span className="text-rose-400 flex-shrink-0">→</span>{tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="glass-card p-4 flex flex-wrap gap-3">
                  <button onClick={reviewCV} className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all">
                    <RefreshCw className="w-4 h-4" />Re-analyse
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(cvResult.rewrittenSummary); toast.success('Summary copied!') }}
                    className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border border-gray-200 hover:border-teal-400 text-gray-500 hover:text-teal-600 transition-all"
                  >
                    <Download className="w-4 h-4" />Copy Summary
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-card min-h-[400px] flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-rose-600/10 rounded-2xl flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-rose-600/50" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">CV analysis will appear here</h3>
                <p className="text-sm text-gray-500 max-w-xs">Upload or paste your CV, add the job title you&apos;re targeting, and get a detailed score, improvements, missing keywords, and a rewritten professional summary.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} toolName="Job Assistant" limit={1} />
    </div>
  )
}
