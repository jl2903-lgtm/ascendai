'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Zap } from 'lucide-react'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/93 backdrop-blur-md border-b border-gray-200 shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group" aria-label="Tyoutor Pro home">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 transition-colors group-hover:bg-teal-500">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-extrabold text-gray-900 tracking-tight group-hover:text-teal-700 transition-colors">
            Tyoutor <span className="text-teal-600">Pro</span>
          </span>
        </Link>

        {/* Center nav */}
        <ul className="hidden md:flex items-center gap-8">
          <li>
            <a href="#features" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </a>
          </li>
          <li>
            <a href="#pricing" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </a>
          </li>
        </ul>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5"
          >
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all hover:scale-105 shadow-sm"
          >
            Start Free
          </Link>
        </div>
      </div>
    </nav>
  )
}
