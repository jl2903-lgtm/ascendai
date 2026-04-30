// Seeded Fisher-Yates shuffle. Used to randomize multiple_choice option order
// per lesson, deterministically by lesson id, so the rehearsal view and the
// live teach view show the same MCQ ordering.
//
// Why deterministic? Teachers will rehearse a lesson, then teach it. They
// memorize the answers ("the correct one is the third option"). If the order
// changed between rehearsal and live, that mental shortcut would mis-fire.

import type { Activity } from './schema'

// xmur3 → mulberry32: tiny string-seeded PRNG suitable for non-crypto use.
// Deterministic for the same seed; cheap; no dependency.
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedFromString(s: string): number {
  let h = 1779033703 ^ s.length
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

function fisherYates<T>(arr: T[], rng: () => number): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// For every multiple_choice activity, shuffle its options array and remap
// correct_index to wherever the original correct option ended up. Mutates
// nothing; returns a new array. Other activity types pass through unchanged.
//
// Each MCQ uses its own seed (lessonId + activityId) so the shuffle is
// stable across reloads but distinct per question — the same question won't
// always end up with the answer at the same position across lessons.
export function shuffleMcqOptions(activities: Activity[], lessonId: string): Activity[] {
  return activities.map(a => {
    if (a.type !== 'multiple_choice') return a
    const seed = seedFromString(`${lessonId}:${a.id}`)
    const rng = mulberry32(seed)
    const correctOption = a.options[a.correct_index]
    const shuffled = fisherYates(a.options, rng)
    const newIndex = shuffled.indexOf(correctOption)
    if (newIndex < 0) {
      // Defensive: shouldn't happen, but if the original correct_index was
      // out of range the option won't be found. Keep the original ordering.
      return a
    }
    return { ...a, options: shuffled, correct_index: newIndex }
  })
}
