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
  Globe,
  Users,
} from 'lucide-react'

interface SidebarProps {
  userProfile: UserProfile
}

const CLASS_SECTION = [
  { label: 'My Classes', href: '/dashboard/classes', icon: Users },
]

const NAV_LINKS = [
  { label: 'Lesson Generator',  href: '/dashboard/lesson-generator',  icon: BookOpen },
  { label: 'Worksheet Builder', href: '/dashboard/worksheet-builder', icon: FileText },
  { label: 'Error Coach',       href: '/dashboard/error-coach',       icon: AlertCircle },
  { label: 'Demo Lesson',       href: '/dashboard/demo-lesson',       icon: Presentation },
  { label: 'Job Assistant',     href: '/dashboard/job-assistant',     icon: Briefcase },
  { label: 'Saved Library',     href: '/dashboard/saved',             icon: Library },
  { label: 'Shared Resources',  href: '/dashboard/shared-resources',  icon: Globe },
  { label: 'Settings',          href: '/dashboard/settings',          icon: Settings },
]

const FREE_LESSON_LIMIT = 5

export function Sidebar({ userProfile }: SidebarProps) {
  const pathname = usePathname()
  const isFree = userProfile.subscription_status === 'free'
  const lessonsUsed = Math.min(userProfile.lessons_used_this_month, FREE_LESSON_LIMIT)
  const progressPercent = Math.round((lessonsUsed / FREE_LESSON_LIMIT) * 100)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-gray-200 px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-extrabold text-gray-900 tracking-tight">
          Tyoutor <span className="text-teal-600">Pro</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {/* My Classes section */}
        <div>
          <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">My Classes</p>
          {CLASS_SECTION.map(({ label, href, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150',
                  active
                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-teal-600' : 'text-gray-400')} />
                {label}
              </Link>
            )
          })}
        </div>

        {/* Tools section */}
        <div>
          <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Tools</p>
          <div className="space-y-0.5">
            {NAV_LINKS.map(({ label, href, icon: Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150',
                    active
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-white' : 'text-gray-400')} />
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Upgrade banner — free users only */}
      {isFree && (
        <div className="border-t border-gray-200 p-4">
          <div className="rounded-xl border border-warm-200 bg-warm-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900">Free plan</span>
              <span className="text-xs text-gray-500">{lessonsUsed}/{FREE_LESSON_LIMIT} lessons</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  progressPercent >= 100 ? 'bg-red-500' : progressPercent >= 80 ? 'bg-amber-500' : 'bg-teal-500'
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <Link
              href="/dashboard/upgrade"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-teal-500"
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
