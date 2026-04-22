'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lesson, Worksheet, PracticeSession } from '@/types'
import { formatDate } from '@/lib/utils'
import { BookOpen, FileText, Search, Trash2, Download, Eye, SlidersHorizontal, BookMarked, Upload, X, Globe, Zap, Link2, QrCode } from 'lucide-react'
import { generateLessonPDF, generateWorksheetPDF } from '@/lib/pdf'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'

type FilterType = 'all' | 'lesson' | 'worksheet' | 'practice'

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
  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [viewedWorksheet, setViewedWorksheet] = useState<Worksheet | null>(null)
  const [qrSession, setQrSession] = useState<PracticeSession | null>(null)
  const [upload, setUpload] = useState<UploadModal>({
    open: false, file: null, title: '', subject: '', level: 'B1', isPublic: false, uploading: false,
  })

  const [teacherName, setTeacherName] = useState('Teacher')

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const [{ data: l }, { data: w }, { data: p }, { data: profile }] = await Promise.all([
      supabase.from('lessons').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
      supabase.from('worksheets').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
      supabase.from('practice_sessions').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
      supabase.from('users').select('full_name').eq('id', session.user.id).single(),
    ])
    setLessons(l || [])
    setWorksheets(w || [])
    setPracticeSessions((p || []) as PracticeSession[])
    if (profile?.full_name) setTeacherName(profile.full_name)
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

  const deletePracticeSession = async (id: string) => {
    setDeleting(id)
    await supabase.from('practice_sessions').delete().eq('id', id)
    setPracticeSessions(p => p.filter(s => s.id !== id))
    toast.success('Practice session deleted')
    setDeleting(null)
  }

  const copyPracticeLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/practice/${code}`)
    toast.success('Link copied!')
  }

  const handleDownloadLesson = async (lesson: Lesson) => {
    try {
      await generateLessonPDF(lesson.lesson_content, { level: lesson.student_level, topic: lesson.topic, date: formatDate(lesson.created_at) }, teacherName)
    } catch {
      toast.error('PDF generation failed.')
    }
  }

  const handleDownloadWorksheet = async (ws: Worksheet) => {
    try {
      await generateWorksheetPDF(ws.content, formatDate(ws.created_at), teacherName)
      toast.success('PDF downloaded!')
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
  const filteredPractice = practiceSessions.filter(p => p.lesson_title.toLowerCase().includes(search.toLowerCase()) || p.lesson_topic.toLowerCase().includes(search.toLowerCase()))
  const showLessons = filter === 'all' || filter === 'lesson'
  const showWorksheets = filter === 'all' || filter === 'worksheet'
  const showPractice = filter === 'all' || filter === 'practice'
  const total = (showLessons ? filteredLessons.length : 0) + (showWorksheets ? filteredWorksheets.length : 0) + (showPractice ? filteredPractice.length : 0)

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
    <div className="relative isolate max-w-5xl mx-auto space-y-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dot-pattern" style={{ zIndex: -1 }} />
      <div aria-hidden style={{ position:'absolute',width:350,height:350,top:-80,right:-80,borderRadius:'50%',filter:'blur(80px)',background:'radial-gradient(ellipse,#D4E8D0,#A7C4A0)',opacity:0.15,pointerEvents:'none',zIndex:-1,animation:'blobFloat 8s ease-in-out 0s infinite alternate' }} />
      <div aria-hidden style={{ position:'absolute',width:280,height:280,bottom:60,left:-60,borderRadius:'50%',filter:'blur(80px)',background:'radial-gradient(ellipse,#FFE5D9,#FECDA6)',opacity:0.13,pointerEvents:'none',zIndex:-1,animation:'blobFloat 8s ease-in-out 3s infinite alternate' }} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F0EEE9] border border-[#E8E4DE] rounded-xl flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-[#6B6860]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#2D2D2D]">Saved Library</h1>
            <p className="text-sm text-[#6B6860]">{lessons.length} lessons · {worksheets.length} worksheets · {practiceSessions.length} practice sessions</p>
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8880]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search lessons and worksheets..."
            className="w-full bg-white border border-[#E8E4DE] rounded-xl pl-11 pr-4 py-3 text-sm text-[#2D2D2D] placeholder-[#8C8880] focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'lesson', 'worksheet', 'practice'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${filter === f ? 'bg-teal-600 text-white' : 'bg-white border border-[#E8E4DE] text-[#6B6860] hover:border-[#D4D0CA]'}`}
            >
              {f === 'all' ? 'All' : f === 'lesson' ? 'Lessons' : f === 'worksheet' ? 'Worksheets' : 'Practice ⚡'}
            </button>
          ))}
        </div>
        {filter !== 'worksheet' && levels.length > 1 && (
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8C8880]" />
            <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="bg-white border border-[#E8E4DE] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#2D2D2D] focus:outline-none focus:border-teal-500 appearance-none">
              {levels.map(l => <option key={l} value={l}>{l === 'all' ? 'All Levels' : l}</option>)}
            </select>
          </div>
        )}
      </div>

      {total === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-white border border-[#E8E4DE] rounded-3xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-[#C4C0BA]" />
          </div>
          <h3 className="text-lg font-semibold text-[#2D2D2D] mb-2">{search ? 'No results found' : 'Your library is empty'}</h3>
          <p className="text-sm text-[#6B6860] max-w-xs mx-auto mb-6">
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
          <h2 className="text-sm font-semibold text-[#6B6860] uppercase tracking-wider mb-4">Lessons <span className="text-[#8C8880] font-normal normal-case">({filteredLessons.length})</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLessons.map(lesson => (
              <div key={lesson.id} className="bg-white border border-[#E8E4DE] hover:border-teal-600/50 rounded-2xl p-5 transition-all group">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0"><BookOpen className="w-4 h-4 text-teal-500" /></div>
                  <span className="text-xs font-semibold text-teal-600 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">{lesson.student_level}</span>
                </div>
                <h3 className="font-semibold text-[#2D2D2D] text-sm leading-snug mb-1 line-clamp-2">{lesson.title}</h3>
                <p className="text-xs text-[#6B6860] mb-3 truncate">{lesson.topic} · {lesson.lesson_length}min</p>
                <p className="text-xs text-[#8C8880]">{formatDate(lesson.created_at)}</p>
                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDownloadLesson(lesson)} className="flex items-center gap-1.5 text-xs border border-[#E8E4DE] hover:border-teal-500 hover:text-teal-600 text-[#6B6860] px-3 py-1.5 rounded-lg transition-all">
                    <Download className="w-3 h-3" /> PDF
                  </button>
                  <button onClick={() => deleteLesson(lesson.id)} disabled={deleting === lesson.id} className="flex items-center gap-1.5 text-xs border border-[#E8E4DE] hover:border-red-400 hover:text-red-500 text-[#8C8880] px-3 py-1.5 rounded-lg transition-all ml-auto">
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
          <h2 className="text-sm font-semibold text-[#6B6860] uppercase tracking-wider mb-4">Worksheets <span className="text-[#8C8880] font-normal normal-case">({filteredWorksheets.length})</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorksheets.map(ws => (
              <div key={ws.id} className="bg-white border border-[#E8E4DE] hover:border-blue-600/50 rounded-2xl p-5 transition-all group">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-blue-500" /></div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">Worksheet</span>
                </div>
                <h3 className="font-semibold text-[#2D2D2D] text-sm leading-snug mb-1 line-clamp-2">{ws.title}</h3>
                <p className="text-xs text-[#8C8880] mt-3">{formatDate(ws.created_at)}</p>
                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setViewedWorksheet(ws)} className="flex items-center gap-1.5 text-xs border border-[#E8E4DE] hover:border-teal-500 hover:text-teal-600 text-[#6B6860] px-3 py-1.5 rounded-lg transition-all">
                    <Eye className="w-3 h-3" /> View
                  </button>
                  <button onClick={() => deleteWorksheet(ws.id)} disabled={deleting === ws.id} className="flex items-center gap-1.5 text-xs border border-[#E8E4DE] hover:border-red-400 hover:text-red-500 text-[#8C8880] px-3 py-1.5 rounded-lg transition-all ml-auto">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPractice && filteredPractice.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#6B6860] uppercase tracking-wider mb-4">Practice Sessions <span className="text-[#8C8880] font-normal normal-case">({filteredPractice.length})</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPractice.map(ps => {
              const practiceUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://tyoutorpro.io'}/practice/${ps.share_code}`
              return (
                <div key={ps.id} className="bg-white border border-[#E8E4DE] hover:border-emerald-600/50 rounded-2xl p-5 transition-all group">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0"><Zap className="w-4 h-4 text-emerald-600" /></div>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">{ps.lesson_level}</span>
                  </div>
                  <h3 className="font-semibold text-[#2D2D2D] text-sm leading-snug mb-1 line-clamp-2">{ps.lesson_title}</h3>
                  <p className="text-xs text-[#6B6860] truncate mb-1">{ps.lesson_topic}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#8C8880]">{ps.view_count} views</span>
                    <span className="text-[#C4C0BA]">·</span>
                    <span className="text-xs text-[#8C8880]">{formatDate(ps.created_at)}</span>
                  </div>
                  <div className="mt-2 bg-[#F7F6F2] rounded-lg px-2 py-1.5 text-xs font-mono text-[#6B6860] truncate">
                    /practice/{ps.share_code}
                  </div>
                  <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => copyPracticeLink(ps.share_code)} className="flex items-center gap-1.5 text-xs border border-[#E8E4DE] hover:border-teal-500 hover:text-teal-600 text-[#6B6860] px-3 py-1.5 rounded-lg transition-all">
                      <Link2 className="w-3 h-3" /> Copy Link
                    </button>
                    <button onClick={() => setQrSession(ps)} className="flex items-center gap-1.5 text-xs border border-[#E8E4DE] hover:border-teal-500 hover:text-teal-600 text-[#6B6860] px-3 py-1.5 rounded-lg transition-all">
                      <QrCode className="w-3 h-3" /> QR
                    </button>
                    <button onClick={() => deletePracticeSession(ps.id)} disabled={deleting === ps.id} className="flex items-center gap-1.5 text-xs border border-[#E8E4DE] hover:border-red-400 hover:text-red-500 text-[#8C8880] px-3 py-1.5 rounded-lg transition-all ml-auto">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  {/* suppress unused var warning */}
                  <span className="hidden">{practiceUrl}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrSession && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setQrSession(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#2D2D2D]">QR Code</h2>
              <button onClick={() => setQrSession(null)} className="p-2 text-[#8C8880] hover:text-[#4A473E] rounded-xl hover:bg-[#F0EEE9]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-sm text-[#4A473E] truncate">{qrSession.lesson_title}</div>
            <div className="flex justify-center p-4 bg-white rounded-xl border border-[#E8E4DE]">
              <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : 'https://tyoutorpro.io'}/practice/${qrSession.share_code}`} size={180} fgColor="#2D6A4F" />
            </div>
            <button
              onClick={() => { copyPracticeLink(qrSession.share_code); setQrSession(null) }}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Link2 className="w-4 h-4" /> Copy Link
            </button>
          </div>
        </div>
      )}

      {/* Worksheet Viewer Modal */}
      {viewedWorksheet && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewedWorksheet(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DE] flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-[#2D2D2D]">{viewedWorksheet.title}</h2>
                <p className="text-sm text-[#6B6860]">{viewedWorksheet.content.level} · {viewedWorksheet.content.topic}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDownloadWorksheet(viewedWorksheet)} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <button onClick={() => setViewedWorksheet(null)} className="p-2 text-[#8C8880] hover:text-[#4A473E] rounded-xl hover:bg-[#F0EEE9] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-8">
              <div className="border-b-2 border-[#2D2D2D] pb-4 mb-6">
                <h2 className="text-2xl font-bold text-[#2D2D2D]">{viewedWorksheet.content.title}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-[#6B6860]">
                  <span>Level: {viewedWorksheet.content.level}</span>
                  <span>·</span>
                  <span>Topic: {viewedWorksheet.content.topic}</span>
                </div>
              </div>
              <div className="flex gap-16 mb-6 text-sm text-[#4A473E]">
                <div>Name: <span className="inline-block w-40 border-b border-[#C4C0BA] ml-2">&nbsp;</span></div>
                <div>Date: <span className="inline-block w-32 border-b border-[#C4C0BA] ml-2">&nbsp;</span></div>
              </div>
              <div className="space-y-8">
                {viewedWorksheet.content.exercises.map((ex, i) => (
                  <div key={i}>
                    <div className="bg-[#F0EEE9] rounded-lg px-4 py-2 mb-3">
                      <span className="font-bold text-[#2D2D2D]">Exercise {i + 1}: {ex.type}</span>
                    </div>
                    <p className="text-sm text-[#4A473E] mb-3 italic">{ex.instructions}</p>
                    {ex.matchingPairs && ex.matchingPairs.length > 0 && ex.shuffledRight ? (
                      <>
                        <div className="grid grid-cols-2 gap-x-6">
                          <div className="space-y-2">
                            {ex.matchingPairs.map((pair, j) => (
                              <div key={j} className="text-sm flex items-start gap-2">
                                <span className="font-medium w-5 flex-shrink-0 text-right">{j + 1}.</span>
                                <span>{pair.word}</span>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-2 border-l border-[#E8E4DE] pl-4">
                            {ex.shuffledRight.map((item, j) => (
                              <div key={j} className="text-sm flex items-start gap-2">
                                <span className="font-medium w-5 flex-shrink-0 text-right">{item.letter}.</span>
                                <span className="text-[#4A473E]">{item.definition}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {ex.compactAnswerKey && (
                          <div className="mt-4 pt-3 border-t border-dashed border-[#D4D0CA]">
                            <div className="text-xs font-semibold text-[#6B6860] mb-1">ANSWER KEY</div>
                            <div className="text-xs text-[#4A473E]">{ex.compactAnswerKey}</div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {(ex.items ?? []).map((item, j) => (
                            <div key={j} className="text-sm text-[#2D2D2D]">
                              <span className="font-medium">{j + 1}.</span> {item}
                            </div>
                          ))}
                        </div>
                        {ex.answerKey && ex.answerKey.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-dashed border-[#D4D0CA]">
                            <div className="text-xs font-semibold text-[#6B6860] mb-1">ANSWER KEY</div>
                            <div className="text-xs text-[#4A473E]">
                              {ex.answerKey.map((a, j) => `${j + 1}. ${a}`).join('  |  ')}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {upload.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#2D2D2D]">Upload Lesson PDF</h2>
              <button onClick={() => setUpload(u => ({ ...u, open: false, file: null }))} className="text-[#8C8880] hover:text-[#4A473E]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#F7F6F2] border border-[#E8E4DE] rounded-xl px-4 py-3 flex items-center gap-3">
              <FileText className="w-5 h-5 text-teal-500 flex-shrink-0" />
              <span className="text-sm text-[#4A473E] truncate">{upload.file?.name}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4A473E] mb-1.5">Lesson Title <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={upload.title}
                onChange={e => setUpload(u => ({ ...u, title: e.target.value }))}
                placeholder="e.g. Present Perfect for B2 Adults"
                className="w-full bg-[#F7F6F2] border border-[#E8E4DE] rounded-xl px-4 py-2.5 text-sm text-[#2D2D2D] placeholder-[#8C8880] focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#4A473E] mb-1.5">Subject / Topic</label>
                <input
                  type="text"
                  value={upload.subject}
                  onChange={e => setUpload(u => ({ ...u, subject: e.target.value }))}
                  placeholder="e.g. Grammar"
                  className="w-full bg-[#F7F6F2] border border-[#E8E4DE] rounded-xl px-4 py-2.5 text-sm text-[#2D2D2D] placeholder-[#8C8880] focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4A473E] mb-1.5">Level</label>
                <select
                  value={upload.level}
                  onChange={e => setUpload(u => ({ ...u, level: e.target.value }))}
                  className="w-full bg-[#F7F6F2] border border-[#E8E4DE] rounded-xl px-4 py-2.5 text-sm text-[#2D2D2D] focus:outline-none focus:border-teal-500"
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
                <div className="text-sm font-medium text-[#2D2D2D] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-teal-500" />
                  Share with all Tyoutor Pro users
                </div>
                <p className="text-xs text-[#6B6860] mt-0.5">This lesson will appear in the Shared Resources community library.</p>
              </div>
            </label>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setUpload(u => ({ ...u, open: false, file: null }))}
                className="flex-1 py-2.5 rounded-xl border border-[#E8E4DE] text-sm font-medium text-[#4A473E] hover:bg-[#F7F6F2] transition-colors"
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
