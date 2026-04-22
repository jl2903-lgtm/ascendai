'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export default function SignupPage() {
  const supabase = createClient()
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required'
    if (!formData.email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email'
    if (!formData.password) errs.password = 'Password is required'
    else if (formData.password.length < 8) errs.password = 'Password must be at least 8 characters'
    return errs
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        setErrors({ general: error.message })
      } else {
        await fetch('/api/send-welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, name: formData.fullName }),
        }).catch(() => {})
        setSuccess(true)
      }
    } catch {
      setErrors({ general: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#2D2D2D] mb-3">Check your email</h1>
          <p className="text-[#6B6860] mb-6 font-medium">
            We sent a confirmation link to <strong className="text-[#2D2D2D]">{formData.email}</strong>.
            Click it to activate your account and start planning lessons.
          </p>
          <Link href="/auth/login" className="text-teal-600 hover:text-teal-500 font-bold text-sm transition-colors">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative isolate min-h-screen bg-[#FAFAF8] flex items-center justify-center px-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dot-pattern" style={{ zIndex: -1 }} />
      <div className="blob-peach w-80 h-80 top-10 right-0 opacity-60" style={{ position: 'fixed', zIndex: -1 }} />
      <div className="blob-mint w-72 h-72 bottom-10 -left-10 opacity-50" style={{ position: 'fixed', zIndex: -1 }} />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Create your account</h1>
          <p className="text-[#6B6860] mt-2 font-medium">5 free lessons every month. No credit card needed.</p>
        </div>

        <div className="bg-white border border-[#E8E4DE] rounded-2xl p-8 shadow-soft">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm mb-6 font-medium">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[#4A473E] mb-2">Full name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                placeholder="Jane Smith"
                className={`w-full bg-[#F7F6F2] border rounded-xl px-4 py-3 text-[#2D2D2D] placeholder-[#8C8880] focus:outline-none focus:ring-1 transition-colors font-medium ${errors.fullName ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-[#E8E4DE] focus:border-teal-500 focus:ring-teal-500'}`}
              />
              {errors.fullName && <p className="text-red-600 text-xs mt-1 font-medium">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-[#4A473E] mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                placeholder="you@example.com"
                className={`w-full bg-[#F7F6F2] border rounded-xl px-4 py-3 text-[#2D2D2D] placeholder-[#8C8880] focus:outline-none focus:ring-1 transition-colors font-medium ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-[#E8E4DE] focus:border-teal-500 focus:ring-teal-500'}`}
              />
              {errors.email && <p className="text-red-600 text-xs mt-1 font-medium">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-[#4A473E] mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                  placeholder="Min. 8 characters"
                  className={`w-full bg-[#F7F6F2] border rounded-xl px-4 py-3 pr-12 text-[#2D2D2D] placeholder-[#8C8880] focus:outline-none focus:ring-1 transition-colors font-medium ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-[#E8E4DE] focus:border-teal-500 focus:ring-teal-500'}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C8880] hover:text-[#6B6860] transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-xs mt-1 font-medium">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </>
              ) : 'Create free account'}
            </button>
          </form>

          <p className="text-xs text-[#8C8880] text-center mt-4 font-medium">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <p className="text-center text-[#6B6860] text-sm mt-6 font-medium">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-teal-600 hover:text-teal-500 font-bold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
