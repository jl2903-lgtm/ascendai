// Per-activity timing estimates for the scrollable preview total. These are
// rough — meant for "this lesson is ~60 minutes long" reassurance, not precise
// scheduling. Values are minutes.

import type { Activity } from './activities/schema'

export const ACTIVITY_DURATION_MIN: Record<Activity['type'], { min: number; max: number }> = {
  reading_passage:      { min: 5, max: 8 },
  multiple_choice:      { min: 1, max: 2 }, // each MCQ activity = one question
  gap_fill:             { min: 4, max: 6 },
  discussion_questions: { min: 5, max: 10 },
  writing_task:         { min: 8, max: 12 },
  vocab_presentation:   { min: 5, max: 8 },
  grammar_explanation:  { min: 4, max: 7 },
  image_prompt:         { min: 3, max: 5 },
}

export function estimateActivityRange(a: Activity): { min: number; max: number } {
  return ACTIVITY_DURATION_MIN[a.type]
}

export function estimateActivityLabel(a: Activity): string {
  const { min, max } = estimateActivityRange(a)
  return min === max ? `~${min} min` : `${min}–${max} min`
}

export function totalLessonRange(activities: Activity[]): { min: number; max: number } {
  return activities.reduce(
    (acc, a) => {
      const r = estimateActivityRange(a)
      return { min: acc.min + r.min, max: acc.max + r.max }
    },
    { min: 0, max: 0 },
  )
}
