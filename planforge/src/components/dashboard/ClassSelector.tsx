'use client'

import { useState, useEffect } from 'react'
import { ClassProfile } from '@/types'
import { Users, ChevronDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ClassSelectorProps {
  onClassSelected: (profile: ClassProfile | null) => void
  selectedId?: string | null
}

export function ClassSelector({ onClassSelected, selectedId }: ClassSelectorProps) {
  const [classes, setClasses] = useState<ClassProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<ClassProfile | null>(null)

  useEffect(() => {
    fetch('/api/class-profiles')
      .then(r => r.json())
      .then(data => {
        const list: ClassProfile[] = Array.isArray(data) ? data : []
        setClasses(list)
        if (selectedId) {
          const found = list.find(p => p.id === selectedId) ?? null
          setSelected(found)
          onClassSelected(found)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSelect = (profile: ClassProfile | null) => {
    setSelected(profile)
    onClassSelected(profile)
    setOpen(false)
  }

  if (loading) {
    return (
      <div className="h-10 bg-[#F0EEE9] rounded-xl animate-pulse w-56" />
    )
  }

  if (classes.length === 0) {
    return (
      <Link
        href="/dashboard/classes"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-[#D4D0CA] text-sm text-[#6B6860] hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50/30 transition-all font-semibold"
      >
        <Plus className="w-4 h-4" />
        Set up a class profile
      </Link>
    )
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all',
          selected
            ? 'border-teal-500 bg-teal-50 text-teal-700 hover:bg-teal-100'
            : 'border-[#E8E4DE] bg-white text-[#6B6860] hover:border-teal-400 hover:text-teal-600'
        )}
      >
        <Users className="w-4 h-4 flex-shrink-0" />
        <span className="max-w-[160px] truncate">
          {selected ? selected.class_name : 'Select class'}
        </span>
        <ChevronDown className={cn('w-4 h-4 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-[#E8E4DE] rounded-xl shadow-lg min-w-[220px] py-1 overflow-hidden">
            {selected && (
              <button
                onClick={() => handleSelect(null)}
                className="w-full px-4 py-2.5 text-left text-sm text-[#6B6860] hover:bg-[#F4F2EE] transition-colors font-medium"
              >
                Clear selection
              </button>
            )}
            {classes.map(profile => (
              <button
                key={profile.id}
                onClick={() => handleSelect(profile)}
                className={cn(
                  'w-full px-4 py-2.5 text-left transition-colors',
                  selected?.id === profile.id
                    ? 'bg-teal-50 text-teal-700'
                    : 'hover:bg-[#F4F2EE] text-[#4A473E]'
                )}
              >
                <div className="text-sm font-semibold truncate">{profile.class_name}</div>
                <div className="text-xs text-[#8C8880] font-medium mt-0.5">{profile.cefr_level} · {profile.course_type}</div>
              </button>
            ))}
            <div className="border-t border-[#EDEBE8] mt-1 pt-1">
              <Link
                href="/dashboard/classes"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-teal-600 hover:bg-teal-50 transition-colors font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                Manage classes
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
