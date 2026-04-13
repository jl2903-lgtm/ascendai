'use client'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const MESSAGES = [
  'Designing your warmer activity...',
  'Crafting language focus section...',
  'Adding L1-specific tips...',
  'Preparing your exercises...',
  'Finalising lesson overview...',
]

interface ThinkingLoaderProps {
  className?: string
}

export function ThinkingLoader({ className }: ThinkingLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out, swap message, fade back in
      setVisible(false)
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % MESSAGES.length)
        setVisible(true)
      }, 300)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-6 py-12 px-6 text-center',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      {/* Pulsing dots */}
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-3 w-3 rounded-full bg-teal-500"
            style={{
              animation: `thinking-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* "Thinking..." heading */}
      <p className="text-lg font-semibold text-gray-900 tracking-wide">Thinking...</p>

      {/* Rotating message with fade transition */}
      <p
        className={cn(
          'text-sm text-gray-500 max-w-xs transition-opacity duration-300',
          visible ? 'opacity-100' : 'opacity-0'
        )}
      >
        {MESSAGES[messageIndex]}
      </p>

      <style>{`
        @keyframes thinking-pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
      `}</style>
    </div>
  )
}
