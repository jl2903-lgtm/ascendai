'use client'

import { useState, useEffect } from 'react'
import { X, Flag } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  resourceId: string
  resourceTitle: string
  onClose: () => void
}

export function ReportResourceModal({ resourceId, resourceTitle, onClose }: Props) {
  const [reason, setReason]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]           = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !submitting) onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, submitting])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/shared-resources/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource_id: resourceId, reason: reason.trim() || null }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error)
      }
      setDone(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not submit report.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={!submitting ? onClose : undefined}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center">
                <Flag className="w-4 h-4 text-red-500" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Report resource</h2>
            </div>
            {!submitting && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>

          {done ? (
            /* ── Success state ── */
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Report submitted</p>
              <p className="text-xs text-gray-400 mb-5">Our team will review this resource shortly.</p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Resource title preview */}
              <p className="text-xs text-gray-500 mb-4 bg-gray-50 rounded-xl px-3 py-2 line-clamp-2">
                &ldquo;{resourceTitle}&rdquo;
              </p>

              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Reason <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Describe the issue — e.g. inappropriate content, copyright violation, incorrect information..."
                rows={4}
                maxLength={500}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none"
              />
              <p className="text-[11px] text-gray-400 text-right mt-1">{reason.length}/500</p>

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #DC2626, #F87171)',
                    boxShadow: submitting ? 'none' : '0 4px 12px rgba(220,38,38,0.25)',
                  }}
                >
                  {submitting ? 'Submitting…' : 'Submit report'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
