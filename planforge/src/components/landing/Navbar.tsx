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
          ? 'bg-[#0F172A]/90 backdrop-blur-md border-b border-[#334155] shadow-lg shadow-black/20'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group"
          aria-label="PlanForge home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 transition-colors group-hover:bg-teal-500">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-teal-400 tracking-tight group-hover:text-teal-300 transition-colors">
            PlanForge
          </span>
        </Link>

        {/* Center nav links */}
        <ul className="hidden md:flex items-center gap-8">
          <li>
            <Link
              href="#features"
              className="text-sm font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            >
              Features
            </Link>
          </li>
          <li>
            <Link
              href="#pricing"
              className="text-sm font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            >
              Pricing
            </Link>
          </li>
        </ul>

        {/* Right CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0F172A] focus:ring-teal-500 px-3 py-1.5 text-sm text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0F172A] focus:ring-teal-500 px-3 py-1.5 text-sm bg-teal-600 hover:bg-teal-500 text-white"
          >
            Start Free
          </Link>
        </div>
      </div>
    </nav>
  )
}
