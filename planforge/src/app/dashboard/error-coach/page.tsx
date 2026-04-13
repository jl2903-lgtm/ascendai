'use client'

import { useState, useRef } from 'react'
import { STUDENT_LEVELS, NATIONALITIES } from '@/lib/utils'
import { ThinkingLoader } from '@/components/ui/ThinkingLoader'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import { CheckCircle, AlertTriangle, Zap, ChevronDown, Camera, X, ImageIcon } from 'lucide-react'
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
  grammar: 'bg-red-500/20 text-red-600 border-red-500/30',
  vocabulary: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
  punctuation: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
  wordOrder: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  articleUsage: 'bg-orange-500/20 text-orange-600 border-orange-500/30',
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
  const [transcribing, setTranscribing] = useState(false)
  const [result, setResult] = useState<ErrorResult | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file.'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB.'); return }

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      setPhotoPreview(dataUrl)

      // Strip the data URL prefix to get raw base64
      const base64 = dataUrl.split(',')[1]
      const mediaType = file.type

      setTranscribing(true)
      try {
        const res = await fetch('/api/transcribe-handwriting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mediaType }),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error || 'Transcription failed.'); return }
        setText(data.transcription)
        toast.success('Handwriting transcribed! Review and edit if needed.')
      } catch {
        toast.error('Something went wrong during transcription.')
      } finally {
        setTranscribing(false)
      }
    }
    reader.readAsDataURL(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const clearPhoto = () => {
    setPhotoPreview(null)
    setText('')
  }

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
      const colorClass = err.type === 'grammar' ? 'bg-red-100 border-b-2 border-red-400' :
        err.type === 'vocabulary' ? 'bg-purple-100 border-b-2 border-purple-400' :
        err.type === 'punctuation' ? 'bg-amber-100 border-b-2 border-amber-400' :
        err.type === 'wordOrder' ? 'bg-blue-100 border-b-2 border-blue-400' :
        'bg-orange-100 border-b-2 border-orange-400'
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
          <h1 className="text-xl font-bold text-gray-900">Error Correction Coach</h1>
          <p className="text-sm text-gray-500">Analyse student writing, categorise errors, get focus recommendations</p>
        </div>
      </div>

      {/* Input section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-3">
          {/* Photo upload area */}
          {photoPreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
              <img src={photoPreview} alt="Uploaded handwriting" className="w-full max-h-48 object-contain" />
              <button
                onClick={clearPhoto}
                className="absolute top-2 right-2 w-7 h-7 bg-gray-900/60 hover:bg-gray-900/80 rounded-full flex items-center justify-center transition-colors"
                title="Remove photo"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
              {transcribing && (
                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm font-medium text-purple-600">Transcribing handwriting...</span>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 bg-white border border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50/30 rounded-2xl px-5 py-3.5 text-sm text-gray-500 hover:text-purple-600 transition-all"
            >
              <ImageIcon className="w-4 h-4 flex-shrink-0" />
              <span>Upload a photo of handwritten work — AI will transcribe it automatically</span>
              <Camera className="w-4 h-4 flex-shrink-0 ml-auto" />
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          <label className="block text-sm font-medium text-gray-500 mb-1">Student&apos;s Writing</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste your student's writing here, or upload a photo above to transcribe handwriting automatically.

Example:
Yesterday I go to the market and I buyed a lot of food. The weather was very good and I have been very happy. My friend, she come with me and we eat lunch at a restaurant. It was very delicious food."
            rows={10}
            className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none leading-relaxed"
          />
          <div className="text-xs text-gray-400 text-right">{text.split(/\s+/).filter(Boolean).length} words</div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Student Level</label>
            <div className="relative">
              <select value={level} onChange={e => setLevel(e.target.value)} className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 pr-9">
                {STUDENT_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Student Nationality</label>
            <div className="relative">
              <select value={nationality} onChange={e => setNationality(e.target.value)} className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 pr-9">
                {NATIONALITIES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Error Types</div>
            {Object.entries(ERROR_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full border ${ERROR_COLORS[key].split(' ').slice(0, 2).join(' ')}`} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={analyse}
            disabled={loading || transcribing}
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
        <div className="bg-white border border-gray-200 rounded-2xl p-12 flex items-center justify-center">
          <ThinkingLoader />
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Summary bar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span className="font-semibold text-gray-900">{result.summary.total} Error{result.summary.total !== 1 ? 's' : ''} Found</span>
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
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
                <div className="text-xs font-semibold text-teal-600 mb-1">Focus Area Recommendation</div>
                <p className="text-sm text-gray-700">{result.focusRecommendation}</p>
              </div>
            )}
          </div>

          {/* Two-column comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-sm font-semibold text-gray-900">Original — Errors Highlighted</span>
              </div>
              <div
                className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: highlightErrors(text, result.errors) }}
              />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-teal-400" />
                <span className="text-sm font-semibold text-gray-900">Corrected Version</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{result.correctedText}</p>
            </div>
          </div>

          {/* Error list */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Error Explanations</h3>
            <div className="space-y-3">
              {result.errors.map((err, i) => (
                <div key={i} className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${ERROR_COLORS[err.type]}`}>
                    {ERROR_LABELS[err.type]}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-red-500 text-sm line-through">{err.original}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-teal-600 text-sm font-medium">{err.corrected}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{err.explanation}</p>
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
