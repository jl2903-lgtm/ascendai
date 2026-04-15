'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PricingUpgradeButtonProps {
  trial?: boolean
  className?: string
  children: React.ReactNode
}

export function PricingUpgradeButton({
  trial = false,
  className,
  children,
}: PricingUpgradeButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trial }),
      })

      if (res.status === 401) {
        // Not logged in — send to signup then back to pricing
        router.push('/auth/signup?redirect=/pricing')
        return
      }

      if (res.status === 400) {
        // Already pro — send to dashboard
        router.push('/dashboard')
        return
      }

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
    } catch {
      // fall through to sign-up redirect on unexpected failure
    }

    router.push('/auth/signup')
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? 'Redirecting...' : children}
    </button>
  )
}
