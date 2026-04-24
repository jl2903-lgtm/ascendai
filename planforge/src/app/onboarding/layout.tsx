import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Set Up Your Class — Tyoutor Pro',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {children}
    </div>
  )
}
