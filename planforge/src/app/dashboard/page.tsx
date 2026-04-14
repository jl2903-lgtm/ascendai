'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, Lesson, Worksheet } from '@/types'
import { BookOpen, FileText, MessageSquare, Star, Briefcase, CheckCircle, Zap, ArrowRight, TrendingUp } from 'lucide-react'
import { formatDate, FREE_LIMITS } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

const tools = [
  { href: '/dashboard/lesson-generator', icon: BookOpen, label: 'Lesson Generator', desc: 'Full lesson plan in 60 seconds', color: 'teal', tag: null },
  { href: '/dashboard/worksheet-builder', icon: FileText, label: 'Worksheet Builder', desc: 'Custom exercises with answer keys', color: 'blue', tag: null },
  { href: '/dashboard/error-coach', icon: CheckCircle, label: 'Error Coach', desc: 'Analyse student writing', color: 'purple', tag: null },
  { href: '/dashboard/demo-lesson', icon: Star, label: 'Demo Lesson', desc: 'Interview-ready lesson plan', color: 'amber', tag: null },
  { href: '/dashboard/job-assistant', icon: Briefcase, label: 'Job Assistant', desc: 'Cover letters & motivation statements', color: 'rose', tag: null },
  { href: '/dashboard/saved', icon: MessageSquare, label: 'Saved Library', desc: 'Your lessons and worksheets', color: 'slate', tag: null },
]

const colorMap: Record<string, string> = {
  teal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
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
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([])
  const [recentWorksheets, setRecentWorksheets] = useState<Worksheet[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const [{ data: p }, { data: lessons }, { data: worksheets }] = await Promise.all([
        supabase.from('users').select('*').eq('id', session.user.id).single(),
        supabase.from('lessons').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('worksheets').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(3),
      ])
      if (p) setProfile(p)
      if (lessons) setRecentLessons(lessons)
      if (worksheets) setRecentWorksheets(worksheets)
    }
    load()
  }, [])

  const isPro = profile?.subscription_status === 'pro'
  const lessonsLeft = Math.max(0, FREE_LIMITS.lessons - (profile?.lessons_used_this_month ?? 0))

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <Suspense fallback={null}>
        <UpgradeToast />
      </Suspense>
      {/* Welcome */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            {isPro ? 'You have unlimited access to all tools.' : `${lessonsLeft} free lesson${lessonsLeft !== 1 ? 's' : ''} remaining this month.`}
          </p>
        </div>
        <Link href="/dashboard/lesson-generator" className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm shadow-lg shadow-teal-600/20 hover:scale-105">
          <Zap className="w-4 h-4" />
          Generate Lesson
        </Link>
      </div>

      {/* Upgrade banner for free users */}
      {!isPro && lessonsLeft <= 2 && (
        <div className="bg-gradient-to-r from-teal-600/20 to-cyan-600/10 border border-teal-600/40 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">
                {lessonsLeft === 0 ? "You've used all free lessons this month" : `Only ${lessonsLeft} free lesson${lessonsLeft !== 1 ? 's' : ''} left`}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Upgrade to Pro for unlimited lessons, worksheets, and PDF export.</div>
            </div>
          </div>
          <Link href="/pricing" className="flex-shrink-0 bg-teal-600 hover:bg-teal-500 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors">
            Upgrade — $19/mo
          </Link>
        </div>
      )}

      {/* Tools grid — Eduaide-style cards */}
      <div>
        <h2 className="text-base font-semibold text-gray-500 uppercase tracking-wider mb-4">Your Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map(tool => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group bg-white border border-gray-200 hover:border-teal-600/50 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-200/60"
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${colorMap[tool.color]}`}>
                <tool.icon className="w-5 h-5" />
              </div>
              <div className="font-semibold text-gray-900 text-sm mb-1">{tool.label}</div>
              <div className="text-xs text-gray-500">{tool.desc}</div>
              <div className="flex items-center gap-1 mt-4 text-teal-500 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Open tool <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Lessons Generated', value: profile?.lessons_used_this_month ?? 0, icon: BookOpen, sub: 'this month' },
          { label: 'Worksheets Made', value: profile?.worksheets_used_this_month ?? 0, icon: FileText, sub: 'this month' },
          { label: 'Saved Lessons', value: recentLessons.length, icon: Star, sub: 'in library' },
          { label: 'Account Status', value: isPro ? 'Pro' : 'Free', icon: Zap, sub: isPro ? 'unlimited access' : '5/mo limit' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="w-4 h-4 text-teal-500" />
              <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      {(recentLessons.length > 0 || recentWorksheets.length > 0) && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-500 uppercase tracking-wider">Recent Activity</h2>
            <Link href="/dashboard/saved" className="text-sm text-teal-400 hover:text-teal-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {recentLessons.map(l => (
              <div key={l.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-teal-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{l.title}</div>
                    <div className="text-xs text-gray-400">{l.student_level} · {l.topic}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">{formatDate(l.created_at)}</div>
              </div>
            ))}
            {recentWorksheets.map(w => (
              <div key={w.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-blue-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{w.title}</div>
                    <div className="text-xs text-gray-400">Worksheet</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">{formatDate(w.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
