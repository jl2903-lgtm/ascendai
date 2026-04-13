'use client'

import { useState } from 'react'
import { WorksheetContent, WorksheetFormData } from '@/types'
import { STUDENT_LEVELS, EXERCISE_TYPES } from '@/lib/utils'
import { ThinkingLoader } from '@/components/ui/ThinkingLoader'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import { generateWorksheetPDF } from '@/lib/pdf'
import { formatDate } from '@/lib/utils'
import { FileText, Zap, Download, Save, Copy, CheckSquare, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

const QUESTION_COUNTS = [5, 10, 15, 20]

export default function WorksheetBuilderPage() {
  const [form, setForm] = useState<WorksheetFormData>({
    exerciseTypes: ['Gap fill'],
    topic: '',
    level: 'B1',
    questionCount: 10,
    includeAnswerKey: true,
  })
  const [loading, setLoading] = useState(false)
  const [worksheet, setWorksheet] = useState<WorksheetContent | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const toggleExerciseType = (type: string) => {
    setForm(f => ({
      ...f,
      exerciseTypes: f.exerciseTypes.includes(type)
        ? f.exerciseTypes.filter(t => t !== type)
        : [...f.exerciseTypes, type],
    }))
  }

  const generate = async () => {
    if (!form.topic.trim()) { setErrors({ topic: 'Please enter a topic' }); return }
    if (form.exerciseTypes.length === 0) { setErrors({ exerciseTypes: 'Select at least one exercise type' }); return }
    setErrors({})
    setLoading(true)
    try {
      const res = await fetch('/api/generate-worksheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.status === 402) { setShowUpgrade(true); return }
      if (!res.ok) { toast.error(data.error || 'Generation failed. Please try again.'); return }
      setWorksheet(data)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!worksheet) return
    setSaving(true)
    try {
      const res = await fetch('/api/save-worksheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: worksheet.title, content: worksheet }),
      })
      if (res.status === 403) { toast.error('Saving requires a Pro subscription.'); return }
      if (!res.ok) { toast.error('Failed to save.'); return }
      toast.success('Worksheet saved!')
    } catch {
      toast.error('Failed to save worksheet.')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async () => {
    if (!worksheet) return
    try {
      await generateWorksheetPDF(worksheet, formatDate(new Date().toISOString()))
      toast.success('PDF downloaded!')
    } catch {
      toast.error('PDF generation failed.')
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600/15 border border-blue-600/30 rounded-xl flex items-center justify-center">
          <FileText className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Worksheet Builder</h1>
          <p className="text-sm text-gray-500">Custom exercises with answer keys at any level</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 sticky top-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Worksheet Settings</h2>

            {/* Exercise Types */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Exercise Types</label>
              <div className="grid grid-cols-2 gap-1.5">
                {EXERCISE_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => toggleExerciseType(t.value)}
                    className={`flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl border transition-all text-left ${form.exerciseTypes.includes(t.value) ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    <CheckSquare className={`w-3.5 h-3.5 flex-shrink-0 ${form.exerciseTypes.includes(t.value) ? 'text-blue-400' : 'text-gray-400'}`} />
                    {t.label}
                  </button>
                ))}
              </div>
              {errors.exerciseTypes && <p className="text-red-400 text-xs mt-1">{errors.exerciseTypes}</p>}
            </div>

            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Topic <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={form.topic}
                onChange={e => { setForm(f => ({ ...f, topic: e.target.value })); setErrors({}) }}
                placeholder="e.g. Past Simple, Adjectives, Shopping"
                className={`w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 ${errors.topic ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-teal-500 focus:ring-teal-500'}`}
              />
              {errors.topic && <p className="text-red-400 text-xs mt-1">{errors.topic}</p>}
            </div>

            {/* Level */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Level</label>
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

            {/* Question count */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Number of Questions</label>
              <div className="grid grid-cols-4 gap-1.5">
                {QUESTION_COUNTS.map(n => (
                  <button
                    key={n}
                    onClick={() => setForm(f => ({ ...f, questionCount: n }))}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all ${form.questionCount === n ? 'bg-teal-600 text-white' : 'bg-gray-50 border border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Answer key toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-500">Include Answer Key</label>
              <button
                onClick={() => setForm(f => ({ ...f, includeAnswerKey: !f.includeAnswerKey }))}
                className={`relative inline-flex w-10 h-6 rounded-full transition-colors ${form.includeAnswerKey ? 'bg-teal-600' : 'bg-gray-100'}`}
              >
                <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform mt-1 ${form.includeAnswerKey ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>

            <button
              onClick={generate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all text-sm"
            >
              {loading ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Generating...</>
              ) : <><Zap className="w-4 h-4" />Generate Worksheet</>}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="bg-white border border-gray-200 rounded-2xl min-h-[500px] flex items-center justify-center">
              <ThinkingLoader />
            </div>
          ) : worksheet ? (
            <div className="space-y-4">
              {/* Worksheet preview */}
              <div className="bg-white text-gray-900 rounded-2xl p-8 shadow-xl">
                <div className="border-b-2 border-gray-900 pb-4 mb-6">
                  <h2 className="text-2xl font-bold">{worksheet.title}</h2>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>Level: {worksheet.level}</span>
                    <span>•</span>
                    <span>Topic: {worksheet.topic}</span>
                  </div>
                </div>
                <div className="flex gap-16 mb-6 text-sm">
                  <div>Name: <span className="inline-block w-40 border-b border-gray-400 ml-2">&nbsp;</span></div>
                  <div>Date: <span className="inline-block w-32 border-b border-gray-400 ml-2">&nbsp;</span></div>
                </div>
                <div className="space-y-8">
                  {worksheet.exercises.map((ex, i) => (
                    <div key={i}>
                      <div className="bg-gray-100 rounded-lg px-4 py-2 mb-3">
                        <span className="font-bold">Exercise {i + 1}: {ex.type}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 italic">{ex.instructions}</p>
                      <div className="space-y-3">
                        {ex.items.map((item, j) => (
                          <div key={j} className="text-sm">
                            <span className="font-medium">{j + 1}.</span> {item}
                          </div>
                        ))}
                      </div>
                      {ex.answerKey && ex.answerKey.length > 0 && form.includeAnswerKey && (
                        <div className="mt-4 pt-3 border-t border-dashed border-gray-300">
                          <div className="text-xs font-semibold text-gray-500 mb-1">ANSWER KEY</div>
                          <div className="text-xs text-gray-600">
                            {ex.answerKey.map((a, j) => `${j + 1}. ${a}`).join('  |  ')}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-400">
                  <span>PlanForge Worksheet</span>
                  <span>{worksheet.level} · {worksheet.topic}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap gap-3">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white transition-all">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={handleDownload} className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border border-gray-200 hover:border-teal-500 text-gray-500 hover:text-white transition-all">
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button onClick={() => window.print()} className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border border-gray-200 hover:border-teal-500 text-gray-500 hover:text-white transition-all">
                  <Copy className="w-4 h-4" />
                  Print View
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl min-h-[400px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-blue-600/50" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your worksheet will appear here</h3>
              <p className="text-sm text-gray-500 max-w-xs">Select exercise types, enter a topic, and click Generate Worksheet. Your custom materials will be print-ready in seconds.</p>
            </div>
          )}
        </div>
      </div>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} toolName="Worksheet Builder" limit={5} />
    </div>
  )
}
