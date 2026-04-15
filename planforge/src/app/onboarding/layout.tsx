import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Set Up Your Class — Tyoutor Pro',
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {children}
    </div>
  )
}
