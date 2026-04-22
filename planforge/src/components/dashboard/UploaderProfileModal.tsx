'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { X, Download, FileText, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

interface Resource {
  id: string
  title: string
  file_url: string
  file_name: string
  file_type: string | null
  cefr_level: string | null
  subject: string | null
  download_count: number
}

const FILE_ICON_CONFIG: Record<string, { label: string; bg: string; border: string; color: string; isImage: boolean }> = {
  pdf:   { label: 'PDF',  bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', isImage: false },
  docx:  { label: 'DOCX', bg: '#EFF6FF', border: '#BFDBFE', color: '#2563EB', isImage: false },
  pptx:  { label: 'PPTX', bg: '#FFF7ED', border: '#FED7AA', color: '#EA580C', isImage: false },
  xlsx:  { label: 'XLSX', bg: '#F0FDF4', border: '#BBF7D0', color: '#16A34A', isImage: false },
  image: { label: 'IMG',  bg: '#FAF5FF', border: '#E9D5FF', color: '#9333EA', isImage: true },
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

interface Props {
  userId: string
  uploaderName: string
  uploaderAvatarUrl: string | null
  onClose: () => void
}

export function UploaderProfileModal({ userId, uploaderName, uploaderAvatarUrl, onClose }: Props) {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading]     = useState(true)
  const [totalDownloads, setTotalDownloads] = useState(0)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('shared_resources')
          .select('id, title, file_url, file_name, file_type, cefr_level, subject, download_count')
          .eq('user_id', userId)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
        if (error) throw error
        const list = data ?? []
        setResources(list)
        setTotalDownloads(list.reduce((s, r) => s + (r.download_count ?? 0), 0))
      } catch {
        toast.error('Could not load profile.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleDownload = async (resource: Resource) => {
    setResources(prev => prev.map(r =>
      r.id === resource.id ? { ...r, download_count: r.download_count + 1 } : r
    ))
    setTotalDownloads(d => d + 1)

    fetch('/api/shared-resources/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: resource.id }),
    }).catch(() => {})

    try {
      if (resource.file_url.startsWith('http')) {
        const a = document.createElement('a')
        a.href = resource.file_url
        a.download = resource.file_name
        a.target = '_blank'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
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

  const avatarBg = getAvatarBg(uploaderName)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-[520px] bg-white shadow-2xl z-50 flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDEBE8]">
          <h2 className="text-base font-bold text-[#2D2D2D]">Teacher profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#F0EEE9] hover:bg-[#E8E4DE] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-[#6B6860]" />
          </button>
        </div>

        {/* ── Profile hero ── */}
        <div className="px-6 py-5 border-b border-[#EDEBE8] flex items-center gap-4">
          {uploaderAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={uploaderAvatarUrl}
              alt={uploaderName}
              className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-bold text-white"
              style={{ background: avatarBg }}
            >
              {getInitials(uploaderName)}
            </div>
          )}
          <div>
            <p className="text-lg font-bold text-[#2D2D2D]">{uploaderName}</p>
            {!loading && (
              <p className="text-sm text-[#8C8880] mt-0.5">
                {resources.length} resource{resources.length !== 1 ? 's' : ''}
                &nbsp;·&nbsp;
                {totalDownloads.toLocaleString()} download{totalDownloads !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* ── Resource list ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-xl border border-[#EDEBE8]">
                <div className="w-10 h-10 bg-[#F0EEE9] rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-[#F0EEE9] rounded w-3/4" />
                  <div className="h-3 bg-[#F0EEE9] rounded w-1/2" />
                </div>
                <div className="w-24 h-8 bg-[#F0EEE9] rounded-xl flex-shrink-0" />
              </div>
            ))
          ) : resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-sm text-[#8C8880]">No public resources yet.</p>
            </div>
          ) : (
            resources.map(resource => {
              const ft = FILE_ICON_CONFIG[resource.file_type ?? 'pdf'] ?? FILE_ICON_CONFIG.pdf
              return (
                <div
                  key={resource.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#EDEBE8] hover:border-sky-200 hover:bg-sky-50/30 transition-all"
                >
                  {/* File type badge */}
                  <div
                    className="w-10 h-10 rounded-xl border flex flex-col items-center justify-center flex-shrink-0"
                    style={{ background: ft.bg, borderColor: ft.border }}
                  >
                    {ft.isImage
                      ? <ImageIcon className="w-4 h-4" style={{ color: ft.color }} />
                      : <FileText className="w-4 h-4" style={{ color: ft.color }} />}
                    <span className="text-[8px] font-bold mt-px" style={{ color: ft.color }}>{ft.label}</span>
                  </div>

                  {/* Title + chips */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#2D2D2D] truncate">{resource.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {resource.cefr_level && (
                        <span className="text-[10px] px-1.5 py-px bg-sky-50 border border-sky-200 text-sky-700 rounded-full font-semibold">
                          {resource.cefr_level}
                        </span>
                      )}
                      {resource.subject && (
                        <span className="text-[10px] px-1.5 py-px bg-teal-50 border border-teal-200 text-teal-700 rounded-full font-semibold">
                          {resource.subject}
                        </span>
                      )}
                      <span className="text-[10px] text-[#8C8880]">
                        {resource.download_count > 0
                          ? `${resource.download_count.toLocaleString()} ↓`
                          : 'No downloads yet'}
                      </span>
                    </div>
                  </div>

                  {/* Download */}
                  <button
                    type="button"
                    onClick={() => handleDownload(resource)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #0284C7, #38BDF8)', boxShadow: '0 2px 8px rgba(2,132,199,0.20)' }}
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
