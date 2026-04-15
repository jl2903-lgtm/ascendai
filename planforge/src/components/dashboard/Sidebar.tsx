'use client'
import { useState } from 'react'
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
  Globe,
  Users,
  Sparkles,
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

interface SidebarProps {
  userProfile: UserProfile
  isOpen?: boolean
  onClose?: () => void
}

const CLASS_LINKS = [
  { label: 'My Classes', href: '/dashboard/classes', icon: Users },
]

const CREATE_LINKS = [
  { label: 'Lesson Generator',  href: '/dashboard/lesson-generator',  icon: BookOpen },
  { label: 'Worksheet Builder', href: '/dashboard/worksheet-builder', icon: FileText },
  { label: 'Error Coach',       href: '/dashboard/error-coach',       icon: AlertCircle },
  { label: 'Demo Lesson',       href: '/dashboard/demo-lesson',       icon: Presentation },
  { label: 'Job Assistant',     href: '/dashboard/job-assistant',     icon: Briefcase },
]

const LIBRARY_LINKS = [
  { label: 'Saved Library',    href: '/dashboard/saved',            icon: Library },
  { label: 'Shared Resources', href: '/dashboard/shared-resources', icon: Globe },
  { label: 'Settings',         href: '/dashboard/settings',         icon: Settings },
]

const FREE_LESSON_LIMIT = 5

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  color: '#BBB',
  letterSpacing: '1.2px',
  textTransform: 'uppercase',
}

export function Sidebar({ userProfile, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const isFree = userProfile.subscription_status === 'free'
  const lessonsUsed = Math.min(userProfile.lessons_used_this_month, FREE_LESSON_LIMIT)
  const progressPercent = Math.round((lessonsUsed / FREE_LESSON_LIMIT) * 100)
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const handleUpgrade = async () => {
    setUpgradeLoading(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      // silently fail — user can try again
    } finally {
      setUpgradeLoading(false)
    }
  }

  const navItem = (href: string, Icon: React.ElementType, label: string) => {
    const active = isActive(href)
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          'flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-[13.5px] font-semibold transition-all duration-150',
          active ? 'border text-[#2D6A4F]' : 'text-[#6B6B6B] hover:bg-gray-50 hover:text-gray-900'
        )}
        style={active ? { background: 'linear-gradient(135deg, #E8F5E9, #F0FFF4)', borderColor: '#C6F6D5' } : {}}
      >
        <Icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-[#2D6A4F]' : 'text-gray-400')} />
        {label}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          aria-hidden
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

    <aside
      className={cn(
        'flex h-screen w-64 flex-shrink-0 flex-col border-r border-[#EDEBE8] transition-transform duration-300',
        isOpen
          ? 'fixed inset-y-0 left-0 z-50 shadow-2xl'
          : 'hidden lg:flex sticky top-0'
      )}
      style={{ background: 'linear-gradient(180deg, #FFFFFF, #FAFDF8)' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#EDEBE8]">
        <Logo showSubtitle href="/dashboard" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        <div>
          <p className="px-3 mb-1.5" style={SECTION_LABEL_STYLE}>My Classes</p>
          {CLASS_LINKS.map(({ label, href, icon: Icon }) => navItem(href, Icon, label))}
        </div>

        <div>
          <p className="px-3 mb-1.5" style={SECTION_LABEL_STYLE}>Create</p>
          <div className="space-y-0.5">
            {CREATE_LINKS.map(({ label, href, icon: Icon }) => navItem(href, Icon, label))}
          </div>
        </div>

        <div>
          <p className="px-3 mb-1.5" style={SECTION_LABEL_STYLE}>Library</p>
          <div className="space-y-0.5">
            {LIBRARY_LINKS.map(({ label, href, icon: Icon }) => navItem(href, Icon, label))}
          </div>
        </div>
      </nav>

      {/* Upgrade card — free users only */}
      {isFree && (
        <div className="p-4">
          <div
            className="relative overflow-hidden rounded-2xl p-4 space-y-3"
            style={{ background: 'linear-gradient(135deg, #2D6A4F, #1B4332)' }}
          >
            {/* Decorative circle */}
            <div
              style={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
              }}
            />
            <div>
              <p className="text-white font-extrabold text-sm">Go Pro ✨</p>
              <p className="mt-0.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {lessonsUsed}/{FREE_LESSON_LIMIT} lessons used
              </p>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #52B788, #95D5B2)',
                  boxShadow: '0 2px 8px rgba(82,183,136,0.4)',
                }}
              />
            </div>
            <button
              onClick={handleUpgrade}
              disabled={upgradeLoading}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white bg-white/15 hover:bg-white/25 transition-colors disabled:opacity-60"
            >
              {upgradeLoading ? (
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {upgradeLoading ? 'Redirecting...' : 'Upgrade to Pro'}
            </button>
          </div>
        </div>
      )}
    </aside>
    </>
  )
}
