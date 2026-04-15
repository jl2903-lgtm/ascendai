import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tyoutor Pro — AI-Powered ESL Lesson Planner',
  description: 'Set up your class once. Get perfectly tailored ESL lessons every time. AI-powered lesson plans, worksheets, and teaching materials built for TEFL teachers worldwide.',
  keywords: 'ESL lesson planner, EFL teaching materials, TEFL resources, AI lesson generator, English teacher tools, class profiles, Tyoutor Pro',
  openGraph: {
    title: 'Tyoutor Pro — AI-Powered ESL Lesson Planner',
    description: 'Set up your class once. Get perfectly tailored ESL lessons every time.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_APP_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tyoutor Pro — AI-Powered ESL Lesson Planner',
    description: 'Set up your class once. Get perfectly tailored ESL lessons every time.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
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
