'use client'

import { useState } from 'react'
import { Wand2, ChevronDown } from 'lucide-react'
import { ClassSelector } from '@/components/dashboard/ClassSelector'
import { STUDENT_LEVELS, LESSON_LENGTHS, AGE_GROUPS } from '@/lib/utils'
import type { ClassProfile } from '@/types'

export default function MagicPastePage() {
  const [pastedContent, setPastedContent] = useState('')
  const [cefrLevel, setCefrLevel]         = useState('B1')
  const [duration, setDuration]           = useState(60)
  const [ageGroup, setAgeGroup]           = useState('Adults')
  const [, setSelectedClass]              = useState<ClassProfile | null>(null)

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
    <div className="relative max-w-3xl mx-auto pb-16" style={{ zIndex: 1 }}>

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

        {/* ── Main card ── */}
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

            {/* CEFR Level */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>
                Level
              </label>
              <div className="relative">
                <select value={cefrLevel} onChange={e => setCefrLevel(e.target.value)} style={selectStyle}>
                  {STUDENT_LEVELS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>
                Duration
              </label>
              <div className="relative">
                <select value={duration} onChange={e => setDuration(Number(e.target.value))} style={selectStyle}>
                  {LESSON_LENGTHS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>

            {/* Age group */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>
                Age Group
              </label>
              <div className="relative">
                <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} style={selectStyle}>
                  {AGE_GROUPS.map(a => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* CTA button */}
          <button
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
            ✨ Generate Lesson
          </button>

          {/* Helper tip */}
          <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#9CA3AF', lineHeight: 1.5 }}>
            Tip: For YouTube videos, just paste the URL. We&apos;ll grab the transcript automatically.
          </p>
        </div>
      </div>
    </div>
  )
}
