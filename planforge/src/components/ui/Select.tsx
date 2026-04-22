'use client'
import { cn } from '@/lib/utils'
import { forwardRef, SelectHTMLAttributes } from 'react'

interface SelectOption {
  value: string | number
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-[#2D2D2D]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full appearance-none rounded-lg border bg-white px-3.5 py-2.5 pr-10 text-sm text-[#2D2D2D]',
              'transition-colors duration-200 cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 focus:ring-offset-[#0F172A]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-[#E8E4DE] hover:border-[#C4C0BA] focus:border-teal-500',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-white text-[#2D2D2D]"
              >
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom chevron */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-4 w-4 text-[#8C8880]"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <svg
              className="h-3.5 w-3.5 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-[#6B6860]">{hint}</p>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'
export { Select }
export type { SelectOption }
