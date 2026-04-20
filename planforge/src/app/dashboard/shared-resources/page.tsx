'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { Globe, Search, Download, Calendar, User, BookOpen, Filter, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

interface SharedResource {
  id: string
  title: string
  description: string | null
  subject: string | null
  level: string | null
  file_url: string
  file_name: string
  uploaded_by_name: string | null
  created_at: string
}

const SUBJECT_OPTIONS = ['All', 'Grammar', 'Vocabulary', 'Speaking', 'Listening', 'Reading', 'Writing', 'Business English', 'Exam Prep', 'Other']
const LEVEL_OPTIONS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Mixed']

export default function SharedResourcesPage() {
  const [resources, setResources] = useState<SharedResource[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('All')
  const [levelFilter, setLevelFilter] = useState('All')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchResources = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('shared_resources')
        .select('id, title, description, subject, level, file_url, file_name, uploaded_by_name, created_at')
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (subjectFilter !== 'All') query = query.eq('subject', subjectFilter)
      if (levelFilter !== 'All') query = query.eq('level', levelFilter)

      const { data, error } = await query
      if (error) throw error
      setResources(data ?? [])
    } catch {
      toast.error('Failed to load shared resources.')
    } finally {
      setLoading(false)
    }
  }, [subjectFilter, levelFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchResources()
  }, [fetchResources])

  const handleDownload = async (resource: SharedResource) => {
    try {
      const { data, error } = await supabase.storage
        .from('lesson-uploads')
        .createSignedUrl(resource.file_url.replace(/^.*lesson-uploads\//, ''), 60)
      if (error || !data?.signedUrl) throw error
      const a = document.createElement('a')
      a.href = data.signedUrl
      a.download = resource.file_name
      a.click()
    } catch {
      toast.error('Could not generate download link.')
    }
  }

  const filtered = resources.filter(r => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      r.title.toLowerCase().includes(q) ||
      (r.description ?? '').toLowerCase().includes(q) ||
      (r.subject ?? '').toLowerCase().includes(q) ||
      (r.uploaded_by_name ?? '').toLowerCase().includes(q)
    )
  })

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="relative isolate max-w-6xl mx-auto space-y-6">
      {/* Background decorations */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dot-pattern" style={{ zIndex: -1 }} />
      <div aria-hidden style={{ position:'absolute',width:350,height:350,top:-80,right:-80,borderRadius:'50%',filter:'blur(80px)',background:'radial-gradient(ellipse,#D4E8FF,#B3D4FF)',opacity:0.14,pointerEvents:'none',zIndex:-1,animation:'blobFloat 8s ease-in-out 0s infinite alternate' }} />
      <div aria-hidden style={{ position:'absolute',width:280,height:280,bottom:60,left:-60,borderRadius:'50%',filter:'blur(80px)',background:'radial-gradient(ellipse,#D4E8D0,#A7C4A0)',opacity:0.13,pointerEvents:'none',zIndex:-1,animation:'blobFloat 8s ease-in-out 3s infinite alternate' }} />
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-sky-600/15 border border-sky-600/30 rounded-xl flex items-center justify-center">
          <Globe className="w-5 h-5 text-sky-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Shared Resources</h1>
          <p className="text-sm text-gray-500">Community-uploaded lesson materials from Tyoutor Pro teachers</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, subject, or teacher name..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-7 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-teal-500"
            >
              {SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Subjects' : s}</option>)}
            </select>
          </div>

          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-7 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-teal-500"
            >
              {LEVEL_OPTIONS.map(l => <option key={l} value={l}>{l === 'All' ? 'All Levels' : l}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-gray-400 -mt-2">
          {filtered.length === 0
            ? 'No resources found'
            : `${filtered.length} resource${filtered.length !== 1 ? 's' : ''} found`}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse space-y-3">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="flex gap-2 mt-2">
                <div className="h-5 bg-gray-100 rounded w-16" />
                <div className="h-5 bg-gray-100 rounded w-10" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl min-h-[360px] flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 bg-sky-600/10 rounded-2xl flex items-center justify-center mb-4">
            <Globe className="w-8 h-8 text-sky-500/50" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No resources yet</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            Be the first to share a lesson! Upload a PDF from your{' '}
            <a href="/dashboard/saved" className="text-teal-600 hover:underline">Saved Library</a>{' '}
            and toggle "Share with all Tyoutor Pro users".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(resource => (
            <div
              key={resource.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3 hover:border-teal-300 hover:shadow-sm transition-all"
            >
              {/* Icon + Title */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-sky-600/10 border border-sky-600/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="w-4 h-4 text-sky-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{resource.title}</h3>
                  {resource.description && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{resource.description}</p>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {resource.subject && (
                  <span className="text-xs px-2.5 py-0.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-full font-medium">
                    {resource.subject}
                  </span>
                )}
                {resource.level && (
                  <span className="text-xs px-2.5 py-0.5 bg-sky-50 border border-sky-200 text-sky-700 rounded-full font-medium">
                    {resource.level}
                  </span>
                )}
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-1">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {resource.uploaded_by_name ?? 'Anonymous'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(resource.created_at)}
                </span>
              </div>

              {/* Download */}
              <button
                onClick={() => handleDownload(resource)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 border border-gray-200 hover:border-teal-400 hover:bg-teal-50 text-sm font-medium text-gray-600 hover:text-teal-700 transition-all"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
