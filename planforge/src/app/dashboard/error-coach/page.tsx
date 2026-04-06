'use client'

import { useState } from 'react'
import { STUDENT_LEVELS, NATIONALITIES } from '@/lib/utils'
import { ThinkingLoader } from '@/components/ui/ThinkingLoader'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import { CheckCircle, AlertTriangle, Zap, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

interface ErrorResult {
  correctedText: string
  errors: Array<{
    original: string
    corrected: string
    explanation: string
    type: 'grammar' | 'vocabulary' | 'punctuation' | 'wordOrder' | 'articleUsage'
  }>
  summary: {
    total: number
    byType: { grammar: number; vocabulary: number; punctuation: number; wordOrder: number; articleUsage: number }
  }
  focusRecommendation: string
}

const ERROR_COLORS: Record<string, string> = {
  grammar: 'bg-red-500/20 text-red-300 border-red-500/30',
  vocabulary: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  punctuation: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  wordOrder: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  articleUsage: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
}

const ERROR_LABELS: Record<string, string> = {
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  punctuation: 'Punctuation',
  wordOrder: 'Word Order',
  articleUsage: 'Article Usage',
}

export default function ErrorCoachPage() {
  const [text, setText] = useState('')
  const [level, setLevel] = useState('B1')
  const [nationality, setNationality] = useState('Chinese (Mandarin)')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ErrorResult | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const analyse = async () => {
    if (!text.trim()) { toast.error('Please paste some student writing first.'); return }
    if (text.trim().length < 20) { toast.error('Please enter at least a few sentences.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/correct-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, level, nationality }),
      })
      const data = await res.json()
      if (res.status === 402) { setShowUpgrade(true); return }
      if (!res.ok) { toast.error(data.error || 'Analysis failed. Please try again.'); return }
      setResult(data)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const highlightErrors = (text: string, errors: ErrorResult['errors']) => {
    if (!errors?.length) return text
    let highlighted = text
    errors.forEach(err => {
      const colorClass = err.type === 'grammar' ? 'bg-red-500/30 border-b-2 border-red-400' :
        err.type === 'vocabulary' ? 'bg-purple-500/30 border-b-2 border-purple-400' :
        err.type === 'punctuation' ? 'bg-amber-500/30 border-b-2 border-amber-400' :
        err.type === 'wordOrder' ? 'bg-blue-500/30 border-b-2 border-blue-400' :
        'bg-orange-500/30 border-b-2 border-orange-400'
      highlighted = highlighted.replace(
        err.original,
        `<mark class="${colorClass} px-0.5 rounded" title="${err.explanation}">${err.original}</mark>`
      )
    })
    return highlighted
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-600/15 border border-purple-600/30 rounded-xl flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">Error Correction Coach</h1>
          <p className="text-sm text-[#94A3B8]">Analyse student writing, categorise errors, get focus recommendations</p>
        </div>
      </div>

      {/* Input section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[#94A3B8] mb-2">Student&apos;s Writing</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste your student's writing here...

Example:
Yesterday I go to the market and I buyed a lot of food. The weather was very good and I have been very happy. My friend, she come with me and we eat lunch at a restaurant. It was very delicious food."
            rows={10}
            className="w-full bg-[#1E293B] border border-[#334155] rounded-2xl px-5 py-4 text-sm text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none leading-relaxed"
          />
          <div className="text-xs text-[#475569] mt-1 text-right">{text.split(/\s+/).filter(Boolean).length} words</div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#94A3B8] mb-2">Student Level</label>
            <div className="relative">
              <select value={level} onChange={e => setLevel(e.target.value)} className="w-full appearance-none bg-[#1E293B] border border-[#334155] rounded-xl px-4 py-2.5 text-sm text-[#F8FAFC] focus:outline-none focus:border-teal-500 pr-9">
                {STUDENT_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569] pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#94A3B8] mb-2">Student Nationality</label>
            <div className="relative">
              <select value={nationality} onChange={e => setNationality(e.target.value)} className="w-full appearance-none bg-[#1E293B] border border-[#334155] rounded-xl px-4 py-2.5 text-sm text-[#F8FAFC] focus:outline-none focus:border-teal-500 pr-9">
                {NATIONALITIES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569] pointer-events-none" />
            </div>
          </div>

          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4 space-y-2">
            <div className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Error Types</div>
            {Object.entries(ERROR_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full border ${ERROR_COLORS[key].split(' ').slice(0, 2).join(' ')}`} />
                <span className="text-xs text-[#94A3B8]">{label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={analyse}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all text-sm"
          >
            {loading ? (
              <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Analysing...</>
            ) : <><Zap className="w-4 h-4" />Analyse Writing</>}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-12 flex items-center justify-center">
          <ThinkingLoader />
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Summary bar */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span className="font-semibold text-[#F8FAFC]">{result.summary.total} Error{result.summary.total !== 1 ? 's' : ''} Found</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(result.summary.byType).map(([type, count]) => count > 0 ? (
                  <span key={type} className={`text-xs px-2.5 py-1 rounded-full border font-medium ${ERROR_COLORS[type]}`}>
                    {ERROR_LABELS[type]}: {count}
                  </span>
                ) : null)}
              </div>
            </div>
            {result.focusRecommendation && (
              <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-3">
                <div className="text-xs font-semibold text-teal-400 mb-1">Focus Area Recommendation</div>
                <p className="text-sm text-[#CBD5E1]">{result.focusRecommendation}</p>
              </div>
            )}
          </div>

          {/* Two-column comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-sm font-semibold text-[#F8FAFC]">Original — Errors Highlighted</span>
              </div>
              <div
                className="text-sm text-[#CBD5E1] leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: highlightErrors(text, result.errors) }}
              />
            </div>
            <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-teal-400" />
                <span className="text-sm font-semibold text-[#F8FAFC]">Corrected Version</span>
              </div>
              <p className="text-sm text-[#CBD5E1] leading-relaxed whitespace-pre-wrap">{result.correctedText}</p>
            </div>
          </div>

          {/* Error list */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5">
            <h3 className="font-semibold text-[#F8FAFC] mb-4">Error Explanations</h3>
            <div className="space-y-3">
              {result.errors.map((err, i) => (
                <div key={i} className="flex items-start gap-3 bg-[#0F172A] border border-[#334155] rounded-xl p-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${ERROR_COLORS[err.type]}`}>
                    {ERROR_LABELS[err.type]}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-red-400 text-sm line-through">{err.original}</span>
                      <span className="text-[#475569]">→</span>
                      <span className="text-teal-400 text-sm font-medium">{err.corrected}</span>
                    </div>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">{err.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} toolName="Error Coach" limit={3} />
    </div>
  )
}
