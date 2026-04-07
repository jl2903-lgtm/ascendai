'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { UserProfile } from '@/types'
import {
  BookOpen,
  FileText,
  AlertCircle,
  Presentation,
  Briefcase,
  Library,
  Settings,
  Zap,
} from 'lucide-react'

interface SidebarProps {
  userProfile: UserProfile
}

const NAV_LINKS = [
  {
    label: 'Lesson Generator',
    href: '/dashboard/lesson-generator',
    icon: BookOpen,
  },
  {
    label: 'Worksheet Builder',
    href: '/dashboard/worksheet-builder',
    icon: FileText,
  },
  {
    label: 'Error Coach',
    href: '/dashboard/error-coach',
    icon: AlertCircle,
  },
  {
    label: 'Demo Lesson',
    href: '/dashboard/demo-lesson',
    icon: Presentation,
  },
  {
    label: 'Job Assistant',
    href: '/dashboard/job-assistant',
    icon: Briefcase,
  },
  {
    label: 'Saved Library',
    href: '/dashboard/saved',
    icon: Library,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

const FREE_LESSON_LIMIT = 5

export function Sidebar({ userProfile }: SidebarProps) {
  const pathname = usePathname()
  const isFree = userProfile.subscription_status === 'free'
  const lessonsUsed = Math.min(userProfile.lessons_used_this_month, FREE_LESSON_LIMIT)
  const progressPercent = Math.round((lessonsUsed / FREE_LESSON_LIMIT) * 100)

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r border-[#334155] bg-[#1E293B]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-[#334155] px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold text-teal-400 tracking-tight">PlanForge</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_LINKS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-900/40'
                  : 'text-[#94A3B8] hover:bg-[#334155]/60 hover:text-[#F8FAFC]'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 flex-shrink-0',
                  isActive ? 'text-white' : 'text-[#94A3B8]'
                )}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Upgrade banner — free users only */}
      {isFree && (
        <div className="border-t border-[#334155] p-4">
          <div className="rounded-lg border border-[#334155] bg-[#0F172A]/60 p-4 space-y-3">
            {/* Usage label */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F8FAFC]">Free plan</span>
              <span className="text-xs text-[#94A3B8]">
                {lessonsUsed}/{FREE_LESSON_LIMIT} lessons used
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#334155]">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  progressPercent >= 100
                    ? 'bg-red-500'
                    : progressPercent >= 80
                    ? 'bg-amber-500'
                    : 'bg-teal-500'
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Upgrade CTA */}
            <Link
              href="/dashboard/upgrade"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-500"
            >
              <Zap className="h-3.5 w-3.5" />
              Upgrade to Pro
            </Link>
          </div>
        </div>
      )}
    </aside>
  )
}
