import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

type BadgeVariant = 'free' | 'pro' | 'success' | 'warning' | 'error'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  free: 'bg-gray-100 text-gray-500 border border-gray-300',
  pro: 'bg-gradient-to-r from-teal-600 to-teal-400 text-white border-0 shadow-sm shadow-teal-900/40',
  success: 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/50',
  warning: 'bg-amber-900/40 text-amber-400 border border-amber-700/50',
  error: 'bg-red-900/40 text-red-400 border border-red-700/50',
}

const variantLabels: Record<BadgeVariant, string> = {
  free: 'Free',
  pro: 'Pro',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
}

export function Badge({ variant = 'free', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children ?? variantLabels[variant]}
    </span>
  )
}
