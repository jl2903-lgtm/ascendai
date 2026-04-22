'use client'

import { useState, useEffect } from 'react'
import { LessonContent, LessonFormData } from '@/types'
import { generateLessonPDF } from '@/lib/pdf'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  Clock, Target, Package, Flame, Compass, Zap, Globe,
  AlertCircle, BookOpen, Mic, LogOut, Home, Download,
  Copy, Save, RefreshCw, TrendingUp, TrendingDown,
  Timer, Scissors, MessageSquare, PenLine, Share2, X, Check
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { QRCodeSVG } from 'qrcode.react'

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
  const [teacherName, setTeacherName] = useState('Teacher')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      supabase.from('users').select('full_name').eq('id', session.user.id).single()
        .then(({ data }) => { if (data?.full_name) setTeacherName(data.full_name) })
    })
  }, [])
  const [saved, setSaved] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [shareCode, setShareCode] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)

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
      await generateLessonPDF(lesson, { level: formData.level, topic: formData.topic, date: formatDate(new Date().toISOString()) }, teacherName)
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

  const handleShare = async () => {
    setSharing(true)
    try {
      const res = await fetch('/api/practice/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonTitle: lesson.title,
          lessonTopic: formData.topic,
          lessonLevel: formData.level,
          studentNationality: formData.nationality,
          lessonContent: buildPlainText(lesson),
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to create practice session'); return }
      setShareCode(data.shareCode)
      setShowShareModal(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSharing(false)
    }
  }

  const shareUrl = shareCode ? `${typeof window !== 'undefined' ? window.location.origin : 'https://tyoutorpro.io'}/practice/${shareCode}` : ''

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Title card */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid #E8E4DE', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-[#2D2D2D]">{lesson.title}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { icon: Target, text: formData.level },
                { icon: Clock, text: lesson.overview.timing },
                { icon: Globe, text: formData.nationality },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-[#6B6860]" style={{ background: '#F4F2EE', border: '1px solid #E8E4DE' }}>
                  <Icon className="w-3 h-3 text-teal-600" /> {text}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {lesson.overview.objectives.length > 0 && (
              <div className="text-xs text-[#6B6860]">
                <span className="text-teal-600 font-semibold">{lesson.overview.objectives.length}</span> objectives
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Adjust buttons */}
      <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #E8E4DE' }}>
        <div className="text-xs text-[#8C8880] font-medium mb-3 uppercase tracking-wider">Adjust Lesson</div>
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
              className="flex items-center gap-1.5 text-xs text-[#6B6860] hover:text-teal-600 hover:border-teal-500 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
              style={{ border: '1px solid #E8E4DE' }}
            >
              {adjusting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Section nav */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E8E4DE' }}>
        <div className="flex overflow-x-auto px-2 pt-2 gap-1 scrollbar-hide" style={{ borderBottom: '1px solid #E8E4DE' }}>
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => {
                const el = document.getElementById(`section-${s.key}`)
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                setActiveSection(s.key)
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap transition-all flex-shrink-0 ${activeSection === s.key ? 'text-teal-600' : 'text-[#8C8880] hover:text-[#6B6860]'}`}
              style={activeSection === s.key ? { background: '#F4F2EE', border: '1px solid #E8E4DE', borderBottom: 'none' } : {}}
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
                    <li key={i} className="flex items-start gap-2 text-sm text-[#4A473E]">
                      <span className="w-5 h-5 bg-teal-600/20 rounded flex items-center justify-center text-teal-400 text-xs flex-shrink-0 mt-0.5">{i + 1}</span>
                      {o}
                    </li>
                  ))}
                </ul>
              </InfoCard>
              <InfoCard title="Materials Needed">
                <ul className="space-y-1">
                  {lesson.overview.materials.map((m, i) => (
                    <li key={i} className="text-sm text-[#4A473E] flex items-center gap-2">
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
              <p className="text-sm text-[#4A473E] leading-relaxed">{lesson.warmer.instructions}</p>
              {lesson.warmer.teacherNotes && <TeacherNote text={lesson.warmer.teacherNotes} />}
            </div>
          </div>

          {/* Lead-in */}
          <div id="section-leadIn" className="scroll-mt-4">
            <SectionHeader icon={Compass} title="Lead-in / Context Setting" timing={lesson.leadIn.duration} />
            <div className="mt-4 space-y-3">
              <p className="text-sm text-[#4A473E] leading-relaxed">{lesson.leadIn.instructions}</p>
              {lesson.leadIn.context && <p className="text-sm text-[#6B6860] italic leading-relaxed">{lesson.leadIn.context}</p>}
            </div>
          </div>

          {/* Main Activity */}
          <div id="section-mainActivity" className="scroll-mt-4">
            <SectionHeader icon={Zap} title="Main Activity" timing={lesson.mainActivity.duration} />
            <div className="mt-4 space-y-3">
              <p className="text-sm text-[#4A473E] leading-relaxed">{lesson.mainActivity.instructions}</p>
              {lesson.mainActivity.variations && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
                  <div className="text-xs font-semibold text-blue-400 mb-1">Variations</div>
                  <p className="text-sm text-[#6B6860] leading-relaxed">{lesson.mainActivity.variations}</p>
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
                <div className="text-sm font-semibold text-teal-600 mb-1">{lesson.languageFocus.grammar_or_vocab}</div>
                <p className="text-sm text-[#4A473E] leading-relaxed">{lesson.languageFocus.explanation}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard title="Examples">
                  <ul className="space-y-1">
                    {lesson.languageFocus.examples.map((e, i) => (
                      <li key={i} className="text-sm text-[#4A473E] font-mono px-2 py-1 rounded" style={{ background: '#F7F6F2' }}>{e}</li>
                    ))}
                  </ul>
                </InfoCard>
                <InfoCard title="Common Errors to Watch">
                  <ul className="space-y-1">
                    {lesson.languageFocus.commonErrors.map((e, i) => (
                      <li key={i} className="text-sm flex items-start gap-2 bg-red-50 border-l-2 border-red-400 px-2 py-1 rounded-r" style={{ color: '#B91C1C' }}>
                        <span className="flex-shrink-0" style={{ color: '#EF4444' }}>⚠</span>
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
                    <li key={i} className="text-sm text-[#4A473E] flex items-start gap-2">
                      <span className="text-amber-400 flex-shrink-0">•</span> {c}
                    </li>
                  ))}
                </ul>
              </InfoCard>
              <InfoCard title="Teaching Tips">
                <ul className="space-y-1.5">
                  {lesson.l1Notes.tips.map((t, i) => (
                    <li key={i} className="text-sm text-[#4A473E] flex items-start gap-2">
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
              <div className="mt-3 rounded-xl p-4 border-l-4" style={{ background: '#FFF8E1', borderColor: '#F59E0B', borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderTopColor: '#FDE68A', borderRightColor: '#FDE68A', borderBottomColor: '#FDE68A' }}>
                <p className="text-sm leading-relaxed" style={{ color: '#2D2D2D' }}>{lesson.culturalNote.note}</p>
              </div>
            </div>
          )}

          {/* Exercises */}
          <div id="section-exercises" className="scroll-mt-4">
            <SectionHeader icon={Package} title="Practice Exercises" />
            <div className="mt-4 space-y-4">
              {lesson.exercises.map((ex, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: '#F7F6F2', border: '1px solid #E8E4DE' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center text-xs font-bold text-white">{i + 1}</span>
                    <span className="text-sm font-semibold text-[#2D2D2D]">{ex.type}</span>
                  </div>
                  <p className="text-sm text-[#6B6860] mb-3">{ex.instructions}</p>
                  <p className="text-sm text-[#4A473E] whitespace-pre-wrap leading-relaxed">{ex.content}</p>
                  {ex.answerKey && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid #E8E4DE' }}>
                      <div className="text-xs font-semibold text-teal-600 mb-1">Answer Key</div>
                      <p className="text-xs text-[#6B6860]">{ex.answerKey}</p>
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
              <p className="text-sm text-[#4A473E] leading-relaxed">{lesson.speakingTask.instructions}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {lesson.speakingTask.prompts.map((p, i) => (
                  <div key={i} className="rounded-lg px-3 py-2 text-sm text-[#4A473E] flex items-start gap-2" style={{ background: '#F7F6F2', border: '1px solid #E8E4DE' }}>
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
              <p className="text-sm text-[#6B6860]">{lesson.exitTicket.instructions}</p>
              <div className="space-y-2">
                {lesson.exitTicket.questions.map((q, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg px-4 py-3" style={{ background: '#F7F6F2', border: '1px solid #E8E4DE' }}>
                    <span className="text-teal-400 font-semibold text-sm flex-shrink-0">Q{i + 1}</span>
                    <p className="text-sm text-[#4A473E]">{q}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Homework */}
          {lesson.homework.instructions && (
            <div id="section-homework" className="scroll-mt-4">
              <SectionHeader icon={Home} title="Homework" badge="Optional" />
              <div className="mt-3 rounded-xl p-4" style={{ background: '#F7F6F2', border: '1px solid #E8E4DE' }}>
                <p className="text-sm text-[#4A473E] leading-relaxed">{lesson.homework.instructions}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="bg-white rounded-2xl p-4 flex flex-wrap gap-3" style={{ border: '1px solid #E8E4DE' }}>
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white"
        >
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Lesson'}
        </button>
        <button
          onClick={handleShare}
          disabled={sharing}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white"
        >
          {sharing ? (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          ) : (
            <Share2 className="w-4 h-4" />
          )}
          {sharing ? 'Creating...' : 'Share with Students ⚡'}
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl text-[#6B6860] hover:text-teal-600 hover:border-teal-500 transition-all"
          style={{ border: '1px solid #E8E4DE' }}
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Generating PDF...' : 'Download PDF'}
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl text-[#6B6860] hover:text-teal-600 hover:border-teal-500 transition-all"
          style={{ border: '1px solid #E8E4DE' }}
        >
          <Copy className="w-4 h-4" />
          Copy to Clipboard
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && shareCode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#2D2D2D]">Share with Students ⚡</h2>
                <p className="text-sm text-[#6B6860] mt-0.5">Share this link or project the QR code for your class</p>
              </div>
              <button onClick={() => setShowShareModal(false)} className="p-2 text-[#8C8880] hover:text-[#6B6860] rounded-xl hover:bg-[#F4F2EE]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center p-4 bg-white rounded-xl" style={{ border: '1px solid #E8E4DE' }}>
              <QRCodeSVG value={shareUrl} size={180} fgColor="#2D6A4F" />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#6B6860] uppercase tracking-wider">Shareable Link</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl px-3 py-2.5 text-sm text-[#4A473E] font-mono truncate" style={{ background: '#F7F6F2', border: '1px solid #E8E4DE' }}>
                  {shareUrl}
                </div>
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${copied ? 'bg-green-500 text-white' : 'bg-teal-600 hover:bg-teal-500 text-white'}`}
                >
                  {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
                </button>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
              Students can open this on their phone — no login required. The link is active for 30 days.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SectionHeader({ icon: Icon, title, timing, badge }: { icon: React.FC<{ className?: string }>; title: string; timing?: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid #E8E4DE' }}>
      <div className="w-7 h-7 bg-teal-600/15 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-teal-600" />
      </div>
      <h3 className="font-semibold text-[#2D2D2D] text-sm">{title}</h3>
      {timing && (
        <span className="flex items-center gap-1 text-xs text-[#6B6860] px-2 py-0.5 rounded-full" style={{ background: '#F4F2EE', border: '1px solid #E8E4DE' }}>
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
    <div className="rounded-xl p-4" style={{ background: '#F7F6F2', border: '1px solid #E8E4DE' }}>
      <div className="text-xs font-semibold text-[#8C8880] uppercase tracking-wider mb-3">{title}</div>
      {children}
    </div>
  )
}

function TeacherNote({ text }: { text: string }) {
  return (
    <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl px-4 py-3">
      <div className="text-xs font-semibold text-teal-400 mb-1">Teacher Note</div>
      <p className="text-sm text-[#6B6860] leading-relaxed">{text}</p>
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
