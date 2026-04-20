'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { formatDistanceToNow } from 'date-fns'
import {
  Globe, Search, Download, BookOpen, Filter, FileText, Image,
  Plus, ArrowUpDown, Users, Tag, Flag,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { UploadResourceModal } from '@/components/dashboard/UploadResourceModal'
import { UploaderProfileModal } from '@/components/dashboard/UploaderProfileModal'
import { ReportResourceModal } from '@/components/dashboard/ReportResourceModal'

interface SharedResource {
  id: string
  user_id: string
  title: string
  description: string | null
  subject: string | null
  cefr_level: string | null
  age_group: string | null
  resource_type: string | null
  file_url: string
  file_name: string
  file_type: string | null
  file_size_bytes: number | null
  uploader_name: string | null
  uploader_avatar_url: string | null
  tags: string[] | null
  download_count: number
  created_at: string
}

// ── Filter options ──────────────────────────────────────────────────────────

const SUBJECT_OPTIONS      = ['All', 'Grammar', 'Vocabulary', 'Speaking', 'Listening', 'Reading', 'Writing', 'Business English', 'Exam Prep', 'General English', 'Young Learner Activity', 'Other']
const LEVEL_OPTIONS        = ['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Mixed']
const AGE_GROUP_OPTIONS    = ['All', 'Young Learners (5-12)', 'Teens (13-17)', 'Adults', 'Business Professionals', 'Mixed']
const RESOURCE_TYPE_OPTIONS = ['All', 'Lesson Plan', 'Worksheet', 'Activity', 'Flashcards', 'Assessment', 'Game', 'Reading Material', 'Other']

// ── File type display config ────────────────────────────────────────────────

const FILE_ICON_CONFIG: Record<string, { label: string; bg: string; border: string; color: string; isImage: boolean }> = {
  pdf:   { label: 'PDF',  bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', isImage: false },
  docx:  { label: 'DOCX', bg: '#EFF6FF', border: '#BFDBFE', color: '#2563EB', isImage: false },
  pptx:  { label: 'PPTX', bg: '#FFF7ED', border: '#FED7AA', color: '#EA580C', isImage: false },
  xlsx:  { label: 'XLSX', bg: '#F0FDF4', border: '#BBF7D0', color: '#16A34A', isImage: false },
  image: { label: 'IMG',  bg: '#FAF5FF', border: '#E9D5FF', color: '#9333EA', isImage: true },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true })
  } catch {
    return ''
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function getAvatarBg(name: string): string {
  const palette = ['#0EA5E9', '#8B5CF6', '#EC4899', '#F97316', '#10B981', '#6366F1', '#F59E0B']
  let h = 0
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0
  return palette[Math.abs(h) % palette.length]
}

// ── Resource card ────────────────────────────────────────────────────────────

function ResourceCard({
  resource,
  onDownload,
  onUploaderClick,
  onReport,
}: {
  resource: SharedResource
  onDownload: (r: SharedResource) => void
  onUploaderClick?: (r: SharedResource) => void
  onReport?: (r: SharedResource) => void
}) {
  const ft = FILE_ICON_CONFIG[resource.file_type ?? 'pdf'] ?? FILE_ICON_CONFIG.pdf
  const uploaderName = resource.uploader_name ?? 'Anonymous'
  const avatarBg = getAvatarBg(uploaderName)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3 hover:border-sky-300 hover:shadow-md transition-all duration-200">

      {/* ── TOP: file type icon + title ── */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl border flex flex-col items-center justify-center flex-shrink-0"
          style={{ background: ft.bg, borderColor: ft.border }}
        >
          {ft.isImage
            ? <Image className="w-4 h-4" style={{ color: ft.color }} />
            : <FileText className="w-4 h-4" style={{ color: ft.color }} />}
          <span className="text-[8px] font-bold mt-px" style={{ color: ft.color }}>{ft.label}</span>
        </div>
        <h3 className="font-bold text-gray-900 text-[14px] leading-snug line-clamp-2 pt-0.5">
          {resource.title}
        </h3>
      </div>

      {/* ── METADATA: avatar + name + time ── */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onUploaderClick?.(resource)}
          className="flex items-center gap-2 min-w-0 hover:opacity-70 transition-opacity"
        >
          {resource.uploader_avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resource.uploader_avatar_url}
              alt={uploaderName}
              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-white"
              style={{ background: avatarBg }}
            >
              {getInitials(uploaderName)}
            </div>
          )}
          <span className="text-xs font-semibold text-gray-600 truncate">{uploaderName}</span>
        </button>
        <span className="text-gray-300 text-xs flex-shrink-0">·</span>
        <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(resource.created_at)}</span>
      </div>

      {/* ── TAG CHIPS ── */}
      <div className="flex flex-wrap gap-1.5">
        {resource.cefr_level && (
          <span className="text-[11px] px-2 py-0.5 bg-sky-50 border border-sky-200 text-sky-700 rounded-full font-semibold">
            {resource.cefr_level}
          </span>
        )}
        {resource.age_group && (
          <span className="text-[11px] px-2 py-0.5 bg-violet-50 border border-violet-200 text-violet-700 rounded-full font-semibold">
            {resource.age_group}
          </span>
        )}
        {resource.subject && (
          <span className="text-[11px] px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-full font-semibold">
            {resource.subject}
          </span>
        )}
        {resource.resource_type && (
          <span className="text-[11px] px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full font-semibold">
            {resource.resource_type}
          </span>
        )}
        {resource.tags?.map(tag => (
          <span key={tag} className="text-[11px] px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-500 rounded-full font-medium">
            {tag}
          </span>
        ))}
      </div>

      {/* ── DESCRIPTION ── */}
      {resource.description && (
        <p className="text-[12.5px] text-gray-500 leading-relaxed line-clamp-2">
          {resource.description.length > 120
            ? resource.description.slice(0, 120) + '…'
            : resource.description}
        </p>
      )}

      {/* ── BOTTOM: file size + download count + button ── */}
      <div className="flex items-center justify-between text-[11px] text-gray-400 mt-auto">
        <span>{resource.file_size_bytes ? formatBytes(resource.file_size_bytes) : ft.label}</span>
        <span>
          {resource.download_count > 0
            ? `Downloaded ${resource.download_count.toLocaleString()} time${resource.download_count !== 1 ? 's' : ''}`
            : 'Be the first to download'}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onDownload(resource)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
        style={{ background: 'linear-gradient(135deg, #0284C7, #38BDF8)', boxShadow: '0 4px 12px rgba(2,132,199,0.25)' }}
      >
        <Download className="w-3.5 h-3.5" />
        Download
      </button>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onReport?.(resource)}
          className="flex items-center gap-1 text-[11px] text-gray-300 hover:text-red-400 transition-colors"
        >
          <Flag className="w-3 h-3" />
          Report
        </button>
      </div>
    </div>
  )
}

// ── Loading skeleton ─────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 bg-gray-100 rounded w-4/5" />
          <div className="h-3 bg-gray-100 rounded w-3/5" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-gray-100 rounded-full" />
        <div className="h-3 bg-gray-100 rounded w-24" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 bg-gray-100 rounded-full w-10" />
        <div className="h-5 bg-gray-100 rounded-full w-16" />
        <div className="h-5 bg-gray-100 rounded-full w-14" />
      </div>
      <div className="h-8 bg-gray-100 rounded-xl w-full mt-2" />
    </div>
  )
}

// ── Filter select ────────────────────────────────────────────────────────────

function FilterSelect({
  value, onChange, options, allLabel, icon: Icon,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  allLabel: string
  icon: React.ElementType
}) {
  return (
    <div className="relative">
      <Icon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-6 py-2 text-[13px] text-gray-700 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium cursor-pointer"
      >
        <option value="All">{allLabel}</option>
        {options.filter(o => o !== 'All').map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SharedResourcesPage() {
  const [resources, setResources]           = useState<SharedResource[]>([])
  const [loading, setLoading]               = useState(true)
  const [search, setSearch]                 = useState('')
  const [subjectFilter, setSubjectFilter]   = useState('All')
  const [levelFilter, setLevelFilter]       = useState('All')
  const [ageGroupFilter, setAgeGroupFilter] = useState('All')
  const [typeFilter, setTypeFilter]         = useState('All')
  const [sortBy, setSortBy]                 = useState<'newest' | 'oldest' | 'popular'>('newest')
  const [uploadOpen, setUploadOpen]         = useState(false)
  const [profileUser, setProfileUser]       = useState<{ userId: string; name: string; avatarUrl: string | null } | null>(null)
  const [reportResource, setReportResource] = useState<SharedResource | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchResources = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('shared_resources')
        .select('id, user_id, title, description, subject, cefr_level, age_group, resource_type, file_url, file_name, file_type, file_size_bytes, uploader_name, uploader_avatar_url, tags, download_count, created_at')
        .eq('is_public', true)

      if (subjectFilter  !== 'All') query = query.eq('subject',       subjectFilter)
      if (levelFilter    !== 'All') query = query.eq('cefr_level',    levelFilter)
      if (ageGroupFilter !== 'All') query = query.eq('age_group',     ageGroupFilter)
      if (typeFilter     !== 'All') query = query.eq('resource_type', typeFilter)

      query = sortBy === 'popular'
        ? query.order('download_count', { ascending: false })
        : sortBy === 'oldest'
          ? query.order('created_at', { ascending: true })
          : query.order('created_at', { ascending: false })

      const { data, error } = await query
      if (error) throw error
      setResources(data ?? [])
    } catch {
      toast.error('Failed to load shared resources.')
    } finally {
      setLoading(false)
    }
  }, [subjectFilter, levelFilter, ageGroupFilter, typeFilter, sortBy]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchResources() }, [fetchResources])

  const handleDownload = async (resource: SharedResource) => {
    // Optimistic counter update
    setResources(prev => prev.map(r =>
      r.id === resource.id ? { ...r, download_count: r.download_count + 1 } : r
    ))

    // Increment in DB (fire-and-forget — counter is best-effort)
    fetch('/api/shared-resources/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: resource.id }),
    }).catch(() => {})

    // Trigger file download
    try {
      if (resource.file_url.startsWith('http')) {
        // New-style public URL (shared-resources bucket)
        const a = document.createElement('a')
        a.href = resource.file_url
        a.download = resource.file_name
        a.target = '_blank'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        // Legacy path (lesson-uploads bucket)
        const { data, error } = await supabase.storage
          .from('lesson-uploads')
          .createSignedUrl(resource.file_url.replace(/^.*lesson-uploads\//, ''), 60)
        if (error || !data?.signedUrl) throw error
        const a = document.createElement('a')
        a.href = data.signedUrl
        a.download = resource.file_name
        a.click()
      }
    } catch {
      toast.error('Could not download file. Please try again.')
    }
  }

  // Client-side text search only (dropdown filters handled server-side)
  const filtered = resources.filter(r => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      r.title.toLowerCase().includes(q) ||
      (r.description ?? '').toLowerCase().includes(q) ||
      (r.subject ?? '').toLowerCase().includes(q) ||
      (r.uploader_name ?? '').toLowerCase().includes(q) ||
      (r.tags ?? []).some(t => t.toLowerCase().includes(q))
    )
  })

  const hasActiveFilters =
    search.trim() ||
    subjectFilter !== 'All' || levelFilter !== 'All' ||
    ageGroupFilter !== 'All' || typeFilter !== 'All'

  return (
    <div className="relative isolate max-w-6xl mx-auto space-y-6">
      {/* Background decorations */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dot-pattern" style={{ zIndex: -1 }} />
      <div aria-hidden style={{ position:'absolute',width:350,height:350,top:-80,right:-80,borderRadius:'50%',filter:'blur(80px)',background:'radial-gradient(ellipse,#D4E8FF,#B3D4FF)',opacity:0.14,pointerEvents:'none',zIndex:-1,animation:'blobFloat 8s ease-in-out 0s infinite alternate' }} />
      <div aria-hidden style={{ position:'absolute',width:280,height:280,bottom:60,left:-60,borderRadius:'50%',filter:'blur(80px)',background:'radial-gradient(ellipse,#D4E8D0,#A7C4A0)',opacity:0.13,pointerEvents:'none',zIndex:-1,animation:'blobFloat 8s ease-in-out 3s infinite alternate' }} />

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-600/15 border border-sky-600/30 rounded-xl flex items-center justify-center">
            <Globe className="w-5 h-5 text-sky-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Shared Resources</h1>
            <p className="text-sm text-gray-500">Community-uploaded lesson materials from Tyoutor Pro teachers</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0284C7, #38BDF8)', boxShadow: '0 4px 14px rgba(2,132,199,0.30)' }}
        >
          <Plus className="w-4 h-4" />
          Upload Resource
        </button>
      </div>

      {/* ── Search + Filters ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        {/* Search row */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, description, subject, or teacher name..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* Filter dropdowns row */}
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            value={subjectFilter}
            onChange={setSubjectFilter}
            options={SUBJECT_OPTIONS}
            allLabel="All Subjects"
            icon={Filter}
          />
          <FilterSelect
            value={levelFilter}
            onChange={setLevelFilter}
            options={LEVEL_OPTIONS}
            allLabel="All Levels"
            icon={BookOpen}
          />
          <FilterSelect
            value={ageGroupFilter}
            onChange={setAgeGroupFilter}
            options={AGE_GROUP_OPTIONS}
            allLabel="All Ages"
            icon={Users}
          />
          <FilterSelect
            value={typeFilter}
            onChange={setTypeFilter}
            options={RESOURCE_TYPE_OPTIONS}
            allLabel="All Types"
            icon={Tag}
          />

          {/* Sort */}
          <div className="relative ml-auto">
            <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-6 py-2 text-[13px] text-gray-700 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium cursor-pointer"
            >
              <option value="newest">Newest first</option>
              <option value="popular">Most downloaded</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Results count ── */}
      {!loading && (
        <p className="text-sm text-gray-400 -mt-2">
          {filtered.length === 0
            ? 'No resources match your filters'
            : `${filtered.length} resource${filtered.length !== 1 ? 's' : ''} found`}
        </p>
      )}

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl min-h-[360px] flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 bg-sky-600/10 rounded-2xl flex items-center justify-center mb-4">
            <Globe className="w-8 h-8 text-sky-500/50" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {hasActiveFilters ? 'No resources found' : 'No resources yet'}
          </h3>
          <p className="text-sm text-gray-500 max-w-xs mb-5">
            {hasActiveFilters
              ? 'Try different filters or be the first to upload!'
              : 'Be the first to share a teaching material with the community.'}
          </p>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #0284C7, #38BDF8)', boxShadow: '0 4px 14px rgba(2,132,199,0.25)' }}
          >
            <Plus className="w-4 h-4" />
            Upload Resource
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(resource => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onDownload={handleDownload}
              onUploaderClick={r => setProfileUser({ userId: r.user_id, name: r.uploader_name ?? 'Anonymous', avatarUrl: r.uploader_avatar_url })}
              onReport={r => setReportResource(r)}
            />
          ))}
        </div>
      )}

      {/* ── Upload modal ── */}
      {uploadOpen && (
        <UploadResourceModal
          onClose={() => setUploadOpen(false)}
          onSuccess={() => {
            setUploadOpen(false)
            fetchResources()
          }}
        />
      )}

      {/* ── Uploader profile panel ── */}
      {profileUser && (
        <UploaderProfileModal
          userId={profileUser.userId}
          uploaderName={profileUser.name}
          uploaderAvatarUrl={profileUser.avatarUrl}
          onClose={() => setProfileUser(null)}
        />
      )}

      {/* ── Report modal ── */}
      {reportResource && (
        <ReportResourceModal
          resourceId={reportResource.id}
          resourceTitle={reportResource.title}
          onClose={() => setReportResource(null)}
        />
      )}
    </div>
  )
}
