'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'
import { STUDENT_LEVELS, NATIONALITIES, AGE_GROUPS } from '@/lib/utils'
import { Settings, User, CreditCard, Trash2, ChevronDown, CheckCircle, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '' })
  const [prefs, setPrefs] = useState({ default_level: 'B1', default_nationality: 'Chinese (Mandarin)', default_age_group: 'Adults' })
  const [passwordForm, setPasswordForm] = useState({ current: '', newPassword: '', confirm: '' })
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: p } = await supabase.from('users').select('*').eq('id', session.user.id).single()
      if (p) {
        setProfile(p)
        setForm({ full_name: p.full_name || '', email: p.email || '' })
        setPrefs({
          default_level: p.default_level || 'B1',
          default_nationality: p.default_nationality || 'Chinese (Mandarin)',
          default_age_group: p.default_age_group || 'Adults',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  const saveProfile = async () => {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      await supabase.from('users').update({ full_name: form.full_name, ...prefs }).eq('id', session.user.id)
      if (form.email !== profile?.email) {
        await supabase.auth.updateUser({ email: form.email })
        toast.success('Profile updated. Check your email to confirm the address change.')
      } else {
        toast.success('Profile updated!')
      }
      setProfile(p => p ? { ...p, ...form, ...prefs } : p)
    } catch {
      toast.error('Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (!passwordForm.newPassword) { toast.error('Enter a new password.'); return }
    if (passwordForm.newPassword.length < 8) { toast.error('Password must be at least 8 characters.'); return }
    if (passwordForm.newPassword !== passwordForm.confirm) { toast.error("Passwords don't match."); return }
    setSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword })
      if (error) { toast.error(error.message); return }
      toast.success('Password updated!')
      setPasswordForm({ current: '', newPassword: '', confirm: '' })
    } catch {
      toast.error('Failed to update password.')
    } finally {
      setSavingPassword(false)
    }
  }

  const openBillingPortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/create-portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast.error('Failed to open billing portal.')
    } catch {
      toast.error('Failed to open billing portal.')
    } finally {
      setPortalLoading(false)
    }
  }

  const deleteAccount = async () => {
    toast.error('Please contact support to delete your account.')
    setDeleteConfirm(false)
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
    </div>
  )

  const isPro = profile?.subscription_status === 'pro'

  return (
    <div className="relative isolate max-w-2xl mx-auto space-y-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dot-pattern" style={{ zIndex: -1 }} />
      <div aria-hidden style={{ position:'absolute',width:300,height:300,top:-60,right:-60,borderRadius:'50%',filter:'blur(80px)',background:'radial-gradient(ellipse,#D4E8D0,#A7C4A0)',opacity:0.15,pointerEvents:'none',zIndex:-1,animation:'blobFloat 8s ease-in-out 0s infinite alternate' }} />
      <div aria-hidden style={{ position:'absolute',width:250,height:250,bottom:40,left:-40,borderRadius:'50%',filter:'blur(80px)',background:'radial-gradient(ellipse,#FFE5D9,#FECDA6)',opacity:0.13,pointerEvents:'none',zIndex:-1,animation:'blobFloat 8s ease-in-out 3s infinite alternate' }} />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-gray-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage your account and preferences</p>
        </div>
      </div>

      {/* Profile */}
      <Section icon={User} title="Profile">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Full Name</label>
            <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
          </div>
          <button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
            <CheckCircle className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Section>

      {/* Default Preferences */}
      <Section icon={Settings} title="Default Preferences">
        <p className="text-sm text-gray-500 mb-4">These will pre-fill your lesson generator form.</p>
        <div className="space-y-4">
          {[
            { label: 'Default Level', key: 'default_level', options: STUDENT_LEVELS },
            { label: 'Default Student Nationality', key: 'default_nationality', options: NATIONALITIES },
            { label: 'Default Age Group', key: 'default_age_group', options: AGE_GROUPS },
          ].map(({ label, key, options }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-500 mb-2">{label}</label>
              <div className="relative">
                <select
                  value={prefs[key as keyof typeof prefs]}
                  onChange={e => setPrefs(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 pr-9"
                >
                  {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          ))}
          <button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
            <CheckCircle className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </Section>

      {/* Password */}
      <Section icon={Settings} title="Change Password">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">New Password</label>
            <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="Min. 8 characters" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder-gray-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Confirm New Password</label>
            <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat new password" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder-gray-400" />
          </div>
          <button onClick={changePassword} disabled={savingPassword} className="flex items-center gap-2 bg-gray-100 hover:bg-[#475569] disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
            {savingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </Section>

      {/* Subscription */}
      <Section icon={CreditCard} title="Subscription">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${isPro ? 'bg-teal-600/20 text-teal-400 border border-teal-600/30' : 'bg-gray-100 text-gray-500'}`}>
                {isPro ? 'Pro' : 'Free'} Plan
              </span>
              {isPro && <span className="text-xs text-gray-500">Unlimited access to all tools</span>}
            </div>
            {!isPro && (
              <p className="text-xs text-gray-500 mt-1">5 lessons, 5 worksheets per month</p>
            )}
          </div>
          {isPro ? (
            <button onClick={openBillingPortal} disabled={portalLoading} className="flex items-center gap-2 border border-gray-200 hover:border-teal-500 text-gray-500 hover:text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50">
              <ExternalLink className="w-4 h-4" />
              {portalLoading ? 'Opening...' : 'Manage Billing'}
            </button>
          ) : (
            <a href="/pricing" className="bg-teal-600 hover:bg-teal-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Upgrade to Pro — $19/mo
            </a>
          )}
        </div>
        {isPro && (
          <p className="text-xs text-gray-400">Manage your subscription, update payment methods, or cancel in the billing portal.</p>
        )}
      </Section>

      {/* Danger zone */}
      <Section icon={Trash2} title="Danger Zone" danger>
        <p className="text-sm text-gray-500 mb-4">
          Deleting your account is permanent and cannot be undone. All your lessons and worksheets will be lost.
        </p>
        {deleteConfirm ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3">
            <p className="text-sm text-red-300 font-medium">Are you absolutely sure? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={deleteAccount} className="bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                Yes, delete my account
              </button>
              <button onClick={() => setDeleteConfirm(false)} className="border border-gray-200 text-gray-500 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setDeleteConfirm(true)} className="flex items-center gap-2 border border-red-500/40 hover:border-red-500 text-red-400 hover:text-red-300 font-medium px-4 py-2.5 rounded-xl text-sm transition-all">
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        )}
      </Section>
    </div>
  )
}

function Section({ icon: Icon, title, children, danger }: { icon: React.FC<{ className?: string }>; title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className={`bg-white border rounded-2xl p-6 ${danger ? 'border-red-500/20' : 'border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-200">
        <Icon className={`w-4 h-4 ${danger ? 'text-red-400' : 'text-gray-500'}`} />
        <h2 className={`font-semibold text-sm ${danger ? 'text-red-400' : 'text-gray-900'}`}>{title}</h2>
      </div>
      {children}
    </div>
  )
}
