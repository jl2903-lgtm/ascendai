'use client'

import { useState } from 'react'
import { SCHOOL_TYPES, EXPERIENCE_LEVELS } from '@/lib/utils'
import { ThinkingLoader } from '@/components/ui/ThinkingLoader'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import { Briefcase, Zap, Copy, Download, RefreshCw, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

interface JobResult { content: string; tips: string[] }

export default function JobAssistantPage() {
  const [tab, setTab] = useState<'cover_letter' | 'motivation_statement'>('cover_letter')
  const [form, setForm] = useState({
    schoolType: 'Language school',
    country: '',
    experienceLevel: '1-3 years',
    certifications: '',
    motivation: '',
    schoolValues: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<JobResult | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const generate = async () => {
    if (!form.country.trim()) { setErrors({ country: 'Country is required' }); return }
    setErrors({})
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/generate-job-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type: tab }),
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
    navigator.clipboard.writeText(result.content)
    toast.success('Copied to clipboard!')
  }

  const SelectField = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
    <div>
      <label className="block text-sm font-medium text-[#94A3B8] mb-2">{label}</label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)} className="w-full appearance-none bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-2.5 text-sm text-[#F8FAFC] focus:outline-none focus:border-teal-500 pr-9">
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569] pointer-events-none" />
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-rose-600/15 border border-rose-600/30 rounded-xl flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">Job Application Assistant</h1>
          <p className="text-sm text-[#94A3B8]">Genuine, human cover letters and motivation statements</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-1 flex w-fit">
        {[
          { key: 'cover_letter', label: 'Cover Letter' },
          { key: 'motivation_statement', label: 'Motivation Statement' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key as typeof tab); setResult(null) }}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? 'bg-[#0F172A] text-[#F8FAFC] shadow' : 'text-[#94A3B8] hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 space-y-5 sticky top-6">
            <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider">Your Details</h2>

            <SelectField
              label="Type of School"
              value={form.schoolType}
              onChange={v => setForm(f => ({ ...f, schoolType: v }))}
              options={SCHOOL_TYPES}
            />

            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">Country Applying To <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={form.country}
                onChange={e => { setForm(f => ({ ...f, country: e.target.value })); setErrors({}) }}
                placeholder="e.g. South Korea, Thailand, UAE"
                className={`w-full bg-[#0F172A] border rounded-xl px-4 py-2.5 text-sm text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:ring-1 ${errors.country ? 'border-red-500 focus:ring-red-500' : 'border-[#334155] focus:border-teal-500 focus:ring-teal-500'}`}
              />
              {errors.country && <p className="text-red-400 text-xs mt-1">{errors.country}</p>}
            </div>

            <SelectField
              label="Your Experience Level"
              value={form.experienceLevel}
              onChange={v => setForm(f => ({ ...f, experienceLevel: v }))}
              options={EXPERIENCE_LEVELS}
            />

            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">Certifications <span className="text-[#475569] font-normal">(optional)</span></label>
              <input
                type="text"
                value={form.certifications}
                onChange={e => setForm(f => ({ ...f, certifications: e.target.value }))}
                placeholder="e.g. CELTA, 120-hour TEFL, MA TESOL"
                className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-2.5 text-sm text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">Why do you want to teach there? <span className="text-[#475569] font-normal">(optional)</span></label>
              <textarea
                value={form.motivation}
                onChange={e => setForm(f => ({ ...f, motivation: e.target.value }))}
                placeholder="Any personal reasons, goals, or relevant experience..."
                rows={3}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-2.5 text-sm text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
              />
            </div>

            {tab === 'motivation_statement' && (
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-2">What does this school value? <span className="text-[#475569] font-normal">(optional)</span></label>
                <textarea
                  value={form.schoolValues}
                  onChange={e => setForm(f => ({ ...f, schoolValues: e.target.value }))}
                  placeholder="e.g. communicative approach, student wellbeing, community..."
                  rows={3}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-2.5 text-sm text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
                />
              </div>
            )}

            <button
              onClick={generate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all text-sm"
            >
              {loading ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Writing...</> : <><Zap className="w-4 h-4" />Generate {tab === 'cover_letter' ? 'Cover Letter' : 'Statement'}</>}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="bg-[#1E293B] border border-[#334155] rounded-2xl min-h-[500px] flex items-center justify-center">
              <ThinkingLoader />
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Letter */}
              <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#F8FAFC]">{tab === 'cover_letter' ? 'Cover Letter' : 'Motivation Statement'}</h3>
                  <div className="flex gap-2">
                    <button onClick={generate} className="flex items-center gap-1.5 text-xs border border-[#334155] hover:border-teal-500 text-[#94A3B8] hover:text-white px-3 py-1.5 rounded-lg transition-all">
                      <RefreshCw className="w-3 h-3" /> Regenerate
                    </button>
                  </div>
                </div>
                <div className="bg-[#0F172A] rounded-xl p-5 text-sm text-[#CBD5E1] leading-relaxed whitespace-pre-wrap font-serif">
                  {result.content}
                </div>
              </div>

              {/* Tips */}
              {result.tips?.length > 0 && (
                <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5">
                  <h3 className="font-semibold text-[#F8FAFC] mb-3">Application Tips</h3>
                  <ul className="space-y-2">
                    {result.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#94A3B8]">
                        <span className="text-rose-400 flex-shrink-0">→</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4 flex flex-wrap gap-3">
                <button onClick={handleCopy} className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all">
                  <Copy className="w-4 h-4" />
                  Copy to Clipboard
                </button>
                <button className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border border-[#334155] hover:border-teal-500 text-[#94A3B8] hover:text-white transition-all">
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#1E293B] border border-[#334155] rounded-2xl min-h-[400px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-rose-600/10 rounded-2xl flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-rose-600/50" />
              </div>
              <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">Your {tab === 'cover_letter' ? 'cover letter' : 'motivation statement'} will appear here</h3>
              <p className="text-sm text-[#94A3B8] max-w-xs">Written in a genuine, human tone. No corporate boilerplate. Tailored to the school type and country you&apos;re applying to.</p>
            </div>
          )}
        </div>
      </div>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} toolName="Job Assistant" limit={1} />
    </div>
  )
}
