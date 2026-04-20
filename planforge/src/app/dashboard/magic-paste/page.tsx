'use client'

import { useState, useEffect, useRef } from 'react'
import { Wand2, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react'
import { ClassSelector } from '@/components/dashboard/ClassSelector'
import { STUDENT_LEVELS, LESSON_LENGTHS, AGE_GROUPS } from '@/lib/utils'
import type { ClassProfile, LessonContent } from '@/types'
import toast from 'react-hot-toast'

const LOADING_MESSAGES = [
  'Reading your content...',
  'Understanding the topic...',
  'Building your lesson...',
  'Crafting exercises...',
  'Almost ready...',
]

export default function MagicPastePage() {
  const [pastedContent, setPastedContent]     = useState('')
  const [cefrLevel, setCefrLevel]             = useState('B1')
  const [duration, setDuration]               = useState(60)
  const [ageGroup, setAgeGroup]               = useState('Adults')
  const [selectedClass, setSelectedClass]     = useState<ClassProfile | null>(null)
  const [loading, setLoading]                 = useState(false)
  const [loadingMsg, setLoadingMsg]           = useState(LOADING_MESSAGES[0])
  const [result, setResult]                   = useState<{ lesson: LessonContent; sourceLabel: string; sourcePreview: string } | null>(null)
  const [error, setError]                     = useState<string | null>(null)
  const intervalRef                           = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (loading) {
      let i = 0
      intervalRef.current = setInterval(() => {
        i = (i + 1) % LOADING_MESSAGES.length
        setLoadingMsg(LOADING_MESSAGES[i])
      }, 3000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setLoadingMsg(LOADING_MESSAGES[0])
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [loading])

  const generate = async () => {
    console.log('[MagicPaste] generate() called, pastedContent length:', pastedContent.length)
    if (!pastedContent.trim()) {
      console.log('[MagicPaste] early return — pastedContent is empty')
      return
    }
    setError(null)
    setResult(null)
    setLoading(true)
    console.log('[MagicPaste] setLoading(true) — fetching API...')
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

        {/* ── Loading state ── */}
        {loading && (
          <div style={{ ...glass, padding: 40, textAlign: 'center', animation: 'fadeInUp 0.3s ease both', marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#BE185D,#EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(190,24,93,0.25)', animation: 'spin 2s linear infinite' }}>
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#2D2D2D', marginBottom: 6 }}>{loadingMsg}</p>
            <p style={{ fontSize: 12, color: '#9CA3AF' }}>This usually takes 20–30 seconds</p>
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

        {/* ── Success banner (Phase 3 will show full LessonOutput here) ── */}
        {result && !loading && (
          <div style={{ ...glass, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, border: '1px solid rgba(34,197,94,0.25)', background: 'rgba(240,253,244,0.95)', animation: 'fadeInUp 0.4s ease both' }}>
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>Lesson generated: <em>{result.lesson.title}</em></p>
              <p style={{ fontSize: 12, color: '#4B7C62', marginTop: 2 }}>✨ Generated from: {result.sourceLabel}</p>
            </div>
          </div>
        )}

        {/* ── Main form card ── */}
        {!loading && (
          <div style={{ ...glass, padding: 28, animation: 'fadeInUp 0.55s ease both' }}>

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

            {/* CTA button */}
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

            <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#9CA3AF', lineHeight: 1.5 }}>
              Tip: For YouTube videos, just paste the URL. We&apos;ll grab the transcript automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
