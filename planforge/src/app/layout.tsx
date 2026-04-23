import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import Script from 'next/script'
import { Toaster } from 'react-hot-toast'
import './globals.css'

// TODO: Replace with the actual Google Search Console verification code (HTML tag method).
// Get yours at https://search.google.com/search-console after adding tyoutorpro.io as a property.
const GSC_VERIFICATION_CODE = process.env.NEXT_PUBLIC_GSC_VERIFICATION ?? ''

// TODO: Replace with the actual GA4 measurement ID (format: G-XXXXXXXXXX).
// Create a property at https://analytics.google.com/ and grab the ID from Admin → Data Streams.
const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? ''

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-nunito',
})

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tyoutorpro.io'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Tyoutor Pro — AI Lesson Planning for ESL & TEFL Teachers',
    template: '%s | Tyoutor Pro',
  },
  description: 'Generate complete, L1-aware lesson plans in 60 seconds. Built exclusively for ESL and TEFL teachers. Worksheets, error coaching, demo lessons, class profiles. Free to start.',
  keywords: 'ESL lesson planner, EFL teaching materials, TEFL resources, AI lesson generator, English teacher tools, class profiles, L1-aware lessons, Tyoutor Pro',
  applicationName: 'Tyoutor Pro',
  authors: [{ name: 'Tyoutor Pro' }],
  creator: 'Tyoutor Pro',
  publisher: 'Tyoutor Pro',
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    title: 'Tyoutor Pro — AI Lesson Planning for ESL & TEFL Teachers',
    description: 'Generate complete, L1-aware lesson plans in 60 seconds. Built exclusively for ESL and TEFL teachers.',
    type: 'website',
    url: SITE_URL,
    siteName: 'Tyoutor Pro',
    locale: 'en_US',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Tyoutor Pro — AI Lesson Planning for ESL & TEFL Teachers' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tyoutor Pro — AI Lesson Planning for ESL & TEFL Teachers',
    description: 'Generate complete, L1-aware lesson plans in 60 seconds. Built exclusively for ESL and TEFL teachers.',
    images: ['/og-default.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  verification: GSC_VERIFICATION_CODE ? { google: GSC_VERIFICATION_CODE } : undefined,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className={`antialiased ${nunito.className}`}>
        {children}

        {/* TODO: GA4 — set NEXT_PUBLIC_GA4_MEASUREMENT_ID (format: G-XXXXXXXXXX) in Vercel env to activate. */}
        {GA4_MEASUREMENT_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA4_MEASUREMENT_ID}', { anonymize_ip: true });
              `}
            </Script>
          </>
        ) : null}

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#FFFFFF',
              color: '#2D2D2D',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            },
            success: { iconTheme: { primary: '#0D9488', secondary: '#FFFFFF' } },
            error:   { iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' } },
          }}
        />
      </body>
    </html>
  )
}
