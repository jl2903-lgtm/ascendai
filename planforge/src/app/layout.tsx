import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'PlanForge — AI-Powered ESL Lesson Planner',
  description: 'Plan a week of ESL lessons in 20 minutes. AI-powered lesson plans, worksheets, and teaching materials built for TEFL teachers worldwide.',
  keywords: 'ESL lesson planner, EFL teaching materials, TEFL resources, AI lesson generator, English teacher tools',
  openGraph: {
    title: 'PlanForge — AI-Powered ESL Lesson Planner',
    description: 'Plan a week of ESL lessons in 20 minutes. AI-powered lesson plans, worksheets, and teaching materials built for TEFL teachers worldwide.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_APP_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PlanForge — AI-Powered ESL Lesson Planner',
    description: 'Plan a week of ESL lessons in 20 minutes.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1E293B',
              color: '#F8FAFC',
              border: '1px solid #334155',
              borderRadius: '8px',
            },
            success: { iconTheme: { primary: '#0D9488', secondary: '#F8FAFC' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#F8FAFC' } },
          }}
        />
      </body>
    </html>
  )
}
