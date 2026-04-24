import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tyoutorpro.io'

export const metadata: Metadata = {
  title: 'Log In — Tyoutor Pro',
  description: 'Log in to your Tyoutor Pro account.',
  alternates: { canonical: `${SITE_URL}/auth/login` },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Log In — Tyoutor Pro',
    description: 'Log in to your Tyoutor Pro account.',
    type: 'website',
    url: `${SITE_URL}/auth/login`,
    siteName: 'Tyoutor Pro',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Tyoutor Pro' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Log In — Tyoutor Pro',
    description: 'Log in to your Tyoutor Pro account.',
    images: ['/og-default.jpg'],
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
