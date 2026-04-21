'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { PartyPopper, Sparkles, Share2, Library, X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function FirstLessonCelebration({ isOpen, onClose }: Props) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-gradient-to-br from-teal-50 via-emerald-50 to-white px-8 py-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-600 shadow-lg shadow-teal-600/30 animate-[bounce_1s_ease-in-out_1]">
            <PartyPopper className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
            Your first lesson! 🎉
          </h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            That&apos;s a full, communicative lesson plan ready to teach. Most teachers save 20+ minutes per lesson with Tyoutor Pro.
          </p>
        </div>

        <div className="px-8 py-6">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center">
            What&apos;s next?
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/dashboard/magic-paste"
              onClick={onClose}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center transition-all hover:border-teal-400 hover:bg-teal-50/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100">
                <Sparkles className="h-5 w-5 text-pink-600" />
              </div>
              <div className="text-sm font-semibold text-gray-900">Magic Paste</div>
              <div className="text-xs text-gray-500">Turn any article into a lesson</div>
            </Link>

            <Link
              href="/dashboard/saved"
              onClick={onClose}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center transition-all hover:border-teal-400 hover:bg-teal-50/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
                <Share2 className="h-5 w-5 text-teal-600" />
              </div>
              <div className="text-sm font-semibold text-gray-900">Share it</div>
              <div className="text-xs text-gray-500">Save & share this lesson</div>
            </Link>

            <Link
              href="/dashboard/shared-resources"
              onClick={onClose}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center transition-all hover:border-teal-400 hover:bg-teal-50/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Library className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-sm font-semibold text-gray-900">Browse Library</div>
              <div className="text-xs text-gray-500">Free community resources</div>
            </Link>
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            Keep working on this lesson →
          </button>
        </div>
      </div>
    </div>
  )
}
