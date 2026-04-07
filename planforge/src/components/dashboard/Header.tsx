'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LogOut, User } from 'lucide-react'

interface HeaderProps {
  userProfile: UserProfile
}

export function Header({ userProfile }: HeaderProps) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const displayName = userProfile.full_name?.trim() || userProfile.email

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-[#334155] bg-[#1E293B] px-6">
      {/* Left — user info */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#334155] text-[#94A3B8]">
          <User className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-[#F8FAFC] truncate max-w-[200px]">
            {displayName}
          </span>
          {userProfile.full_name?.trim() && (
            <span className="text-xs text-[#94A3B8] truncate max-w-[200px]">
              {userProfile.email}
            </span>
          )}
        </div>
      </div>

      {/* Right — subscription badge + logout */}
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
