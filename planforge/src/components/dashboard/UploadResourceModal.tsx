'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import {
  X, UploadCloud, FileText, Image, AlertCircle, CheckCircle, ChevronDown,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface UploadResourceModalProps {
  onClose: () => void
  onSuccess: () => void
}

const CEFR_LEVELS    = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Mixed']
const AGE_GROUPS     = ['Young Learners (5-12)', 'Teens (13-17)', 'Adults', 'Business Professionals', 'Mixed']
const SUBJECTS       = ['Grammar', 'Speaking', 'Reading', 'Writing', 'Vocabulary', 'Listening', 'Business English', 'Exam Prep', 'General English', 'Young Learner Activity', 'Other']
const RESOURCE_TYPES = ['Lesson Plan', 'Worksheet', 'Activity', 'Flashcards', 'Assessment', 'Game', 'Reading Material', 'Other']

const ALLOWED_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'image/png': 'image',
  'image/jpeg': 'image',
}
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  const isImage = mimeType.startsWith('image/')
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    'application/pdf': { bg: 'bg-red-50 border-red-200',   text: 'text-red-600',    label: 'PDF' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':   { bg: 'bg-blue-50 border-blue-200',  text: 'text-blue-600',   label: 'DOCX' },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-600', label: 'PPTX' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':         { bg: 'bg-green-50 border-green-200',  text: 'text-green-600',  label: 'XLSX' },
    'image/png':  { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-600', label: 'PNG' },
    'image/jpeg': { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-600', label: 'JPG' },
  }
  const c = colors[mimeType] ?? { bg: 'bg-[#F7F6F2] border-[#E8E4DE]', text: 'text-[#6B6860]', label: 'FILE' }
  return (
    <div className={`w-10 h-10 rounded-xl border flex flex-col items-center justify-center flex-shrink-0 ${c.bg}`}>
      {isImage
        ? <Image className={`w-4 h-4 ${c.text}`} />
        : <FileText className={`w-4 h-4 ${c.text}`} />}
      <span className={`text-[9px] font-bold leading-none mt-0.5 ${c.text}`}>{c.label}</span>
    </div>
  )
}

export function UploadResourceModal({ onClose, onSuccess }: UploadResourceModalProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging]   = useState(false)
  const [file, setFile]               = useState<File | null>(null)
  const [fileError, setFileError]     = useState<string | null>(null)

  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [cefrLevel, setCefrLevel]     = useState('')
  const [ageGroup, setAgeGroup]       = useState('')
  const [subject, setSubject]         = useState('')
  const [resourceType, setResourceType] = useState('')
  const [tags, setTags]               = useState('')

  const [phase, setPhase]             = useState<'idle' | 'uploading' | 'saving'>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError]             = useState<string | null>(null)

  const isUploading = phase !== 'idle'
  const isValid = file && title.trim() && cefrLevel && ageGroup && subject && resourceType

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isUploading) onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isUploading, onClose])

  const validateFile = useCallback((f: File): string | null => {
    if (!ALLOWED_MIME[f.type]) return 'Only PDF, DOCX, PPTX, XLSX, PNG, and JPG files are allowed.'
    if (f.size > MAX_BYTES)   return `File is too large (${formatBytes(f.size)}). Maximum is 10 MB.`
    return null
  }, [])

  const handleFile = useCallback((f: File) => {
    const err = validateFile(f)
    setFileError(err)
    setFile(err ? null : f)
    setError(null)
  }, [validateFile])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) handleFile(selected)
    e.target.value = ''
  }

  const handleSubmit = async () => {
    if (!isValid) return
    setError(null)

    try {
      // ── Step 1: get current user ──────────────────────────────────────────
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('You must be signed in to upload.'); return }

      // ── Step 2: upload file to Supabase Storage ───────────────────────────
      setPhase('uploading')
      setUploadProgress(0)

      const sanitizedName = file!.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase()
      const filePath = `${session.user.id}/${Date.now()}-${sanitizedName}`

      const { error: storageError } = await supabase.storage
        .from('shared-resources')
        .upload(filePath, file!, {
          contentType: file!.type,
          upsert: false,
          // @ts-expect-error — onUploadProgress is supported in supabase-js v2.x
          onUploadProgress: (progress: { loaded: number; total: number }) => {
            setUploadProgress(Math.round((progress.loaded / progress.total) * 100))
          },
        })

      if (storageError) throw new Error(storageError.message)

      // ── Step 3: get public URL ────────────────────────────────────────────
      const { data: { publicUrl } } = supabase.storage
        .from('shared-resources')
        .getPublicUrl(filePath)

      // ── Step 4: save metadata to DB ───────────────────────────────────────
      setPhase('saving')

      const parsedTags = tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      const res = await fetch('/api/shared-resources/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          file_url: publicUrl,
          file_name: file!.name,
          file_type: ALLOWED_MIME[file!.type] ?? 'other',
          file_size_bytes: file!.size,
          cefr_level: cefrLevel,
          age_group: ageGroup,
          subject,
          resource_type: resourceType,
          tags: parsedTags.length > 0 ? parsedTags : null,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save resource.')

      toast.success('Thanks for sharing! Your resource is now live.')
      onSuccess()
    } catch (err) {
      setPhase('idle')
      setUploadProgress(0)
      setError((err as Error).message || 'Something went wrong. Please try again.')
    }
  }

  const selectStyle = 'w-full appearance-none bg-[#F7F6F2] border border-[#E8E4DE] rounded-xl px-3 py-2.5 text-sm text-[#2D2D2D] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer font-medium'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget && !isUploading) onClose() }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
        style={{ border: '1px solid rgba(255,255,255,0.6)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EDEBE8]">
          <div>
            <h2 className="text-lg font-bold text-[#2D2D2D]">Share a Resource</h2>
            <p className="text-xs text-[#8C8880] mt-0.5">Help the community — upload a lesson material</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8C8880] hover:text-[#4A473E] hover:bg-[#F0EEE9] transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* ── File drop zone ── */}
          <div>
            <label className="block text-xs font-bold text-[#6B6860] uppercase tracking-wide mb-2">
              File <span className="text-red-400">*</span>
            </label>

            {file ? (
              <div className="flex items-center gap-3 p-3 bg-sky-50 border border-sky-200 rounded-xl">
                <FileTypeIcon mimeType={file.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#2D2D2D] truncate">{file.name}</p>
                  <p className="text-xs text-[#8C8880] mt-0.5">{formatBytes(file.size)}</p>
                </div>
                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => { setFile(null); setFileError(null) }}
                    className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex-shrink-0"
                  >
                    Replace
                  </button>
                )}
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all
                  ${isDragging
                    ? 'border-sky-400 bg-sky-50'
                    : 'border-[#E8E4DE] bg-[#F7F6F2] hover:border-sky-300 hover:bg-sky-50/50'}
                `}
              >
                <UploadCloud className={`w-8 h-8 ${isDragging ? 'text-sky-500' : 'text-[#C4C0BA]'}`} />
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#4A473E]">
                    {isDragging ? 'Drop it here' : 'Drag & drop or click to browse'}
                  </p>
                  <p className="text-xs text-[#8C8880] mt-0.5">PDF, DOCX, PPTX, XLSX, PNG, JPG — max 10 MB</p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.pptx,.xlsx,.png,.jpg,.jpeg"
              onChange={onInputChange}
            />

            {fileError && (
              <p className="text-xs text-red-500 font-medium mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {fileError}
              </p>
            )}
          </div>

          {/* ── Upload progress ── */}
          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#6B6860]">
                <span>{phase === 'uploading' ? 'Uploading file...' : 'Saving to library...'}</span>
                {phase === 'uploading' && <span>{uploadProgress}%</span>}
              </div>
              <div className="h-2 w-full bg-[#F0EEE9] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: phase === 'saving' ? '100%' : `${uploadProgress}%`,
                    background: 'linear-gradient(90deg, #0EA5E9, #38BDF8)',
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Title ── */}
          <div>
            <label className="block text-xs font-bold text-[#6B6860] uppercase tracking-wide mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value.slice(0, 120))}
              placeholder="e.g. Past Perfect Speaking Activity"
              disabled={isUploading}
              className="w-full bg-[#F7F6F2] border border-[#E8E4DE] rounded-xl px-3 py-2.5 text-sm text-[#2D2D2D] placeholder-[#8C8880] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
            />
            <p className="text-xs text-[#8C8880] mt-1 text-right">{title.length}/120</p>
          </div>

          {/* ── Description ── */}
          <div>
            <label className="block text-xs font-bold text-[#6B6860] uppercase tracking-wide mb-2">
              Description <span className="text-[#8C8880] font-normal normal-case">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, 500))}
              placeholder="What's in this resource? Who is it for?"
              rows={3}
              disabled={isUploading}
              className="w-full bg-[#F7F6F2] border border-[#E8E4DE] rounded-xl px-3 py-2.5 text-sm text-[#2D2D2D] placeholder-[#8C8880] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none disabled:opacity-60 font-inherit"
              style={{ fontFamily: 'inherit' }}
            />
            <p className="text-xs text-[#8C8880] mt-1 text-right">{description.length}/500</p>
          </div>

          {/* ── Dropdowns row 1: CEFR + Age Group ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#6B6860] uppercase tracking-wide mb-2">
                CEFR Level <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={cefrLevel}
                  onChange={e => setCefrLevel(e.target.value)}
                  disabled={isUploading}
                  className={selectStyle}
                >
                  <option value="">Select level</option>
                  {CEFR_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8C8880]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B6860] uppercase tracking-wide mb-2">
                Age Group <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={ageGroup}
                  onChange={e => setAgeGroup(e.target.value)}
                  disabled={isUploading}
                  className={selectStyle}
                >
                  <option value="">Select group</option>
                  {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8C8880]" />
              </div>
            </div>
          </div>

          {/* ── Dropdowns row 2: Subject + Resource Type ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#6B6860] uppercase tracking-wide mb-2">
                Subject <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  disabled={isUploading}
                  className={selectStyle}
                >
                  <option value="">Select subject</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8C8880]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B6860] uppercase tracking-wide mb-2">
                Type <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={resourceType}
                  onChange={e => setResourceType(e.target.value)}
                  disabled={isUploading}
                  className={selectStyle}
                >
                  <option value="">Select type</option>
                  {RESOURCE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8C8880]" />
              </div>
            </div>
          </div>

          {/* ── Tags ── */}
          <div>
            <label className="block text-xs font-bold text-[#6B6860] uppercase tracking-wide mb-2">
              Tags <span className="text-[#8C8880] font-normal normal-case">(optional, comma-separated)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="e.g. past tense, group activity, B2+"
              disabled={isUploading}
              className="w-full bg-[#F7F6F2] border border-[#E8E4DE] rounded-xl px-3 py-2.5 text-sm text-[#2D2D2D] placeholder-[#8C8880] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
            />
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* ── Submit ── */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isUploading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all"
            style={{
              background: isValid && !isUploading
                ? 'linear-gradient(135deg, #0284C7, #38BDF8)'
                : '#E5E7EB',
              color: isValid && !isUploading ? 'white' : '#9CA3AF',
              boxShadow: isValid && !isUploading ? '0 6px 20px rgba(2,132,199,0.30)' : 'none',
            }}
          >
            {isUploading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {phase === 'saving' ? 'Saving...' : `Uploading ${uploadProgress}%`}
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Share with Community
              </>
            )}
          </button>

          <p className="text-center text-xs text-[#8C8880]">
            By sharing, you confirm this resource is your own work or freely shareable.
          </p>

        </div>
      </div>
    </div>
  )
}
