import type { Metadata } from 'next'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export const metadata: Metadata = {
  title: 'Dashboard — Tyoutor Pro',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
