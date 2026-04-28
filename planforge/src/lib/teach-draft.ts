// Stash an unsaved (in-memory) lesson so the Teach Mode runner at
// /lessons/draft/teach can pick it up. Used when a teacher generates a lesson
// and clicks "Teach this lesson" without first saving (e.g. free tier users).
//
// We deliberately use sessionStorage rather than the URL: activity payloads
// can be tens of kB and exceed querystring limits, and we don't want the data
// surviving a tab close.

import type { Activity } from './activities/schema'

const KEY = 'tyoutorpro:teach-draft'

export interface TeachDraft {
  title: string
  activities: Activity[]
  level?: string
  topic?: string
}

export function stashDraftLesson(draft: TeachDraft): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft))
  } catch {
    // Quota exceeded or storage disabled — caller should fall back gracefully.
  }
}

export function readDraftLesson(): TeachDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as TeachDraft
  } catch {
    return null
  }
}

export function clearDraftLesson(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(KEY)
}
