'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { UserProfile } from '@/types'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      let { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profile) {
        const { data: created } = await supabase
          .from('users')
          .upsert({
            id: session.user.id,
            email: session.user.email ?? '',
            full_name: session.user.user_metadata?.full_name ?? '',
          }, { onConflict: 'id' })
          .select('*')
          .single()
        profile = created
      }

      if (profile) {
        setUserProfile(profile)
      }
      setLoading(false)
    }
    fetchUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.push('/auth/login')
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-[#6B6860]">Loading your workspace...</span>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    const handleSignOut = async () => {
      await supabase.auth.signOut()
      router.push('/auth/login')
    }
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-[#2D2D2D] font-semibold mb-2">Unable to load your profile</p>
          <p className="text-[#6B6860] text-sm mb-6">
            Something went wrong reading your account. Try again, or sign out and use a different account.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl border border-[#E8E4DE] text-[#4A473E] text-sm font-semibold hover:bg-[#F4F2EE] transition-colors"
            >
              Try again
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-xl bg-[#2D6A4F] text-white text-sm font-semibold hover:bg-[#245E44] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex">
      <Sidebar userProfile={userProfile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header userProfile={userProfile} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
