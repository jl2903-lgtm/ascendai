'use client'

import { useState, useEffect } from 'react'
import { ClassProfile } from '@/types'
import { Users, Plus, Edit2, Trash2, Zap, BookOpen, BarChart2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn, NATIONALITIES, AGE_GROUPS } from '@/lib/utils'

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const COURSE_TYPES = ['General English', 'Business English', 'Exam Preparation', 'Conversation', 'Academic English', 'Young Learners', 'One-to-one', 'Online']
const WEAK_AREAS_OPTIONS = ['Grammar accuracy', 'Vocabulary range', 'Pronunciation', 'Reading comprehension', 'Listening skills', 'Writing fluency', 'Speaking confidence', 'Exam technique']
const FOCUS_SKILLS_OPTIONS = ['Speaking', 'Listening', 'Reading', 'Writing', 'Grammar', 'Vocabulary', 'Pronunciation', 'Exam prep']

interface ClassFormData {
  class_name: string
  student_nationality: string
  student_age_group: string
  class_size: number
  cefr_level: string
  course_type: string
  textbook: string
  weak_areas: string[]
  focus_skills: string[]
  additional_notes: string
}

const defaultForm: ClassFormData = {
  class_name: '',
  student_nationality: 'Chinese (Mandarin)',
  student_age_group: 'Adults',
  class_size: 15,
  cefr_level: 'B1',
  course_type: 'General English',
  textbook: '',
  weak_areas: [],
  focus_skills: [],
  additional_notes: '',
}

function ClassCard({ profile, onEdit, onDelete }: { profile: ClassProfile; onEdit: () => void; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Delete "${profile.class_name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/class-profiles/${profile.id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Failed to delete class.'); return }
      onDelete()
      toast.success('Class deleted.')
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white border border-[#E8E4DE] rounded-2xl p-5 hover:border-teal-300 hover:shadow-md transition-all group card-lift">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="font-bold text-[#2D2D2D] text-base">{profile.class_name}</h3>
            <p className="text-xs text-[#6B6860] font-medium">{profile.course_type}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8C8880] hover:text-teal-600 hover:bg-teal-50 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8C8880] hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="tag-teal">{profile.cefr_level}</span>
        <span className="px-2.5 py-0.5 rounded-full bg-[#F0EEE9] text-[#4A473E] text-xs font-semibold border border-[#E8E4DE]">{profile.student_age_group}</span>
        <span className="px-2.5 py-0.5 rounded-full bg-[#F0EEE9] text-[#4A473E] text-xs font-semibold border border-[#E8E4DE]">{profile.class_size} students</span>
      </div>

      <div className="flex items-center gap-2 text-xs text-[#8C8880] font-medium">
        <BookOpen className="w-3.5 h-3.5" />
        <span className="truncate">{profile.student_nationality}</span>
      </div>

      {profile.weak_areas.length > 0 && (
        <div className="mt-3 flex items-start gap-2">
          <BarChart2 className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[#6B6860] leading-relaxed">{profile.weak_areas.slice(0, 3).join(', ')}{profile.weak_areas.length > 3 ? ` +${profile.weak_areas.length - 3} more` : ''}</p>
        </div>
      )}
    </div>
  )
}

function ClassModal({
  isOpen, onClose, initial, onSaved,
}: {
  isOpen: boolean
  onClose: () => void
  initial?: ClassProfile | null
  onSaved: (profile: ClassProfile) => void
}) {
  const [form, setForm] = useState<ClassFormData>(defaultForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initial) {
      setForm({
        class_name: initial.class_name,
        student_nationality: initial.student_nationality,
        student_age_group: initial.student_age_group,
        class_size: initial.class_size,
        cefr_level: initial.cefr_level,
        course_type: initial.course_type,
        textbook: initial.textbook ?? '',
        weak_areas: initial.weak_areas,
        focus_skills: initial.focus_skills,
        additional_notes: initial.additional_notes ?? '',
      })
    } else {
      setForm(defaultForm)
    }
  }, [initial, isOpen])

  const toggleChip = (field: 'weak_areas' | 'focus_skills', value: string) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value) ? f[field].filter(v => v !== value) : [...f[field], value],
    }))
  }

  const handleSave = async () => {
    if (!form.class_name.trim()) { toast.error('Class name is required.'); return }
    setSaving(true)
    try {
      const payload = { ...form, class_size: Number(form.class_size), textbook: form.textbook.trim() || null, additional_notes: form.additional_notes.trim() || null }
      const url = initial ? `/api/class-profiles/${initial.id}` : '/api/class-profiles'
      const method = initial ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to save.'); return }
      onSaved(data)
      toast.success(initial ? 'Class updated!' : 'Class created!')
      onClose()
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white border border-[#E8E4DE] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#E8E4DE] px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#2D2D2D]">{initial ? 'Edit Class' : 'New Class'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8C8880] hover:text-[#4A473E] hover:bg-[#F7F6F2] transition-colors text-xl font-light">×</button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-[#4A473E] mb-2">Class Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.class_name}
              onChange={e => setForm(f => ({ ...f, class_name: e.target.value }))}
              placeholder='e.g. "Tuesday B2 Adults"'
              className="w-full bg-[#F7F6F2] border border-[#E8E4DE] rounded-xl px-4 py-2.5 text-sm text-[#2D2D2D] placeholder-[#8C8880] focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#4A473E] mb-2">Nationality / L1</label>
            <select value={form.student_nationality} onChange={e => setForm(f => ({ ...f, student_nationality: e.target.value }))} className="w-full bg-[#F7F6F2] border border-[#E8E4DE] rounded-xl px-4 py-2.5 text-sm text-[#2D2D2D] focus:outline-none focus:border-teal-500">
              {NATIONALITIES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-[#4A473E] mb-2">Age Group</label>
              <select value={form.student_age_group} onChange={e => setForm(f => ({ ...f, student_age_group: e.target.value }))} className="w-full bg-[#F7F6F2] border border-[#E8E4DE] rounded-xl px-4 py-2.5 text-sm text-[#2D2D2D] focus:outline-none focus:border-teal-500">
                {AGE_GROUPS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[#4A473E] mb-2">CEFR Level</label>
              <select value={form.cefr_level} onChange={e => setForm(f => ({ ...f, cefr_level: e.target.value }))} className="w-full bg-[#F7F6F2] border border-[#E8E4DE] rounded-xl px-4 py-2.5 text-sm text-[#2D2D2D] focus:outline-none focus:border-teal-500">
                {CEFR_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-[#4A473E] mb-2">Class Size</label>
              <input type="number" min={1} max={50} value={form.class_size} onChange={e => setForm(f => ({ ...f, class_size: Number(e.target.value) }))} className="w-full bg-[#F7F6F2] border border-[#E8E4DE] rounded-xl px-4 py-2.5 text-sm text-[#2D2D2D] focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#4A473E] mb-2">Course Type</label>
              <select value={form.course_type} onChange={e => setForm(f => ({ ...f, course_type: e.target.value }))} className="w-full bg-[#F7F6F2] border border-[#E8E4DE] rounded-xl px-4 py-2.5 text-sm text-[#2D2D2D] focus:outline-none focus:border-teal-500">
                {COURSE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#4A473E] mb-2">Textbook <span className="text-[#8C8880] font-normal">(optional)</span></label>
            <input type="text" value={form.textbook} onChange={e => setForm(f => ({ ...f, textbook: e.target.value }))} placeholder="e.g. New English File B2" className="w-full bg-[#F7F6F2] border border-[#E8E4DE] rounded-xl px-4 py-2.5 text-sm text-[#2D2D2D] placeholder-[#8C8880] focus:outline-none focus:border-teal-500" />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#4A473E] mb-2">Weak Areas</label>
            <div className="flex flex-wrap gap-2">
              {WEAK_AREAS_OPTIONS.map(a => (
                <button key={a} onClick={() => toggleChip('weak_areas', a)} className={cn('px-3 py-1.5 rounded-full border text-xs font-semibold transition-all', form.weak_areas.includes(a) ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-[#E8E4DE] text-[#4A473E] hover:border-[#D4D0CA]')}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#4A473E] mb-2">Focus Skills</label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_SKILLS_OPTIONS.map(s => (
                <button key={s} onClick={() => toggleChip('focus_skills', s)} className={cn('px-3 py-1.5 rounded-full border text-xs font-semibold transition-all', form.focus_skills.includes(s) ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-[#E8E4DE] text-[#4A473E] hover:border-[#D4D0CA]')}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#4A473E] mb-2">Additional Notes <span className="text-[#8C8880] font-normal">(optional)</span></label>
            <textarea value={form.additional_notes} onChange={e => setForm(f => ({ ...f, additional_notes: e.target.value }))} rows={2} placeholder="Any other context — e.g. exam in June, mixed abilities, shy class..." className="w-full bg-[#F7F6F2] border border-[#E8E4DE] rounded-xl px-4 py-2.5 text-sm text-[#2D2D2D] placeholder-[#8C8880] focus:outline-none focus:border-teal-500 resize-none" />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[#E8E4DE] px-6 py-4 rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-[#E8E4DE] text-sm font-semibold text-[#4A473E] hover:bg-[#F7F6F2] transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-sm transition-all">
            {saving ? 'Saving...' : (initial ? 'Save Changes' : 'Create Class')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ClassProfile | null>(null)

  useEffect(() => {
    fetch('/api/class-profiles')
      .then(r => r.json())
      .then(data => { setClasses(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const openNew = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (p: ClassProfile) => { setEditing(p); setModalOpen(true) }
  const handleSaved = (profile: ClassProfile) => {
    setClasses(prev => {
      const idx = prev.findIndex(p => p.id === profile.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = profile; return next }
      return [profile, ...prev]
    })
  }
  const handleDeleted = (id: string) => setClasses(prev => prev.filter(p => p.id !== id))

  return (
    <div className="relative isolate max-w-5xl mx-auto space-y-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dot-pattern" style={{ zIndex: -1 }} />
      <div aria-hidden style={{ position:'absolute',width:350,height:350,top:-80,right:-80,borderRadius:'50%',filter:'blur(80px)',background:'radial-gradient(ellipse,#D4E8D0,#A7C4A0)',opacity:0.16,pointerEvents:'none',zIndex:-1,animation:'blobFloat 8s ease-in-out 0s infinite alternate' }} />
      <div aria-hidden style={{ position:'absolute',width:280,height:280,bottom:60,left:-60,borderRadius:'50%',filter:'blur(80px)',background:'radial-gradient(ellipse,#FFE5D9,#FECDA6)',opacity:0.13,pointerEvents:'none',zIndex:-1,animation:'blobFloat 8s ease-in-out 3s infinite alternate' }} />
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#2D2D2D]">My Classes</h1>
            <p className="text-sm text-[#6B6860]">Set up class profiles once — every tool auto-tailors to them.</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Class
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-[#E8E4DE] rounded-2xl p-5 animate-pulse h-40" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white border border-[#E8E4DE] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-teal-600/50" />
          </div>
          <h3 className="text-lg font-bold text-[#2D2D2D] mb-2">No classes yet</h3>
          <p className="text-sm text-[#6B6860] max-w-xs mx-auto mb-6">Create your first class profile to auto-fill every tool with the right context.</p>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all text-sm"
          >
            <Zap className="w-4 h-4" />
            Create first class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(profile => (
            <ClassCard
              key={profile.id}
              profile={profile}
              onEdit={() => openEdit(profile)}
              onDelete={() => handleDeleted(profile.id)}
            />
          ))}
          <button
            onClick={openNew}
            className="bg-white border-2 border-dashed border-[#E8E4DE] rounded-2xl p-5 hover:border-teal-400 hover:bg-teal-50/30 transition-all flex flex-col items-center justify-center gap-2 text-[#8C8880] hover:text-teal-600 min-h-[160px]"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-semibold">Add another class</span>
          </button>
        </div>
      )}

      <ClassModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        initial={editing}
        onSaved={handleSaved}
      />
    </div>
  )
}
