'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LogOut, User, Menu } from 'lucide-react'

interface HeaderProps {
  userProfile: UserProfile
  onMenuClick?: () => void
}

export function Header({ userProfile, onMenuClick }: HeaderProps) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const displayName = userProfile.full_name?.trim() || userProfile.email

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-[#E8E4DE] bg-white px-4 lg:px-6">
      {/* Left — hamburger (mobile) + user info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden -ml-1 p-2 rounded-lg text-[#6B6860] hover:bg-[#F4F2EE] transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 border border-teal-200 text-teal-600">
          <User className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold text-[#2D2D2D] truncate max-w-[200px]">
            {displayName}
          </span>
          {userProfile.full_name?.trim() && (
            <span className="text-xs text-[#6B6860] truncate max-w-[200px]">
              {userProfile.email}
            </span>
          )}
        </div>
      </div>

      {/* Right — badge + logout */}
      <div className="flex items-center gap-3">
        <Badge variant={userProfile.subscription_status === 'pro' ? 'pro' : 'free'}>
          {userProfile.subscription_status === 'pro' ? 'Pro' : 'Free'}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          loading={loggingOut}
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </div>
    </header>
  )
}
