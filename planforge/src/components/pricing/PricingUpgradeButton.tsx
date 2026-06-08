'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PricingUpgradeButtonProps {
  className?: string
  children: React.ReactNode
}

export function PricingUpgradeButton({
  className,
  children,
}: PricingUpgradeButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/upgrade', {
        method: 'POST',
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
