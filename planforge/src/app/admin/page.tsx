'use client'

import { useEffect, useState } from 'react'
import { Users, BookOpen, FileText, DollarSign, TrendingUp, Lock } from 'lucide-react'

interface AdminStats {
  totalUsers: number
  totalLessons: number
  totalWorksheets: number
  proUsers: number
  freeUsers: number
  mrr: number
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin', {
        headers: { Authorization: `Bearer ${password}` },
      })
      if (!res.ok) { setError('Incorrect password'); setLoading(false); return }
      const data = await res.json()
      setStats(data)
      setAuthenticated(true)
    } catch {
      setError('Failed to connect')
    } finally {
      setLoading(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-gray-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Admin Access</h1>
          </div>
          <form onSubmit={login} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
              {loading ? 'Verifying...' : 'Access Admin'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">PlanForge Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Overview dashboard</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'teal', sub: `${stats.freeUsers} free · ${stats.proUsers} pro` },
              { label: 'Total Lessons Generated', value: stats.totalLessons.toLocaleString(), icon: BookOpen, color: 'blue', sub: 'All time' },
              { label: 'Total Worksheets', value: stats.totalWorksheets.toLocaleString(), icon: FileText, color: 'purple', sub: 'All time' },
              { label: 'Pro Subscribers', value: stats.proUsers.toLocaleString(), icon: TrendingUp, color: 'amber', sub: `${((stats.proUsers / Math.max(stats.totalUsers, 1)) * 100).toFixed(1)}% conversion rate` },
              { label: 'Monthly Recurring Revenue', value: `$${stats.mrr.toLocaleString()}`, icon: DollarSign, color: 'green', sub: `${stats.proUsers} × $12` },
              { label: 'Free Users', value: stats.freeUsers.toLocaleString(), icon: Users, color: 'slate', sub: 'Potential upgrades' },
            ].map(stat => {
              const colorMap: Record<string, string> = {
                teal: 'text-teal-400 bg-teal-500/10',
                blue: 'text-blue-400 bg-blue-500/10',
                purple: 'text-purple-400 bg-purple-500/10',
                amber: 'text-amber-400 bg-amber-500/10',
                green: 'text-green-400 bg-green-500/10',
                slate: 'text-slate-400 bg-slate-500/10',
              }
              return (
                <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colorMap[stat.color]}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm font-medium text-gray-500">{stat.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{stat.sub}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
