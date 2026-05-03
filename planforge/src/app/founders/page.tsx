import type { Metadata } from 'next'
import { FoundersClient } from './FoundersClient'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tyoutorpro.io'

export const metadata: Metadata = {
  title: 'Tyoutor Pro — Founding Member Offer · $8/month for life',
  description: 'AI lesson planner, photo error correction, QR-code student practice, and a shared resource library — built by an ESL teacher, for ESL teachers. Lock in $8/month for life as a founding member.',
  alternates: { canonical: `${SITE_URL}/founders` },
  openGraph: {
    title: 'Become a Tyoutor Pro Founding Member — $8/month for life',
    description: 'AI lesson planner, photo error correction, QR-code student practice, and a shared resource library for ESL teachers.',
    type: 'website',
    url: `${SITE_URL}/founders`,
    siteName: 'Tyoutor Pro',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Tyoutor Pro — Founding Member Offer' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tyoutor Pro Founding Member Offer',
    description: '$8/month for life. Limited to the first 200 founding members.',
    images: ['/og-default.jpg'],
  },
}

export default function FoundersPage() {
  return <FoundersClient />
}
