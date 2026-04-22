'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { UserProfile } from '@/types'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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

      // If no row exists (trigger may not have fired), create it now
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
        if (!profile.onboarding_completed) {
          router.push('/onboarding')
          return
        }
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
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#6B6860] mb-4">Unable to load your profile.</p>
          <button
            onClick={() => window.location.reload()}
            className="text-teal-600 hover:text-teal-500 text-sm underline"
          >
            Try again
          </button>
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
