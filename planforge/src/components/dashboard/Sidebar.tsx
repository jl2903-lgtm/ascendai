'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn, FREE_LIMITS } from '@/lib/utils'
import { FREE_TRIAL_CUTOFF } from '@/lib/constants'
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
  Wand2,
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
  { label: 'Magic Paste',       href: '/dashboard/magic-paste',       icon: Wand2 },
  { label: 'Error Coach',       href: '/dashboard/error-coach',       icon: AlertCircle },
  { label: 'Demo Lesson',       href: '/dashboard/demo-lesson',       icon: Presentation },
]

const TOOLS_LINKS = [
  { label: 'Job Assistant', href: '/dashboard/job-assistant', icon: Briefcase },
]

const LIBRARY_LINKS = [
  { label: 'Saved Library',    href: '/dashboard/saved',            icon: Library },
  { label: 'Shared Resources', href: '/dashboard/shared-resources', icon: Globe },
  { label: 'Settings',         href: '/dashboard/settings',         icon: Settings },
]

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  color: '#8C8880',
  letterSpacing: '1.2px',
  textTransform: 'uppercase',
}

function LegacyUpgradeCard({ userProfile }: { userProfile: UserProfile }) {
  const [loading, setLoading] = useState(false)
  const [upgradeError, setUpgradeError] = useState<string | null>(null)
  const used = userProfile.lessons_used_this_month ?? 0
  const limit = FREE_LIMITS.lessons
  const remaining = Math.max(0, limit - used)
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const isUrgent = remaining <= 1

  const handleUpgrade = async () => {
    setLoading(true)
    setUpgradeError(null)
    try {
      const res = await fetch('/api/stripe/upgrade', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setUpgradeError(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setUpgradeError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <div
        className="rounded-2xl p-4 space-y-2.5"
        style={{
          background: isUrgent
            ? 'linear-gradient(135deg, #92400E, #B45309)'
            : 'linear-gradient(135deg, #2D2D2D, #4A473E)',
        }}
      >
        <div>
          <p className="text-white font-extrabold text-sm">Free Plan</p>
          <p className="mt-0.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {used} of {limit} free lessons used
          </p>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: 'rgba(255,255,255,0.2)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: isUrgent
                ? 'linear-gradient(90deg, #FBBF24, #F59E0B)'
                : 'linear-gradient(90deg, #52B788, #95D5B2)',
              boxShadow: isUrgent
                ? '0 2px 8px rgba(251,191,36,0.4)'
                : '0 2px 8px rgba(82,183,136,0.4)',
            }}
          />
        </div>
        {upgradeError && (
          <p className="text-[10px] text-red-300">{upgradeError}</p>
        )}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full text-center text-[12.5px] font-bold py-2 rounded-xl transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)', color: 'white' }}
        >
          {loading ? 'Loading...' : 'Upgrade to Pro →'}
        </button>
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
          $12/mo · Unlimited access · Cancel anytime
        </p>
      </div>
    </div>
  )
}

function TrialBadge({ trialEnd }: { trialEnd: string | null }) {
  if (!trialEnd) return null

  const msLeft = new Date(trialEnd).getTime() - Date.now()
  const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))
  const isUrgent = daysLeft <= 2
  const progressPercent = Math.round(((7 - daysLeft) / 7) * 100)

  return (
    <div className="p-4">
      <div
        className="rounded-2xl p-4 space-y-2.5"
        style={{
          background: isUrgent
            ? 'linear-gradient(135deg, #92400E, #B45309)'
            : 'linear-gradient(135deg, #1B4332, #2D6A4F)',
        }}
      >
        <div>
          <p className="text-white font-extrabold text-sm">
            {isUrgent ? '⚠️ Trial ending soon' : 'Free Trial'}
          </p>
          <p className="mt-0.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {daysLeft === 0
              ? 'Trial expires today'
              : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`}
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
              background: isUrgent
                ? 'linear-gradient(90deg, #FBBF24, #F59E0B)'
                : 'linear-gradient(90deg, #52B788, #95D5B2)',
              boxShadow: isUrgent
                ? '0 2px 8px rgba(251,191,36,0.4)'
                : '0 2px 8px rgba(82,183,136,0.4)',
            }}
          />
        </div>
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
          $12/mo after trial · Cancel anytime
        </p>
      </div>
    </div>
  )
}

export function Sidebar({ userProfile, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')
  const isLegacyUser = new Date(userProfile.created_at) < FREE_TRIAL_CUTOFF
  const isPro = userProfile.subscription_status === 'pro'
  const isTrialing = userProfile.subscription_status === 'trialing'
  const showLegacyCard = isLegacyUser && !isPro && !isTrialing

  const navItem = (href: string, Icon: React.ElementType, label: string) => {
    const active = isActive(href)
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          'flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-[13.5px] font-semibold transition-all duration-150',
          active ? 'border text-[#2D6A4F]' : 'text-[#6B6860] hover:bg-[#F4F2EE] hover:text-[#2D2D2D]'
        )}
        style={active ? { background: 'linear-gradient(135deg, #E8F5E9, #F0FFF4)', borderColor: '#C6F6D5' } : {}}
      >
        <Icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-[#2D6A4F]' : 'text-[#9E9C98]')} />
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
          <p className="px-3 mb-1.5" style={SECTION_LABEL_STYLE}>Tools</p>
          <div className="space-y-0.5">
            {TOOLS_LINKS.map(({ label, href, icon: Icon }) => navItem(href, Icon, label))}
          </div>
        </div>

        <div>
          <p className="px-3 mb-1.5" style={SECTION_LABEL_STYLE}>Library</p>
          <div className="space-y-0.5">
            {LIBRARY_LINKS.map(({ label, href, icon: Icon }) => navItem(href, Icon, label))}
          </div>
        </div>
      </nav>

      {/* Trial countdown — new trialing users only */}
      {isTrialing && <TrialBadge trialEnd={userProfile.trial_end} />}
      {/* Free usage counter — legacy users who haven't upgraded */}
      {showLegacyCard && <LegacyUpgradeCard userProfile={userProfile} />}
    </aside>
    </>
  )
}
