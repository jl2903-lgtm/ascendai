import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tyoutorpro.io'

export const metadata: Metadata = {
  title: 'Sign Up Free — Tyoutor Pro',
  description: 'Create your free Tyoutor Pro account. 5 lesson plans included. No credit card required.',
  alternates: { canonical: `${SITE_URL}/auth/signup` },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Sign Up Free — Tyoutor Pro',
    description: 'Create your free Tyoutor Pro account. 5 lesson plans included. No credit card required.',
    type: 'website',
    url: `${SITE_URL}/auth/signup`,
    siteName: 'Tyoutor Pro',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Tyoutor Pro' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign Up Free — Tyoutor Pro',
    description: 'Create your free Tyoutor Pro account. 5 lesson plans included. No credit card required.',
    images: ['/og-default.jpg'],
  },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
