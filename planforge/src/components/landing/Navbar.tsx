'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className="sticky top-0 inset-x-0 z-50 transition-shadow duration-300"
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(237,235,232,0.6)',
        boxShadow: scrolled ? '0 1px 12px rgba(0,0,0,0.04)' : 'none',
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />

        <ul className="hidden md:flex items-center gap-8">
          {[
            { label: 'Features',     href: '/#features' },
            { label: 'How It Works', href: '/#how-it-works' },
            { label: 'Pricing',      href: '/#pricing' },
            { label: 'Blog',         href: '/blog' },
          ].map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-[13px] font-semibold text-[#6B6860] hover:text-[#2D2D2D] transition-colors"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-[13px] font-semibold text-[#6B6860] hover:text-[#2D2D2D] transition-colors px-3 py-1.5"
          >
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="btn-primary inline-flex items-center text-[13px] px-5 py-2.5"
          >
            Start Free →
          </Link>
        </div>
      </div>
    </nav>
  )
}
