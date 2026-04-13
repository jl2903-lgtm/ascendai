'use client'

import { useState } from 'react'
import { LessonContent, LessonFormData } from '@/types'
import { generateLessonPDF } from '@/lib/pdf'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  Clock, Target, Package, Flame, Compass, Zap, Globe,
  AlertCircle, BookOpen, Mic, LogOut, Home, Download,
  Copy, Save, RefreshCw, TrendingUp, TrendingDown,
  Timer, Scissors, MessageSquare, PenLine
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  lesson: LessonContent
  formData: LessonFormData
  onAdjust: (type: string) => void
  adjusting: boolean
}

const sections = [
  { key: 'overview', label: 'Overview', icon: Target },
  { key: 'warmer', label: 'Warmer', icon: Flame },
  { key: 'leadIn', label: 'Lead-in', icon: Compass },
  { key: 'mainActivity', label: 'Main Activity', icon: Zap },
  { key: 'languageFocus', label: 'Language Focus', icon: BookOpen },
  { key: 'l1Notes', label: 'L1 Notes', icon: Globe },
  { key: 'culturalNote', label: 'Cultural Note', icon: AlertCircle },
  { key: 'exercises', label: 'Exercises', icon: Package },
  { key: 'speakingTask', label: 'Speaking Task', icon: Mic },
  { key: 'exitTicket', label: 'Exit Ticket', icon: LogOut },
  { key: 'homework', label: 'Homework', icon: Home },
]

export function LessonOutput({ lesson, formData, onAdjust, adjusting }: Props) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/save-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lesson.title,
          studentLevel: formData.level,
          topic: formData.topic,
          lessonLength: formData.length,
          studentAgeGroup: formData.ageGroup,
          studentNationality: formData.nationality,
          lessonContent: lesson,
        }),
      })
      if (res.status === 403) { toast.error('Saving lessons requires a Pro subscription.'); return }
      if (!res.ok) { toast.error('Failed to save. Please try again.'); return }
      setSaved(true)
      toast.success('Lesson saved to your library!')
    } catch {
      toast.error('Failed to save lesson.')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await generateLessonPDF(lesson, { level: formData.level, topic: formData.topic, date: formatDate(new Date().toISOString()) })
      toast.success('PDF downloaded!')
    } catch {
      toast.error('PDF generation failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handleCopy = () => {
    const text = buildPlainText(lesson)
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="space-y-4">
      {/* Title card */}
      <div className="bg-gradient-to-br from-teal-600/20 to-white border border-teal-600/40 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{lesson.title}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { icon: Target, text: formData.level },
                { icon: Clock, text: lesson.overview.timing },
                { icon: Globe, text: formData.nationality },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-1.5 bg-gray-100/80 border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-500">
                  <Icon className="w-3 h-3 text-teal-500" /> {text}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {lesson.overview.objectives.length > 0 && (
              <div className="text-xs text-gray-500">
                <span className="text-teal-400 font-semibold">{lesson.overview.objectives.length}</span> objectives
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Adjust buttons */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wider">Adjust Lesson</div>
        <div className="flex flex-wrap gap-2">
          {[
            { type: 'harder', icon: TrendingUp, label: 'Make Harder' },
            { type: 'easier', icon: TrendingDown, label: 'Make Easier' },
            { type: 'shorter', icon: Scissors, label: 'Shorten' },
            { type: 'longer', icon: Timer, label: 'Extend' },
            { type: 'speaking', icon: Mic, label: 'More Speaking' },
            { type: 'writing', icon: PenLine, label: 'More Writing' },
          ].map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => onAdjust(type)}
              disabled={adjusting}
              className="flex items-center gap-1.5 text-xs border border-gray-200 hover:border-teal-500 text-gray-500 hover:text-teal-400 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
            >
              {adjusting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Section nav */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200 px-2 pt-2 gap-1 scrollbar-hide">
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => {
                const el = document.getElementById(`section-${s.key}`)
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                setActiveSection(s.key)
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap transition-all flex-shrink-0 ${activeSection === s.key ? 'bg-gray-50 text-teal-400 border-t border-x border-gray-200' : 'text-gray-400 hover:text-gray-500'}`}
            >
              <s.icon className="w-3 h-3" />
              {s.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Overview */}
          <div id="section-overview" className="scroll-mt-4">
            <SectionHeader icon={Target} title="Lesson Overview" timing={lesson.overview.timing} />
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard title="Objectives">
                <ul className="space-y-1.5">
                  {lesson.overview.objectives.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-5 h-5 bg-teal-600/20 rounded flex items-center justify-center text-teal-400 text-xs flex-shrink-0 mt-0.5">{i + 1}</span>
                      {o}
                    </li>
                  ))}
                </ul>
              </InfoCard>
              <InfoCard title="Materials Needed">
                <ul className="space-y-1">
                  {lesson.overview.materials.map((m, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                      {m}
                    </li>
                  ))}
                </ul>
              </InfoCard>
            </div>
          </div>

          {/* Warmer */}
          <div id="section-warmer" className="scroll-mt-4">
            <SectionHeader icon={Flame} title="Warmer Activity" timing={lesson.warmer.duration} />
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">{lesson.warmer.instructions}</p>
              {lesson.warmer.teacherNotes && <TeacherNote text={lesson.warmer.teacherNotes} />}
            </div>
          </div>

          {/* Lead-in */}
          <div id="section-leadIn" className="scroll-mt-4">
            <SectionHeader icon={Compass} title="Lead-in / Context Setting" timing={lesson.leadIn.duration} />
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">{lesson.leadIn.instructions}</p>
              {lesson.leadIn.context && <p className="text-sm text-gray-500 italic leading-relaxed">{lesson.leadIn.context}</p>}
            </div>
          </div>

          {/* Main Activity */}
          <div id="section-mainActivity" className="scroll-mt-4">
            <SectionHeader icon={Zap} title="Main Activity" timing={lesson.mainActivity.duration} />
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">{lesson.mainActivity.instructions}</p>
              {lesson.mainActivity.variations && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
                  <div className="text-xs font-semibold text-blue-400 mb-1">Variations</div>
                  <p className="text-sm text-gray-500 leading-relaxed">{lesson.mainActivity.variations}</p>
                </div>
              )}
              {lesson.mainActivity.teacherNotes && <TeacherNote text={lesson.mainActivity.teacherNotes} />}
            </div>
          </div>

          {/* Language Focus */}
          <div id="section-languageFocus" className="scroll-mt-4">
            <SectionHeader icon={BookOpen} title="Language Focus" />
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-sm font-semibold text-teal-400 mb-1">{lesson.languageFocus.grammar_or_vocab}</div>
                <p className="text-sm text-gray-700 leading-relaxed">{lesson.languageFocus.explanation}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard title="Examples">
                  <ul className="space-y-1">
                    {lesson.languageFocus.examples.map((e, i) => (
                      <li key={i} className="text-sm text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded">{e}</li>
                    ))}
                  </ul>
                </InfoCard>
                <InfoCard title="Common Errors to Watch">
                  <ul className="space-y-1">
                    {lesson.languageFocus.commonErrors.map((e, i) => (
                      <li key={i} className="text-sm text-amber-300 flex items-start gap-2">
                        <span className="text-amber-500 flex-shrink-0">⚠</span>
                        {e}
                      </li>
                    ))}
                  </ul>
                </InfoCard>
              </div>
            </div>
          </div>

          {/* L1 Notes */}
          <div id="section-l1Notes" className="scroll-mt-4">
            <SectionHeader icon={Globe} title={`L1-Aware Notes — ${lesson.l1Notes.nationality}`} />
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard title="Specific Challenges">
                <ul className="space-y-1.5">
                  {lesson.l1Notes.specificChallenges.map((c, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-amber-400 flex-shrink-0">•</span> {c}
                    </li>
                  ))}
                </ul>
              </InfoCard>
              <InfoCard title="Teaching Tips">
                <ul className="space-y-1.5">
                  {lesson.l1Notes.tips.map((t, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-teal-400 flex-shrink-0">✓</span> {t}
                    </li>
                  ))}
                </ul>
              </InfoCard>
            </div>
          </div>

          {/* Cultural Note */}
          {lesson.culturalNote.hasCulturalConsideration && (
            <div id="section-culturalNote" className="scroll-mt-4">
              <SectionHeader icon={AlertCircle} title="Cultural Sensitivity Note" />
              <div className="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <p className="text-sm text-amber-200 leading-relaxed">{lesson.culturalNote.note}</p>
              </div>
            </div>
          )}

          {/* Exercises */}
          <div id="section-exercises" className="scroll-mt-4">
            <SectionHeader icon={Package} title="Practice Exercises" />
            <div className="mt-4 space-y-4">
              {lesson.exercises.map((ex, i) => (
                <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center text-xs font-bold text-white">{i + 1}</span>
                    <span className="text-sm font-semibold text-gray-900">{ex.type}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{ex.instructions}</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{ex.content}</p>
                  {ex.answerKey && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs font-semibold text-teal-400 mb-1">Answer Key</div>
                      <p className="text-xs text-gray-500">{ex.answerKey}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Speaking Task */}
          <div id="section-speakingTask" className="scroll-mt-4">
            <SectionHeader icon={Mic} title="Speaking / Production Task" timing={lesson.speakingTask.duration} />
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">{lesson.speakingTask.instructions}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {lesson.speakingTask.prompts.map((p, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-teal-500 flex-shrink-0 mt-0.5" />
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Exit Ticket */}
          <div id="section-exitTicket" className="scroll-mt-4">
            <SectionHeader icon={LogOut} title="Exit Ticket" />
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-500">{lesson.exitTicket.instructions}</p>
              <div className="space-y-2">
                {lesson.exitTicket.questions.map((q, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                    <span className="text-teal-400 font-semibold text-sm flex-shrink-0">Q{i + 1}</span>
                    <p className="text-sm text-gray-700">{q}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Homework */}
          {lesson.homework.instructions && (
            <div id="section-homework" className="scroll-mt-4">
              <SectionHeader icon={Home} title="Homework" badge="Optional" />
              <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-700 leading-relaxed">{lesson.homework.instructions}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap gap-3">
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white"
        >
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Lesson'}
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border border-gray-200 hover:border-teal-500 text-gray-500 hover:text-white transition-all"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Generating PDF...' : 'Download PDF'}
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border border-gray-200 hover:border-teal-500 text-gray-500 hover:text-white transition-all"
        >
          <Copy className="w-4 h-4" />
          Copy to Clipboard
        </button>
      </div>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, timing, badge }: { icon: React.FC<{ className?: string }>; title: string; timing?: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
      <div className="w-7 h-7 bg-teal-600/15 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-teal-400" />
      </div>
      <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      {timing && (
        <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
          <Clock className="w-3 h-3" /> {timing}
        </span>
      )}
      {badge && (
        <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">{badge}</span>
      )}
    </div>
  )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</div>
      {children}
    </div>
  )
}

function TeacherNote({ text }: { text: string }) {
  return (
    <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl px-4 py-3">
      <div className="text-xs font-semibold text-teal-400 mb-1">Teacher Note</div>
      <p className="text-sm text-gray-500 leading-relaxed">{text}</p>
    </div>
  )
}

function buildPlainText(lesson: LessonContent): string {
  return `${lesson.title}
${'='.repeat(50)}

OVERVIEW
Duration: ${lesson.overview.timing}
Objectives:
${lesson.overview.objectives.map(o => `  • ${o}`).join('\n')}

WARMER (${lesson.warmer.duration})
${lesson.warmer.instructions}

LEAD-IN (${lesson.leadIn.duration})
${lesson.leadIn.instructions}

MAIN ACTIVITY (${lesson.mainActivity.duration})
${lesson.mainActivity.instructions}

LANGUAGE FOCUS
${lesson.languageFocus.grammar_or_vocab}
${lesson.languageFocus.explanation}

L1 NOTES (${lesson.l1Notes.nationality})
Challenges: ${lesson.l1Notes.specificChallenges.join(', ')}

EXERCISES
${lesson.exercises.map((e, i) => `${i + 1}. ${e.type}\n${e.instructions}\n${e.content}\nAnswer Key: ${e.answerKey}`).join('\n\n')}

SPEAKING TASK (${lesson.speakingTask.duration})
${lesson.speakingTask.instructions}

EXIT TICKET
${lesson.exitTicket.questions.join('\n')}

HOMEWORK (Optional)
${lesson.homework.instructions}
`
}
