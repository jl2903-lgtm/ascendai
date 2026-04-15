import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  href?: string
  showSubtitle?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Logo({ href = '/', showSubtitle = false, size = 'md', className }: LogoProps) {
  const iconClass =
    size === 'lg' ? 'w-11 h-11 text-2xl rounded-xl' :
    size === 'sm' ? 'w-8 h-8 text-lg rounded-xl' :
    'w-9 h-9 text-xl rounded-xl'

  const textClass =
    size === 'lg' ? 'text-2xl' :
    size === 'sm' ? 'text-base' :
    'text-lg'

  const inner = (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn('flex items-center justify-center flex-shrink-0 font-black text-white', iconClass)}
        style={{
          background: 'linear-gradient(135deg, #2D6A4F, #52B788)',
          boxShadow: '0 4px 12px rgba(45,106,79,0.25)',
        }}
      >
        T
      </div>
      <div>
        <p className={cn('font-black tracking-tight leading-none', textClass)}>
          <span style={{ color: '#2D2D2D' }}>Tyoutor</span>{' '}
          <span style={{ color: '#E07A5F' }}>Pro</span>
        </p>
        {showSubtitle && (
          <p
            className="mt-0.5"
            style={{ fontSize: 9, letterSpacing: '1.5px', color: '#999', textTransform: 'uppercase', fontWeight: 700 }}
          >
            ESL Teaching Suite
          </p>
        )}
      </div>
    </div>
  )

  return href ? <Link href={href}>{inner}</Link> : inner
}
