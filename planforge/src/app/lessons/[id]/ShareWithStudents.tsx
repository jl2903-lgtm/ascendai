'use client'

import { useState } from 'react'
import { Share2, Copy, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'
import type { LessonContent } from '@/types'

// Re-activates the pre-teach-mode "Share with Students" feature. The button
// itself was orphaned in v3 — it lived on LessonOutput which is no longer
// the post-generation surface. This component is the missing piece that
// reaches the existing /api/practice/create endpoint and the existing
// /practice/[code] student view.
//
// The student view (PracticeHub) is unauthenticated, doesn't render the
// activities array at all, and doesn't see tutor_notes / model_answer /
// teaching_guidance — it derives its own student-only practice content
// (vocab + grammar + fill-in-the-blank sentences) from the plan text in a
// separate AI call inside /api/practice/create.

interface Props {
  lesson: LessonContent
  level: string
  topic: string
  nationality: string
}

// Build a flat plain-text representation of the structured lesson_content.
// /api/practice/create's extraction prompt expects a string; this matches the
// shape LessonOutput.tsx used previously (buildPlainText).
function lessonToPlainText(l: LessonContent): string {
  const parts: string[] = [
    `${l.title}`,
    '',
    `OVERVIEW (${l.overview?.timing ?? ''})`,
    `Objectives: ${(l.overview?.objectives ?? []).join(' | ')}`,
    '',
  ]
  if (l.warmer?.instructions) parts.push(`WARMER: ${l.warmer.instructions}`)
  if (l.leadIn?.instructions) parts.push(`LEAD-IN: ${l.leadIn.instructions}`)
  if (l.mainActivity?.instructions) parts.push(`MAIN ACTIVITY: ${l.mainActivity.instructions}`)
  if (l.languageFocus?.grammar_or_vocab) {
    parts.push(`LANGUAGE FOCUS: ${l.languageFocus.grammar_or_vocab}`)
    if (l.languageFocus.explanation) parts.push(l.languageFocus.explanation)
    if (l.languageFocus.examples?.length) parts.push(`Examples: ${l.languageFocus.examples.join(' | ')}`)
  }
  for (const ex of l.exercises ?? []) {
    parts.push(`EXERCISE — ${ex.type}: ${ex.content}`)
  }
  if (l.speakingTask?.prompts?.length) parts.push(`SPEAKING: ${l.speakingTask.prompts.join(' | ')}`)
  return parts.join('\n')
}

export function ShareWithStudents({ lesson, level, topic, nationality }: Props) {
  const [creating, setCreating] = useState(false)
  const [shareCode, setShareCode] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = shareCode
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://tyoutorpro.io'}/practice/${shareCode}`
    : ''

  const handleClick = async () => {
    if (shareCode) {
      // Already created — just reopen the modal.
      setOpen(true)
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/practice/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonTitle: lesson.title,
          lessonTopic: topic,
          lessonLevel: level,
          studentNationality: nationality,
          lessonContent: lessonToPlainText(lesson),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to create share link.')
        return
      }
      setShareCode(data.shareCode)
      setOpen(true)
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={creating}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5"
      >
        <Share2 className="w-4 h-4" />
        {creating ? 'Creating link…' : 'Share with students'}
      </button>

      {open && shareCode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Share with Students</h2>
                <p className="text-sm text-slate-600 mt-0.5">Share this link or QR code — no login needed.</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center p-4 bg-white rounded-xl border border-slate-200">
              <QRCodeSVG value={shareUrl} size={180} fgColor="#2D6A4F" />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Shareable link</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl px-3 py-2.5 text-sm text-slate-700 font-mono truncate bg-slate-50 border border-slate-200">
                  {shareUrl}
                </div>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${copied ? 'bg-emerald-500 text-white' : 'bg-teal-600 hover:bg-teal-500 text-white'}`}
                >
                  {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
                </button>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
              Students can open this on any device — no account required. The link is active for 30 days.
            </div>
          </div>
        </div>
      )}
    </>
  )
}
