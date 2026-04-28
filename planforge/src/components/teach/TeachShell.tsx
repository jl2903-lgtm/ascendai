'use client'

import { Suspense, ReactNode } from 'react'

// Shared shell that:
//   - wraps the runner in a Suspense boundary (required for useSearchParams)
//   - shows a polite small-screen notice on viewports < 1024px
//   - removes any page chrome above it (the runner is fullscreen)
export function TeachShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="lg:hidden fixed inset-0 z-50 bg-[#FAFAF7] flex items-center justify-center px-8 text-center">
        <div className="max-w-sm">
          <div className="text-3xl mb-3">🖥️</div>
          <h2 className="text-lg font-semibold text-slate-800">Open on a larger screen to teach</h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Teach Mode is designed for desktops with at least 1024px of width.
            Open this page on your laptop while screen-sharing to your student.
          </p>
        </div>
      </div>
      <div className="hidden lg:block">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>}>
          {children}
        </Suspense>
      </div>
    </>
  )
}
