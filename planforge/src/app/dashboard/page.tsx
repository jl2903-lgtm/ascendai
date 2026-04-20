'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, Lesson, Worksheet, ClassProfile } from '@/types'
import { formatDate, FREE_LIMITS } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

interface UserStats {
  total_lessons_created: number
  total_worksheets_created: number
  lessons_this_week: number
  worksheets_this_week: number
  last_weekly_reset: string
}

const toolCards = [
  { href: '/dashboard/magic-paste', emoji: '✨', label: 'Magic Paste', desc: 'Turn any content into a lesson', accent: '#BE185D', accentLight: '#EC4899', tags: [{ label: 'Articles', c: 'pink' }, { label: 'Videos', c: 'pink' }, { label: 'Any Topic', c: 'muted' }] },
  { href: '/dashboard/lesson-generator', emoji: '✏️', label: 'Lesson Generator', desc: 'Full lesson plan in 60 seconds', accent: '#2D6A4F', accentLight: '#52B788', tags: [{ label: 'PPP', c: 'green' }, { label: 'TTT', c: 'green' }, { label: 'ESA', c: 'orange' }] },
  { href: '/dashboard/worksheet-builder', emoji: '📝', label: 'Worksheet Builder', desc: 'Custom exercises with answer keys', accent: '#E07A5F', accentLight: '#F4A78A', tags: [{ label: 'A1–C2', c: 'orange' }, { label: 'Print-ready', c: 'indigo' }] },
  { href: '/dashboard/error-coach', emoji: '📸', label: 'Error Coach', desc: 'Analyse student writing mistakes', accent: '#9B59B6', accentLight: '#C39BD3', tags: [{ label: 'Photo Upload', c: 'purple' }, { label: 'CEFR', c: 'orange' }] },
  { href: '/dashboard/demo-lesson', emoji: '🎯', label: 'Demo Lesson', desc: 'Interview-ready lesson plan', accent: '#E07A5F', accentLight: '#F4A78A', tags: [{ label: 'Interview', c: 'orange' }, { label: 'CELTA', c: 'green' }] },
  { href: '/dashboard/job-assistant', emoji: '💼', label: 'Job Assistant', desc: 'Craft winning TEFL applications', accent: '#0F766E', accentLight: '#14B8A6', tags: [{ label: 'Cover Letter', c: 'teal' }, { label: 'CV', c: 'indigo' }] },
  { href: '/dashboard/saved', emoji: '📚', label: 'Saved Library', desc: 'Your lessons and worksheets', accent: '#5B8FB9', accentLight: '#85B5D4', tags: [{ label: 'Search', c: 'indigo' }] },
]

const TC: Record<string, { bg: string; text: string }> = {
  green:  { bg: '#E8F5E9', text: '#2E7D32' },
  orange: { bg: '#FFF3E0', text: '#E65100' },
  indigo: { bg: '#E8EAF6', text: '#283593' },
  purple: { bg: '#F3E5F5', text: '#6A1B9A' },
  pink:   { bg: '#FCE7F3', text: '#BE185D' },
  teal:   { bg: '#CCFBF1', text: '#0F766E' },
  muted:  { bg: '#F5F4F0', text: '#6B6B6B' },
}

function Pill({ label, c }: { label: string; c: string }) {
  const col = TC[c] ?? TC.muted
  return (
    <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: col.bg, color: col.text }}>
      {label}
    </span>
  )
}

function SectionDivider({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#2D2D2D', whiteSpace: 'nowrap' }}>{title}</h2>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,#E8E4DE,transparent)' }} />
      {action}
    </div>
  )
}

function UpgradeToast() {
  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      toast.success('Welcome to Tyoutor Pro! All limits removed. 🎉')
    }
  }, [searchParams])
  return null
}

export default function DashboardPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [classCount, setClassCount] = useState(0)
  const [activeClass, setActiveClass] = useState<ClassProfile | null>(null)
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([])
  const [recentWorksheets, setRecentWorksheets] = useState<Worksheet[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const [{ data: p }, { data: stats }, { data: classes }, { data: lessons }, { data: worksheets }] = await Promise.all([
        supabase.from('users').select('*').eq('id', session.user.id).single(),
        supabase.from('user_stats').select('*').eq('user_id', session.user.id).single(),
        supabase.from('class_profiles').select('*').eq('user_id', session.user.id).order('updated_at', { ascending: false }),
        supabase.from('lessons').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(4),
        supabase.from('worksheets').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(2),
      ])
      if (p) setProfile(p)
      if (stats) {
        const lastReset = new Date(stats.last_weekly_reset)
        const weekExpired = (Date.now() - lastReset.getTime()) > 7 * 24 * 60 * 60 * 1000
        setUserStats(weekExpired ? { ...stats, lessons_this_week: 0, worksheets_this_week: 0 } : stats)
      }
      if (classes) {
        setClassCount(classes.length)
        setActiveClass(classes[0] ?? null)
      }
      if (lessons) setRecentLessons(lessons)
      if (worksheets) setRecentWorksheets(worksheets)
    }
    load()
  }, [])

  const isPro = profile?.subscription_status === 'pro'
  const lessonsLeft = Math.max(0, FREE_LIMITS.lessons - (profile?.lessons_used_this_month ?? 0))
  const firstName = profile?.full_name?.split(' ')[0] ?? ''
  const initial = firstName ? firstName[0].toUpperCase() : '?'
  const timeSavedH = Math.round(((userStats?.total_lessons_created ?? 0) * 20 + (userStats?.total_worksheets_created ?? 0) * 15) / 60)

  const activity = [
    ...recentLessons.map(l => ({ id: l.id, emoji: '✏️', title: l.title, sub: `${l.student_level} · ${l.topic}`, type: 'Lesson', tc: 'green', date: l.created_at })),
    ...recentWorksheets.map(w => ({ id: w.id, emoji: '📝', title: w.title, sub: 'Worksheet', type: 'Worksheet', tc: 'orange', date: w.created_at })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  const glass: React.CSSProperties = { background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16 }

  return (
    <div className="relative max-w-6xl mx-auto pb-10" style={{ zIndex: 1 }}>
      <Suspense fallback={null}><UpgradeToast /></Suspense>

      {/* Background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-dot-pattern" style={{ zIndex: 0 }} />
      <div aria-hidden style={{ position: 'fixed', width: 500, height: 400, top: -100, right: -100, borderRadius: '50%', filter: 'blur(80px)', background: 'radial-gradient(ellipse,#D4E8D0,#A7C4A0)', opacity: 0.12, pointerEvents: 'none', zIndex: 0, animation: 'blobFloat 8s ease-in-out 0s infinite alternate' }} />
      <div aria-hidden style={{ position: 'fixed', width: 400, height: 350, bottom: 0, left: -80, borderRadius: '50%', filter: 'blur(80px)', background: 'radial-gradient(ellipse,#FFE5D9,#FECDA6)', opacity: 0.10, pointerEvents: 'none', zIndex: 0, animation: 'blobFloat 8s ease-in-out 4s infinite alternate' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 mb-6" style={{ animation: 'fadeInUp 0.5s ease both' }}>
          <div>
            <p style={{ fontSize: 13, color: '#999', fontWeight: 600, marginBottom: 4 }}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#2D2D2D', lineHeight: 1.2 }}>
              Welcome back{firstName ? `, ${firstName}` : ''}! 👋
            </h1>
            <p className="mt-1" style={{ fontSize: 14, color: '#7A7A7A' }}>
              {isPro ? 'You have unlimited access to all tools.' : `${lessonsLeft} free lesson${lessonsLeft !== 1 ? 's' : ''} remaining this month.`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/dashboard/lesson-generator" style={{ background: 'linear-gradient(135deg,#2D6A4F,#40916C)', color: 'white', borderRadius: 12, fontWeight: 700, fontSize: 13, padding: '10px 18px', boxShadow: '0 4px 12px rgba(45,106,79,0.25)', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              ✏️ New Lesson
            </Link>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#E07A5F,#E8976B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
              {initial}
            </div>
          </div>
        </div>

        {/* ── Upgrade banner ── */}
        {!isPro && lessonsLeft <= 2 && (
          <div className="rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap mb-6" style={{ background: 'linear-gradient(135deg,rgba(45,106,79,0.1),rgba(82,183,136,0.06))', border: '1px solid rgba(45,106,79,0.2)', animation: 'fadeInUp 0.55s ease both' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#2D2D2D', fontSize: 14 }}>
                {lessonsLeft === 0 ? "You've used all free lessons this month" : `Only ${lessonsLeft} free lesson${lessonsLeft !== 1 ? 's' : ''} left`}
              </div>
              <div style={{ fontSize: 12, color: '#7A7A7A', marginTop: 2 }}>Upgrade to Pro for unlimited lessons, worksheets, and PDF export.</div>
            </div>
            <Link href="/pricing" style={{ background: 'linear-gradient(135deg,#2D6A4F,#40916C)', color: 'white', fontWeight: 700, fontSize: 13, padding: '8px 18px', borderRadius: 999, boxShadow: '0 4px 12px rgba(45,106,79,0.2)' }}>
              Upgrade — $12/mo
            </Link>
          </div>
        )}

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" style={{ animation: 'fadeInUp 0.6s ease both' }}>
          {[
            { emoji: '✏️', label: 'LESSONS',    value: userStats?.total_lessons_created ?? 0,    trend: (userStats?.lessons_this_week ?? 0) > 0 ? `↑ ${userStats!.lessons_this_week} this week` : 'Get started!' },
            { emoji: '📝', label: 'WORKSHEETS', value: userStats?.total_worksheets_created ?? 0, trend: (userStats?.worksheets_this_week ?? 0) > 0 ? `↑ ${userStats!.worksheets_this_week} this week` : 'Get started!' },
            { emoji: '👥', label: 'CLASSES',    value: classCount, trend: classCount === 0 ? 'Add your first class' : `${classCount} active` },
            { emoji: '⏱️', label: 'TIME SAVED', value: `${timeSavedH}h`, trend: timeSavedH > 0 ? 'vs. manual planning' : 'Start generating!' },
          ].map(s => (
            <div key={s.label} style={{ ...glass, padding: '16px 18px' }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 11, fontWeight: 600, color: '#999', letterSpacing: '0.5px', textTransform: 'uppercase' as const }}>{s.label}</span>
                <span style={{ fontSize: 18 }}>{s.emoji}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#2D2D2D', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#2D6A4F', fontWeight: 600, marginTop: 4 }}>{s.trend}</div>
            </div>
          ))}
        </div>

        {/* ── Active class context bar ── */}
        {activeClass && (
          <div style={{ ...glass, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const, marginBottom: 28, animation: 'fadeInUp 0.7s ease both' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#E8F5E9,#A5D6A7)', boxShadow: '0 4px 12px rgba(45,106,79,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
              🌍
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#6B6B6B', letterSpacing: '1.2px', textTransform: 'uppercase' as const, marginBottom: 2 }}>ACTIVE CLASS</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#2D2D2D' }}>{activeClass.class_name}</div>
              <div style={{ fontSize: 12, color: '#7A7A7A', marginTop: 1 }}>{activeClass.cefr_level} · {activeClass.student_nationality} · {activeClass.student_age_group}</div>
              {activeClass.weak_areas.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {activeClass.weak_areas.slice(0, 3).map(area => (
                    <span key={area} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: '#FFF3E0', color: '#E65100', border: '1px solid rgba(230,81,0,0.15)' }}>
                      ⚠️ {area}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Link href="/dashboard/lesson-generator" style={{ background: 'linear-gradient(135deg,#2D6A4F,#40916C)', color: 'white', borderRadius: 12, fontWeight: 700, fontSize: 12, padding: '9px 18px', boxShadow: '0 4px 12px rgba(45,106,79,0.2)', whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
              Quick Lesson →
            </Link>
          </div>
        )}

        {/* ── Tools ── */}
        <SectionDivider title="Your Tools" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8" style={{ animation: 'fadeInUp 0.9s ease both' }}>
          {toolCards.map(tool => (
            <ToolCard key={tool.href} tool={tool} />
          ))}
        </div>

        {/* ── Recent Activity ── */}
        {activity.length > 0 && (
          <>
            <SectionDivider title="Recent Activity" action={<Link href="/dashboard/saved" style={{ fontSize: 12, color: '#2D6A4F', fontWeight: 700, whiteSpace: 'nowrap' }}>View all →</Link>} />
            <div style={{ ...glass, overflow: 'hidden', animation: 'fadeInUp 1s ease both' }}>
              {activity.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < activity.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{item.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#2D2D2D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>{item.sub}</div>
                  </div>
                  <Pill label={item.type} c={item.tc} />
                  <span style={{ fontSize: 11, color: '#BBB', flexShrink: 0, marginLeft: 4 }}>{formatDate(item.date)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ToolCard({ tool }: { tool: typeof toolCards[0] }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={tool.href}
      style={{
        display: 'block', textDecoration: 'none',
        background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16, overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-4px) scale(1.01)' : 'none',
        boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.08)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ height: 3, background: `linear-gradient(90deg,${tool.accent},${tool.accentLight})` }} />
      <div style={{ padding: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: `${tool.accent}1F`, border: `1px solid ${tool.accent}26`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 12 }}>
          {tool.emoji}
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#2D2D2D', marginBottom: 4 }}>{tool.label}</div>
        <div style={{ fontSize: 12.5, color: '#7A7A7A', lineHeight: 1.55, marginBottom: 12 }}>{tool.desc}</div>
        <div className="flex flex-wrap gap-1.5">
          {tool.tags.map(tag => <Pill key={tag.label} label={tag.label} c={tag.c} />)}
        </div>
      </div>
    </Link>
  )
}
