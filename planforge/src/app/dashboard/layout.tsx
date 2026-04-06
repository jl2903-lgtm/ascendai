'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { OnboardingModal } from '@/components/dashboard/OnboardingModal'
import { UserProfile } from '@/types'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()
      if (profile) {
        setUserProfile(profile)
        if (!profile.onboarding_completed) {
          setShowOnboarding(true)
        }
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
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-[#94A3B8]">Loading your workspace...</span>
        </div>
      </div>
    )
  }

  if (!userProfile) return null

  return (
    <div className="min-h-screen bg-[#0F172A] flex">
      <Sidebar userProfile={userProfile} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <Header userProfile={userProfile} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
      {showOnboarding && (
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          userId={userProfile.id}
          onComplete={(prefs) => {
            setUserProfile(p => p ? { ...p, ...prefs, onboarding_completed: true } : p)
            setShowOnboarding(false)
          }}
        />
      )}
    </div>
  )
}
