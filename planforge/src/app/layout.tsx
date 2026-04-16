import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-nunito',
})

export const metadata: Metadata = {
  title: 'Tyoutor Pro — AI-Powered ESL Lesson Planning',
  description: 'Tyoutor Pro — AI-powered lesson planning built exclusively for ESL & TEFL teachers. Generate tailored lesson plans, worksheets, and teaching materials in seconds.',
  keywords: 'ESL lesson planner, EFL teaching materials, TEFL resources, AI lesson generator, English teacher tools, class profiles, Tyoutor Pro',
  openGraph: {
    title: 'Tyoutor Pro — AI-Powered ESL Lesson Planning',
    description: 'Tyoutor Pro — AI-powered lesson planning built exclusively for ESL & TEFL teachers. Generate tailored lesson plans, worksheets, and teaching materials in seconds.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_APP_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tyoutor Pro — AI-Powered ESL Lesson Planning',
    description: 'Tyoutor Pro — AI-powered lesson planning built exclusively for ESL & TEFL teachers. Generate tailored lesson plans, worksheets, and teaching materials in seconds.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className={`antialiased ${nunito.className}`}>
        {children}
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
