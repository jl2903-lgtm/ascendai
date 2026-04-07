'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lesson, Worksheet } from '@/types'
import { formatDate } from '@/lib/utils'
import { BookOpen, FileText, Search, Trash2, Download, Eye, SlidersHorizontal, BookMarked } from 'lucide-react'
import { generateLessonPDF } from '@/lib/pdf'
import toast from 'react-hot-toast'

type FilterType = 'all' | 'lesson' | 'worksheet'

export default function SavedPage() {
  const supabase = createClient()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [worksheets, setWorksheets] = useState<Worksheet[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [deleting, setDeleting] = useState<string | null>(null)

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

  const levels = ['all', ...Array.from(new Set(lessons.map(l => l.student_level)))]

  const filteredLessons = lessons.filter(l => {
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase()) || l.topic.toLowerCase().includes(search.toLowerCase())
    const matchLevel = levelFilter === 'all' || l.student_level === levelFilter
    return matchSearch && matchLevel
  })

  const filteredWorksheets = worksheets.filter(w => {
    return w.title.toLowerCase().includes(search.toLowerCase())
  })

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
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-600/15 border border-slate-600/30 rounded-xl flex items-center justify-center">
          <BookMarked className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">Saved Library</h1>
          <p className="text-sm text-[#94A3B8]">{lessons.length} lessons · {worksheets.length} worksheets</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search lessons and worksheets..."
            className="w-full bg-[#1E293B] border border-[#334155] rounded-xl pl-11 pr-4 py-3 text-sm text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'lesson', 'worksheet'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${filter === f ? 'bg-teal-600 text-white' : 'bg-[#1E293B] border border-[#334155] text-[#94A3B8] hover:border-[#475569]'}`}
            >
              {f === 'all' ? 'All' : f === 'lesson' ? 'Lessons' : 'Worksheets'}
            </button>
          ))}
        </div>
        {filter !== 'worksheet' && levels.length > 1 && (
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#475569]" />
            <select
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value)}
              className="bg-[#1E293B] border border-[#334155] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#F8FAFC] focus:outline-none focus:border-teal-500 appearance-none"
            >
              {levels.map(l => <option key={l} value={l}>{l === 'all' ? 'All Levels' : l}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Empty state */}
      {total === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-[#1E293B] border border-[#334155] rounded-3xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-[#334155]" />
          </div>
          <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">
            {search ? 'No results found' : 'Your library is empty'}
          </h3>
          <p className="text-sm text-[#94A3B8] max-w-xs mx-auto mb-6">
            {search ? 'Try a different search term.' : 'Generate your first lesson or worksheet and save it to build your personal library.'}
          </p>
          {!search && (
            <a href="/dashboard/lesson-generator" className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
              <BookOpen className="w-4 h-4" />
              Generate First Lesson
            </a>
          )}
        </div>
      )}

      {/* Lessons grid */}
      {showLessons && filteredLessons.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider mb-4">
            Lessons <span className="text-[#475569] font-normal normal-case">({filteredLessons.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLessons.map(lesson => (
              <div key={lesson.id} className="bg-[#1E293B] border border-[#334155] hover:border-teal-600/50 rounded-2xl p-5 transition-all group">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-8 h-8 bg-teal-600/15 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-teal-400" />
                  </div>
                  <span className="text-xs font-semibold text-teal-400 bg-teal-600/10 border border-teal-600/20 px-2 py-0.5 rounded-full">
                    {lesson.student_level}
                  </span>
                </div>
                <h3 className="font-semibold text-[#F8FAFC] text-sm leading-snug mb-1 line-clamp-2">{lesson.title}</h3>
                <p className="text-xs text-[#94A3B8] mb-3 truncate">{lesson.topic} · {lesson.lesson_length}min</p>
                <p className="text-xs text-[#475569]">{formatDate(lesson.created_at)}</p>
                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDownloadLesson(lesson)}
                    className="flex items-center gap-1.5 text-xs border border-[#334155] hover:border-teal-500 text-[#94A3B8] hover:text-white px-3 py-1.5 rounded-lg transition-all"
                  >
                    <Download className="w-3 h-3" /> PDF
                  </button>
                  <button
                    onClick={() => deleteLesson(lesson.id)}
                    disabled={deleting === lesson.id}
                    className="flex items-center gap-1.5 text-xs border border-[#334155] hover:border-red-500 text-[#94A3B8] hover:text-red-400 px-3 py-1.5 rounded-lg transition-all ml-auto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Worksheets grid */}
      {showWorksheets && filteredWorksheets.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider mb-4">
            Worksheets <span className="text-[#475569] font-normal normal-case">({filteredWorksheets.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorksheets.map(ws => (
              <div key={ws.id} className="bg-[#1E293B] border border-[#334155] hover:border-blue-600/50 rounded-2xl p-5 transition-all group">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-600/15 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-xs font-semibold text-blue-400 bg-blue-600/10 border border-blue-600/20 px-2 py-0.5 rounded-full">
                    Worksheet
                  </span>
                </div>
                <h3 className="font-semibold text-[#F8FAFC] text-sm leading-snug mb-1 line-clamp-2">{ws.title}</h3>
                <p className="text-xs text-[#475569] mt-3">{formatDate(ws.created_at)}</p>
                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="flex items-center gap-1.5 text-xs border border-[#334155] hover:border-teal-500 text-[#94A3B8] hover:text-white px-3 py-1.5 rounded-lg transition-all">
                    <Eye className="w-3 h-3" /> View
                  </button>
                  <button
                    onClick={() => deleteWorksheet(ws.id)}
                    disabled={deleting === ws.id}
                    className="flex items-center gap-1.5 text-xs border border-[#334155] hover:border-red-500 text-[#94A3B8] hover:text-red-400 px-3 py-1.5 rounded-lg transition-all ml-auto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
