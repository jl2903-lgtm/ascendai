'use client'
import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Zap, Check } from 'lucide-react'

const PRO_BENEFITS = [
  'Unlimited lesson plans & worksheets',
  'Unlimited Error Coach corrections',
  'Unlimited demo lesson scripts',
  'Unlimited job application letters',
  'PDF export for all outputs',
  'Priority AI generation speed',
  'Early access to new features',
]

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  toolName: string
  limit: number
}

export function UpgradeModal({ isOpen, onClose, toolName, limit }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'Failed to create checkout session.')
      }
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-600/20 ring-1 ring-teal-500/40">
          <Zap className="h-7 w-7 text-teal-400" />
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-gray-900">
            You&apos;ve reached your free limit
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            You&apos;ve used all{' '}
            <span className="font-semibold text-gray-900">
              {limit} free {toolName}
            </span>{' '}
            this month. Upgrade to Pro for unlimited access to every tool.
          </p>
        </div>

        {/* Benefits list */}
        <ul className="w-full rounded-lg border border-gray-200 bg-gray-100/80 p-4 text-left space-y-2.5">
          {PRO_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2.5 text-sm text-gray-500">
              <Check className="h-4 w-4 flex-shrink-0 text-teal-400 mt-0.5" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        {/* Pricing callout */}
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-gray-900">$19</span>
          <span className="text-sm text-gray-500">/ month</span>
        </div>

        {/* CTA */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          onClick={handleUpgrade}
        >
          <Zap className="h-4 w-4" />
          Upgrade to Pro — $19/month
        </Button>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
        >
          Maybe later
        </button>
      </div>
    </Modal>
  )
}
