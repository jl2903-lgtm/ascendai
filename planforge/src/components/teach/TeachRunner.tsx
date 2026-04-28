'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, X, ListOrdered, Play } from 'lucide-react'
import type { Activity } from '@/lib/activities/schema'
import { ActivityRenderer, activityLabel, activityTypeName } from './ActivityRenderer'
import { TutorPanel } from './TutorPanel'

interface Props {
  title: string
  activities: Activity[]
  exitHref: string
  // When true, the runner starts in rehearsal mode: tutor panel open, all
  // hidden tutor content revealed via the rehearsalReveal flag, and an amber
  // banner makes it impossible to confuse with live teach mode.
  rehearsal?: boolean
  // Where to switch when the user clicks "Switch to live teach mode" — should
  // preserve ?step but drop ?mode=rehearsal.
  liveHref?: string
}

// Top-level fullscreen runner. Owns navigation state (current step, panel
// open/close, jump menu, keyboard shortcuts). Each child activity owns its
// own input state and is reset on step change via the renderer's `key` prop.
export function TeachRunner({ title, activities, exitHref, rehearsal = false, liveHref }: Props) {
  const router = useRouter()
  const search = useSearchParams()

  const total = activities.length
  const initialStep = useMemo(() => {
    const raw = parseInt(search.get('step') ?? '1', 10)
    if (Number.isNaN(raw)) return 0
    return Math.max(0, Math.min(total - 1, raw - 1))
  }, [search, total])

  const [step, setStep] = useState(initialStep)
  // Rehearsal mode opens the panel by default; live mode keeps it closed.
  const [panelOpen, setPanelOpen] = useState(rehearsal)
  const [jumpOpen, setJumpOpen] = useState(false)
  const [flashTick, setFlashTick] = useState(0)

  // Sync step → URL query so refresh preserves progress. Preserve other params
  // (like mode=rehearsal) by mutating the URL in place.
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('step', String(step + 1))
    window.history.replaceState({}, '', url.toString())
  }, [step])

  // Switching from rehearsal → live preserves the current step.
  const switchToLive = useCallback(() => {
    if (!liveHref) return
    const url = new URL(liveHref, window.location.origin)
    url.searchParams.set('step', String(step + 1))
    router.push(url.pathname + url.search)
  }, [liveHref, step, router])

  const goNext = useCallback(() => {
    if (step >= total - 1) {
      router.push(exitHref)
      return
    }
    setStep(s => Math.min(total - 1, s + 1))
  }, [step, total, router, exitHref])

  const goPrev = useCallback(() => setStep(s => Math.max(0, s - 1)), [])
  const exit = useCallback(() => router.push(exitHref), [router, exitHref])

  // Keyboard: → / space → next, ← → previous, Esc → exit, T → tutor panel,
  // A → flash the answer (multi-choice / gap-fill listen for flashTick).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      const inField = tag === 'INPUT' || tag === 'TEXTAREA' || (target?.isContentEditable ?? false)
      if (inField) return
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); return }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); return }
      if (e.key === 'Escape') { e.preventDefault(); exit(); return }
      if (e.key === 't' || e.key === 'T') { e.preventDefault(); setPanelOpen(o => !o); return }
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        setFlashTick(t => t + 1)
        // Auto-dismiss after 2.5s by bumping again to an even number.
        setTimeout(() => setFlashTick(t => t + 1), 2500)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, exit])

  // Reset selection state on activity change is handled by the renderer key.
  // Reset flash counter on step change so the indicator doesn't carry over.
  useEffect(() => { setFlashTick(0) }, [step])

  const activity = activities[step]
  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        No activities to teach.
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF7] text-slate-900">
      {rehearsal && (
        <div className="bg-amber-100 border-b border-amber-300 px-6 py-2 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm font-semibold text-amber-900">
            REHEARSAL MODE — all tutor content visible. Do not screen-share.
          </div>
          {liveHref && (
            <button
              type="button"
              onClick={switchToLive}
              className="inline-flex items-center gap-1.5 text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg"
            >
              <Play className="w-4 h-4" /> Switch to live teach mode
            </button>
          )}
        </div>
      )}
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Teach Mode</div>
          <h1 className="text-sm font-semibold text-slate-800 truncate">{title}</h1>
        </div>
        <button
          type="button"
          onClick={() => setJumpOpen(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
        >
          <ListOrdered className="w-4 h-4" />
          {step + 1} / {total}
        </button>
        <div className="flex-1 flex justify-end">
          <button
            type="button"
            onClick={exit}
            aria-label="Exit teach mode"
            title="Exit (Esc)"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-md hover:bg-slate-100"
          >
            <X className="w-4 h-4" /> Exit
          </button>
        </div>
      </header>

      {/* Main canvas */}
      <main className={`flex-1 overflow-y-auto ${panelOpen ? 'pr-[360px]' : ''}`}>
        <div className="max-w-[720px] mx-auto px-6 py-10 md:py-14">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-teal-700 mb-4">
            {activityTypeName(activity.type)}
          </div>
          <ActivityRenderer activity={activity} flashAnswer={flashTick} rehearsal={rehearsal} />
        </div>
      </main>

      {/* Bottom bar */}
      <footer className={`border-t border-slate-200 bg-white px-6 py-3 ${panelOpen ? 'pr-[376px]' : ''}`}>
        <div className="max-w-[720px] mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={goPrev}
            disabled={step === 0}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 disabled:opacity-40 rounded-lg px-3 py-2 bg-white"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <div className="hidden sm:flex items-center gap-3 text-[10px] uppercase tracking-wider text-slate-400">
            <kbd className="px-1.5 py-0.5 border border-slate-200 rounded">←</kbd>
            <kbd className="px-1.5 py-0.5 border border-slate-200 rounded">→ / space</kbd>
            <kbd className="px-1.5 py-0.5 border border-slate-200 rounded">T</kbd>
            <span>tutor panel</span>
            <kbd className="px-1.5 py-0.5 border border-slate-200 rounded">A</kbd>
            <span>answer</span>
          </div>
          <button
            type="button"
            onClick={goNext}
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg px-4 py-2"
          >
            {step === total - 1 ? 'Finish' : 'Continue'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      <TutorPanel activity={activity} open={panelOpen} onToggle={() => setPanelOpen(o => !o)} />

      {jumpOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-start justify-center pt-20 px-6" onClick={() => setJumpOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full max-h-[60vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Jump to activity</h2>
              <button onClick={() => setJumpOpen(false)} className="p-1 text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
            </div>
            <ul>
              {activities.map((a, i) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => { setStep(i); setJumpOpen(false) }}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-left text-sm border-b border-slate-100 hover:bg-slate-50 ${i === step ? 'bg-teal-50 text-teal-900' : 'text-slate-700'}`}
                  >
                    <span className="w-6 text-xs text-slate-400 text-right">{i + 1}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 w-20">{activityTypeName(a.type)}</span>
                    <span className="flex-1 truncate">{activityLabel(a)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
