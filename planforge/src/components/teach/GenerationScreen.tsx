'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'

// Status values the polling endpoint can return.
type Status = 'not_started' | 'generating' | 'ready' | 'failed'

interface Props {
  lessonId: string
  initialStatus: Status
  initialError?: string | null
  // Where to land when generation completes — keeps any ?mode=rehearsal etc.
  // intact via the parent route.
  teachHref: string
  exitHref: string
}

const PROGRESS_MESSAGES = [
  'Building reading passages…',
  'Designing comprehension questions…',
  'Drafting discussion prompts…',
  'Writing tutor notes for you…',
  'Preparing vocabulary cards…',
  'Adding common-error coaching…',
  'Almost there — finalizing the activity flow…',
]

const POLL_INTERVAL_MS = 2000

const FRIENDLY_ERROR =
  "We couldn't build the activities. Please try again — if this keeps happening, contact support."

// activities_error in the DB is stored as "[req_xxx] internal message". The UI
// only ever shows a friendly fixed message + the request id; the internal
// message stays in Vercel logs for support to grep.
function parseRequestId(raw: string | null | undefined): string | null {
  if (!raw) return null
  const m = raw.match(/^\[(req_[a-zA-Z0-9-]+)\]/)
  return m ? m[1] : null
}

export function GenerationScreen({ lessonId, initialStatus, initialError, teachHref, exitHref }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>(initialStatus)
  const [requestId, setRequestId] = useState<string | null>(parseRequestId(initialError))
  const [messageIndex, setMessageIndex] = useState(0)
  // Refs guard against React StrictMode's double-mount running the trigger
  // twice and queuing duplicate generation calls.
  const triggeredRef = useRef(false)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const t = setInterval(() => setMessageIndex(i => (i + 1) % PROGRESS_MESSAGES.length), 4000)
    return () => clearInterval(t)
  }, [])

  // On mount: if status is not_started or failed, kick off generation. The
  // server marks status='generating' atomically so refresh-during-wait resumes
  // correctly. If already generating, just poll. If ready, navigate.
  useEffect(() => {
    if (status === 'ready') {
      router.replace(`${teachHref}?step=1`)
      return
    }
    if (triggeredRef.current) return
    triggeredRef.current = true

    const trigger = async () => {
      if (status !== 'not_started' && status !== 'failed') return
      try {
        const res = await fetch(`/api/lessons/${lessonId}/generate-activities`, { method: 'POST' })
        const data = await res.json().catch(() => ({}))
        if (data?.requestId) setRequestId(data.requestId)
        if (!res.ok) {
          setStatus('failed')
          return
        }
        if (data?.status === 'ready') { setStatus('ready'); return }
        if (data?.status === 'failed') { setStatus('failed'); return }
        setStatus('generating')
      } catch {
        setStatus('failed')
      }
    }
    trigger()
  }, [lessonId, status, router, teachHref])

  // Poll while generating. Stop on terminal states.
  useEffect(() => {
    if (status !== 'generating') return
    const tick = async () => {
      try {
        const res = await fetch(`/api/lessons/${lessonId}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (data.activities_status === 'ready') {
          setStatus('ready')
        } else if (data.activities_status === 'failed') {
          const rid = parseRequestId(data.activities_error)
          if (rid) setRequestId(rid)
          setStatus('failed')
        }
      } catch {
        // Transient network errors — keep polling.
      }
    }
    pollTimerRef.current = setInterval(tick, POLL_INTERVAL_MS)
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [status, lessonId])

  // When status hits 'ready', drop into the runner at step 1.
  useEffect(() => {
    if (status === 'ready') router.replace(`${teachHref}?step=1`)
  }, [status, router, teachHref])

  // "Try again" re-triggers generation in place rather than reloading the page
  // — keeps any ?mode=rehearsal in the URL and avoids a flash of the lesson
  // view in between.
  const handleRetry = () => {
    setRequestId(null)
    setStatus('not_started')
    triggeredRef.current = false
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-rose-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">We couldn&apos;t build the activities</h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{FRIENDLY_ERROR}</p>
          {requestId && (
            <p className="mt-3 text-xs text-slate-400 font-mono">Error reference: {requestId}</p>
          )}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-4 py-2"
            >
              Try again
            </button>
            <Link href={exitHref} className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4" /> Back to lesson
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        <div className="mx-auto w-14 h-14 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" aria-label="Loading" />
        <h2 className="mt-6 text-2xl font-semibold text-slate-900">Building your interactive lesson…</h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          This takes about 60–90 seconds. We&apos;re turning your lesson plan into interactive activities you can teach from.
        </p>
        <div className="mt-6 text-sm text-teal-700 font-medium" aria-live="polite">
          {PROGRESS_MESSAGES[messageIndex]}
        </div>
        <div className="mt-10">
          <Link href={exitHref} className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-3.5 h-3.5" /> Cancel and go back
          </Link>
        </div>
      </div>
    </div>
  )
}
