'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lesson, Worksheet } from '@/types'
import { formatDate } from '@/lib/utils'
import { BookOpen, FileText, Search, Trash2, Download, Eye, SlidersHorizontal, BookMarked, Upload, X, Globe } from 'lucide-react'
import { generateLessonPDF } from '@/lib/pdf'
import toast from 'react-hot-toast'

type FilterType = 'all' | 'lesson' | 'worksheet'

interface UploadModal {
  open: boolean
  file: File | null
  title: string
  subject: string
  level: string
  isPublic: boolean
  uploading: boolean
}

export default function SavedPage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [worksheets, setWorksheets] = useState<Worksheet[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [upload, setUpload] = useState<UploadModal>({
    open: false, file: null, title: '', subject: '', level: 'B1', isPublic: false, uploading: false,
  })

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const [{ data: l }, { data: w }] = await Promise.all([
      supabase.from('lessons').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
      supabase.from('worksheets').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
    ])
    setLessons(l || [])
    setWorksheets(w || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const deleteLesson = async (id: string) => {
    setDeleting(id)
    await supabase.from('lessons').delete().eq('id', id)
    setLessons(p => p.filter(l => l.id !== id))
    toast.success('Lesson deleted')
    setDeleting(null)
  }

  const deleteWorksheet = async (id: string) => {
    setDeleting(id)
    await supabase.from('worksheets').delete().eq('id', id)
    setWorksheets(p => p.filter(w => w.id !== id))
    toast.success('Worksheet deleted')
    setDeleting(null)
  }

  const handleDownloadLesson = async (lesson: Lesson) => {
    try {
      await generateLessonPDF(lesson.lesson_content, { level: lesson.student_level, topic: lesson.topic, date: formatDate(lesson.created_at) })
    } catch {
      toast.error('PDF generation failed.')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) { toast.error('File must be under 20MB'); return }
    if (!file.name.endsWith('.pdf')) { toast.error('Only PDF files are supported'); return }
    setUpload(u => ({ ...u, open: true, file, title: file.name.replace('.pdf', '') }))
  }

  const handleUpload = async () => {
    if (!upload.file || !upload.title.trim()) { toast.error('Title is required'); return }
    setUpload(u => ({ ...u, uploading: true }))
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { toast.error('Not authenticated'); return }

      // Upload to Supabase Storage
      const fileName = `${session.user.id}/${Date.now()}-${upload.file.name}`
      const { error: storageErr } = await supabase.storage
        .from('lesson-uploads')
        .upload(fileName, upload.file, { contentType: 'application/pdf' })
      if (storageErr) throw storageErr

      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from('lesson-uploads').getPublicUrl(fileName)

      // Get user name
      const { data: profile } = await supabase.from('users').select('full_name, email').eq('id', session.user.id).single()

      // Save record
      const { error: dbErr } = await supabase.from('shared_resources').insert({
        user_id: session.user.id,
        title: upload.title.trim(),
        subject: upload.subject.trim() || null,
        level: upload.level,
        file_url: publicUrl,
        file_name: upload.file.name,
        is_public: upload.isPublic,
        uploaded_by_name: profile?.full_name || profile?.email || 'Anonymous',
      })
      if (dbErr) throw dbErr

      toast.success(upload.isPublic ? 'Uploaded and shared with the community!' : 'Uploaded to your private library!')
      setUpload({ open: false, file: null, title: '', subject: '', level: 'B1', isPublic: false, uploading: false })
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Upload failed')
      setUpload(u => ({ ...u, uploading: false }))
    }
  }

  const levels = ['all', ...Array.from(new Set(lessons.map(l => l.student_level)))]
  const filteredLessons = lessons.filter(l => {
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase()) || l.topic.toLowerCase().includes(search.toLowerCase())
    const matchLevel = levelFilter === 'all' || l.student_level === levelFilter
    return matchSearch && matchLevel
  })
  const filteredWorksheets = worksheets.filter(w => w.title.toLowerCase().includes(search.toLowerCase()))
  const showLessons = filter === 'all' || filter === 'lesson'
  const showWorksheets = filter === 'all' || filter === 'worksheet'
  const total = (showLessons ? filteredLessons.length : 0) + (showWorksheets ? filteredWorksheets.length : 0)

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Saved Library</h1>
            <p className="text-sm text-gray-500">{lessons.length} lessons · {worksheets.length} worksheets</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-all text-sm"
          >
            <Upload className="w-4 h-4" /> Upload PDF
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search lessons and worksheets..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'lesson', 'worksheet'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${filter === f ? 'bg-teal-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'}`}
            >
              {f === 'all' ? 'All' : f === 'lesson' ? 'Lessons' : 'Worksheets'}
            </button>
          ))}
        </div>
        {filter !== 'worksheet' && levels.length > 1 && (
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500 appearance-none">
              {levels.map(l => <option key={l} value={l}>{l === 'all' ? 'All Levels' : l}</option>)}
            </select>
          </div>
        )}
      </div>

      {total === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-white border border-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{search ? 'No results found' : 'Your library is empty'}</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
            {search ? 'Try a different search term.' : 'Generate your first lesson or worksheet and save it here.'}
          </p>
          {!search && (
            <a href="/dashboard/lesson-generator" className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
              <BookOpen className="w-4 h-4" /> Generate First Lesson
            </a>
          )}
        </div>
      )}

      {showLessons && filteredLessons.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Lessons <span className="text-gray-400 font-normal normal-case">({filteredLessons.length})</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLessons.map(lesson => (
              <div key={lesson.id} className="bg-white border border-gray-200 hover:border-teal-600/50 rounded-2xl p-5 transition-all group">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0"><BookOpen className="w-4 h-4 text-teal-500" /></div>
                  <span className="text-xs font-semibold text-teal-600 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">{lesson.student_level}</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">{lesson.title}</h3>
                <p className="text-xs text-gray-500 mb-3 truncate">{lesson.topic} · {lesson.lesson_length}min</p>
                <p className="text-xs text-gray-400">{formatDate(lesson.created_at)}</p>
                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDownloadLesson(lesson)} className="flex items-center gap-1.5 text-xs border border-gray-200 hover:border-teal-500 hover:text-teal-600 text-gray-500 px-3 py-1.5 rounded-lg transition-all">
                    <Download className="w-3 h-3" /> PDF
                  </button>
                  <button onClick={() => deleteLesson(lesson.id)} disabled={deleting === lesson.id} className="flex items-center gap-1.5 text-xs border border-gray-200 hover:border-red-400 hover:text-red-500 text-gray-400 px-3 py-1.5 rounded-lg transition-all ml-auto">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showWorksheets && filteredWorksheets.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Worksheets <span className="text-gray-400 font-normal normal-case">({filteredWorksheets.length})</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorksheets.map(ws => (
              <div key={ws.id} className="bg-white border border-gray-200 hover:border-blue-600/50 rounded-2xl p-5 transition-all group">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-blue-500" /></div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">Worksheet</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">{ws.title}</h3>
                <p className="text-xs text-gray-400 mt-3">{formatDate(ws.created_at)}</p>
                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="flex items-center gap-1.5 text-xs border border-gray-200 hover:border-teal-500 hover:text-teal-600 text-gray-500 px-3 py-1.5 rounded-lg transition-all">
                    <Eye className="w-3 h-3" /> View
                  </button>
                  <button onClick={() => deleteWorksheet(ws.id)} disabled={deleting === ws.id} className="flex items-center gap-1.5 text-xs border border-gray-200 hover:border-red-400 hover:text-red-500 text-gray-400 px-3 py-1.5 rounded-lg transition-all ml-auto">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {upload.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Upload Lesson PDF</h2>
              <button onClick={() => setUpload(u => ({ ...u, open: false, file: null }))} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <FileText className="w-5 h-5 text-teal-500 flex-shrink-0" />
              <span className="text-sm text-gray-700 truncate">{upload.file?.name}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Lesson Title <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={upload.title}
                onChange={e => setUpload(u => ({ ...u, title: e.target.value }))}
                placeholder="e.g. Present Perfect for B2 Adults"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject / Topic</label>
                <input
                  type="text"
                  value={upload.subject}
                  onChange={e => setUpload(u => ({ ...u, subject: e.target.value }))}
                  placeholder="e.g. Grammar"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Level</label>
                <select
                  value={upload.level}
                  onChange={e => setUpload(u => ({ ...u, level: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-teal-500"
                >
                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={upload.isPublic}
                onChange={e => setUpload(u => ({ ...u, isPublic: e.target.checked }))}
                className="mt-0.5 w-4 h-4 accent-teal-600 rounded"
              />
              <div>
                <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-teal-500" />
                  Share with all PlanForge users
                </div>
                <p className="text-xs text-gray-500 mt-0.5">This lesson will appear in the Shared Resources community library.</p>
              </div>
            </label>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setUpload(u => ({ ...u, open: false, file: null }))}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={upload.uploading}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {upload.uploading ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Uploading...</> : <><Upload className="w-4 h-4" />Upload</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
