'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Wand2, ChevronDown, ChevronRight, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react'
import { ClassSelector } from '@/components/dashboard/ClassSelector'
import { LessonOutput } from '@/components/dashboard/LessonOutput'
import { STUDENT_LEVELS, LESSON_LENGTHS, AGE_GROUPS } from '@/lib/utils'
import type { ClassProfile, LessonContent, LessonFormData } from '@/types'
import toast from 'react-hot-toast'

function getLoadingMessages(level: string) {
  return [
    'Reading your content...',
    'Understanding the topic...',
    'Building your lesson...',
    `Calibrating for ${level}...`,
    'Almost ready...',
  ]
}

function deriveSourceBadge(sourceLabel: string): string {
  if (sourceLabel === 'Pasted text') return '✨ Generated from pasted text'
  if (sourceLabel.startsWith('YouTube: ')) return `✨ Generated from YouTube: ${sourceLabel.replace('YouTube: ', '')}`
  if (sourceLabel.startsWith('YouTube video')) return '✨ Generated from YouTube'
  if (sourceLabel.startsWith('Article: ')) return `✨ Generated from article: ${sourceLabel.replace('Article: ', '')}`
  if (sourceLabel.startsWith('Article from ')) return `✨ Generated from ${sourceLabel}`
  return `✨ Generated from: ${sourceLabel}`
}

function deriveTopic(sourceLabel: string, sourcePreview: string): string {
  if (sourceLabel.startsWith('Article: ')) return sourceLabel.replace('Article: ', '')
  if (sourceLabel.startsWith('Article from ')) return sourceLabel.replace('Article from ', '')
  if (sourceLabel.startsWith('YouTube: ')) return sourceLabel.replace('YouTube: ', '')
  if (sourceLabel.startsWith('YouTube video')) return 'YouTube video lesson'
  return sourcePreview.slice(0, 60).trim() || 'Pasted content'
}

export default function MagicPastePage() {
  const [pastedContent, setPastedContent]       = useState('')
  const [cefrLevel, setCefrLevel]               = useState('B1')
  const [duration, setDuration]                 = useState(60)
  const [ageGroup, setAgeGroup]                 = useState('Adults')
  const [selectedClass, setSelectedClass]       = useState<ClassProfile | null>(null)
  const [loading, setLoading]                   = useState(false)
  const [loadingMsg, setLoadingMsg]             = useState(getLoadingMessages('B1')[0])
  const [adjusting]                             = useState(false)
  const [result, setResult]                     = useState<{ lesson: LessonContent; sourceLabel: string; sourcePreview: string; contentNote?: string } | null>(null)
  const [error, setError]                       = useState<string | null>(null)
  const [sourceExpanded, setSourceExpanded]     = useState(false)
  const [manualTranscript, setManualTranscript] = useState('')
  const [transcriptOpen, setTranscriptOpen]     = useState(false)
  const intervalRef                             = useRef<ReturnType<typeof setInterval> | null>(null)

  const isYouTubeUrl = /^https?:\/\//i.test(pastedContent.trim()) && /youtube\.com|youtu\.be/i.test(pastedContent.trim())

  useEffect(() => {
    if (loading) {
      const messages = getLoadingMessages(cefrLevel)
      let i = 0
      setLoadingMsg(messages[0])
      intervalRef.current = setInterval(() => {
        i = (i + 1) % messages.length
        setLoadingMsg(messages[i])
      }, 3000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [loading, cefrLevel])

  const formData: LessonFormData | null = useMemo(() => {
    if (!result) return null
    return {
      level: cefrLevel,
      topic: deriveTopic(result.sourceLabel, result.sourcePreview),
      length: duration,
      ageGroup,
      nationality: selectedClass?.student_nationality ?? 'International',
      classSize: 'Medium (11–20)',
      specialFocus: [],
    }
  }, [result, cefrLevel, duration, ageGroup, selectedClass])

  const generate = async () => {
    if (!pastedContent.trim()) return
    setError(null)
    setResult(null)
    setLoading(true)
    setSourceExpanded(false)
    try {
      const res = await fetch('/api/magic-paste/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pastedContent,
          cefrLevel,
          duration,
          ageGroup,
          classId: selectedClass?.id ?? null,
          manualTranscript: manualTranscript.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }
      setResult(data)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const startOver = () => {
    setResult(null)
    setError(null)
    setPastedContent('')
    setSourceExpanded(false)
    setManualTranscript('')
    setTranscriptOpen(false)
  }

  const glass: React.CSSProperties = {
    background: 'rgba(255,255,255,0.80)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: '1px solid rgba(255,255,255,0.65)',
    borderRadius: 20,
  }

  const selectStyle: React.CSSProperties = {
    appearance: 'none',
    background: '#F9F9F9',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    padding: '10px 36px 10px 14px',
    fontSize: 13,
    fontWeight: 600,
    color: '#2D2D2D',
    cursor: 'pointer',
    outline: 'none',
    width: '100%',
  }

  return (
    <div className="relative max-w-3xl mx-auto pb-16" style={{ zIndex: 30 }}>

      {/* Decorative blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-dot-pattern" style={{ zIndex: 0 }} />
      <div aria-hidden style={{ position: 'fixed', width: 480, height: 380, top: -80, right: -100, borderRadius: '50%', filter: 'blur(80px)', background: 'radial-gradient(ellipse,#FDF2F8,#FCE7F3)', opacity: 0.55, pointerEvents: 'none', zIndex: 0, animation: 'blobFloat 8s ease-in-out 0s infinite alternate' }} />
      <div aria-hidden style={{ position: 'fixed', width: 360, height: 300, bottom: 0, left: -80, borderRadius: '50%', filter: 'blur(80px)', background: 'radial-gradient(ellipse,#FFE5D9,#FECDA6)', opacity: 0.10, pointerEvents: 'none', zIndex: 0, animation: 'blobFloat 8s ease-in-out 4s infinite alternate' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <div className="mb-8" style={{ animation: 'fadeInUp 0.45s ease both' }}>
          <div className="flex items-center gap-3 mb-2">
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#BE185D,#EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(190,24,93,0.25)' }}>
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#2D2D2D', lineHeight: 1.1 }}>Magic Paste ✨</h1>
            </div>
          </div>
          <p style={{ fontSize: 14.5, color: '#7A7A7A', marginLeft: 2, lineHeight: 1.55 }}>
            Paste any article, video, or text. Get a complete lesson in 30 seconds.
          </p>
        </div>

        {/* ── Loading state — skeleton + rotating message ── */}
        {loading && (
          <div style={{ animation: 'fadeInUp 0.3s ease both', marginBottom: 24 }}>
            {/* Status bar */}
            <div style={{ ...glass, padding: '20px 24px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#BE185D,#EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 6px 20px rgba(190,24,93,0.22)', animation: 'spin 2s linear infinite' }}>
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#2D2D2D', marginBottom: 3 }}>{loadingMsg}</p>
                <p style={{ fontSize: 12, color: '#9CA3AF' }}>This usually takes 20–30 seconds</p>
              </div>
            </div>

            {/* Skeleton lesson preview */}
            <div style={{ background: 'rgba(255,255,255,0.70)', borderRadius: 20, border: '1px solid rgba(229,231,235,0.8)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6' }} className="animate-pulse">
                <div style={{ height: 20, background: '#E5E7EB', borderRadius: 8, width: '55%', marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  {[56, 80, 66].map((w, i) => (
                    <div key={i} style={{ height: 22, background: '#F3F4F6', borderRadius: 8, width: w }} />
                  ))}
                </div>
              </div>
              {[['72%', '88%'], ['60%', '45%'], ['80%', '65%'], ['50%', '72%'], ['68%', '55%']].map(([w1, w2], i) => (
                <div key={i} style={{ padding: '14px 24px', borderBottom: i < 4 ? '1px solid #F3F4F6' : 'none' }} className="animate-pulse">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F3F4F6', flexShrink: 0 }} />
                    <div style={{ height: 13, background: '#E5E7EB', borderRadius: 6, width: w1 }} />
                  </div>
                  <div style={{ height: 11, background: '#F3F4F6', borderRadius: 6, width: w2, marginLeft: 40 }} />
                </div>
              ))}
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── Error state ── */}
        {error && !loading && (
          <div style={{ ...glass, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(254,242,242,0.9)', animation: 'fadeInUp 0.3s ease both' }}>
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p style={{ fontSize: 13, color: '#B91C1C', lineHeight: 1.5 }}>{error}</p>
          </div>
        )}

        {/* ── Source badge + collapsible preview ── */}
        {result && !loading && (
          <div style={{ ...glass, marginBottom: 20, border: '1px solid rgba(34,197,94,0.25)', background: 'rgba(240,253,244,0.95)', animation: 'fadeInUp 0.4s ease both', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: '#166534', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {result.lesson.title}
                </p>
                <p style={{ fontSize: 12, color: '#4B7C62', marginTop: 2 }}>
                  {deriveSourceBadge(result.sourceLabel)}
                </p>
              </div>
              {result.sourcePreview && (
                <button
                  type="button"
                  onClick={() => setSourceExpanded(x => !x)}
                  style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: '#166534', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, opacity: 0.7, padding: '4px 0' }}
                >
                  <ChevronRight style={{ width: 13, height: 13, transform: sourceExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                  View source
                </button>
              )}
            </div>
            {sourceExpanded && result.sourcePreview && (
              <div style={{ padding: '0 20px 14px', borderTop: '1px solid rgba(34,197,94,0.15)', paddingTop: 12 }}>
                <p style={{ fontSize: 12, color: '#4B7C62', lineHeight: 1.7, fontStyle: 'italic' }}>
                  &ldquo;{result.sourcePreview}&hellip;&rdquo;
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Main form card ── */}
        {!loading && (
          <div style={{ ...glass, padding: 28, animation: 'fadeInUp 0.55s ease both', marginBottom: result ? 20 : 0 }}>

            {/* Class selector */}
            <div className="mb-5">
              <ClassSelector onClassSelected={(profile) => {
                setSelectedClass(profile)
                if (profile) {
                  setCefrLevel(profile.cefr_level)
                  setAgeGroup(profile.student_age_group)
                }
              }} />
            </div>

            {/* Textarea */}
            <div className="mb-5">
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>
                Your Content
              </label>
              <textarea
                value={pastedContent}
                onChange={e => setPastedContent(e.target.value)}
                placeholder="Paste an article, YouTube URL, song lyrics, news story, or any text here..."
                rows={9}
                style={{
                  width: '100%',
                  minHeight: 250,
                  resize: 'vertical',
                  padding: '14px 16px',
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: '#2D2D2D',
                  background: '#FAFAFA',
                  border: '1.5px solid #E5E7EB',
                  borderRadius: 14,
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#EC4899' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB' }}
              />
            </div>

            {/* Optional manual transcript (collapsible) */}
            <div className="mb-5">
              <button
                type="button"
                onClick={() => setTranscriptOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: transcriptOpen ? 10 : 0 }}
              >
                <ChevronRight style={{ width: 13, height: 13, transform: transcriptOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                Have a transcript? Paste it here for an even better lesson (optional)
              </button>

              {transcriptOpen && (
                <div>
                  <textarea
                    value={manualTranscript}
                    onChange={e => setManualTranscript(e.target.value)}
                    placeholder="Paste the video transcript here..."
                    rows={5}
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      padding: '12px 16px',
                      fontSize: 13,
                      lineHeight: 1.65,
                      color: '#2D2D2D',
                      background: '#FAFAFA',
                      border: '1.5px solid #E5E7EB',
                      borderRadius: 14,
                      outline: 'none',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#22C55E' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB' }}
                  />
                  {isYouTubeUrl && manualTranscript.trim() && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 12, fontWeight: 700, color: '#166534' }}>
                      <CheckCircle style={{ width: 13, height: 13 }} />
                      Using your transcript
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Options row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>Level</label>
                <div className="relative">
                  <select value={cefrLevel} onChange={e => setCefrLevel(e.target.value)} style={selectStyle}>
                    {STUDENT_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>Duration</label>
                <div className="relative">
                  <select value={duration} onChange={e => setDuration(Number(e.target.value))} style={selectStyle}>
                    {LESSON_LENGTHS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>Age Group</label>
                <div className="relative">
                  <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} style={selectStyle}>
                    {AGE_GROUPS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* CTA + Start Over */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); generate() }}
                disabled={!pastedContent.trim()}
                style={{
                  width: '100%',
                  padding: '15px 24px',
                  borderRadius: 14,
                  border: 'none',
                  cursor: pastedContent.trim() ? 'pointer' : 'not-allowed',
                  background: pastedContent.trim()
                    ? 'linear-gradient(135deg, #BE185D, #EC4899)'
                    : '#F3F4F6',
                  color: pastedContent.trim() ? 'white' : '#9CA3AF',
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: '-0.2px',
                  boxShadow: pastedContent.trim() ? '0 8px 24px rgba(190,24,93,0.30)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                ✨ {result ? 'Regenerate Lesson' : 'Generate Lesson'}
              </button>

              {result && (
                <button
                  type="button"
                  onClick={startOver}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 12, color: '#9CA3AF', padding: '4px 0' }}
                >
                  <RotateCcw style={{ width: 11, height: 11 }} />
                  Start over
                </button>
              )}
            </div>

            <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#9CA3AF', lineHeight: 1.5 }}>
              {isYouTubeUrl
                ? "YouTube sometimes blocks automated transcript extraction. If it does, we'll build a complete lesson from the video title — or use the transcript option above."
                : "Tip: For YouTube videos, just paste the URL. We'll grab the transcript automatically."
              }
            </p>
          </div>
        )}

        {/* ── Content note badge (tips & fallback notices) ── */}
        {result?.contentNote && !loading && (
          result.contentNote.startsWith('💡')
            ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', marginBottom: 16, background: 'rgba(219,234,254,0.9)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 12, animation: 'fadeInUp 0.4s ease both' }}>
                <p style={{ fontSize: 12, color: '#1E40AF', fontWeight: 600, lineHeight: 1.4 }}>{result.contentNote}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', marginBottom: 16, background: 'rgba(254,243,199,0.9)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, animation: 'fadeInUp 0.4s ease both' }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <p style={{ fontSize: 12, color: '#92400E', fontWeight: 600, lineHeight: 1.4 }}>{result.contentNote}</p>
              </div>
            )
        )}

        {/* ── Full lesson output ── */}
        {result && !loading && formData && (
          <div style={{ animation: 'fadeInUp 0.5s ease both' }}>
            <LessonOutput
              lesson={result.lesson}
              formData={formData}
              onAdjust={() => {}}
              adjusting={adjusting}
            />
          </div>
        )}

      </div>
    </div>
  )
}
