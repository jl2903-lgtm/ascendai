'use client'
import { cn } from '@/lib/utils'
import { ReactNode, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  /** Prevent closing when clicking the backdrop */
  disableBackdropClose?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  disableBackdropClose = false,
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={disableBackdropClose ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 w-full max-w-lg rounded-xl border border-[#E8E4DE] bg-white shadow-2xl shadow-black/50',
          'flex flex-col max-h-[90vh]',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4 flex-shrink-0">
          {title ? (
            <h2 id="modal-title" className="text-base font-semibold text-[#2D2D2D]">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#6B6860] transition-colors hover:bg-[#F0EEE9] hover:text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
      </div>
    </div>
  )
}
