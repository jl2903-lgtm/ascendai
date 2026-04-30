// Resolves activity image_query → image_url via Unsplash search. Run as a
// post-processing step after the model returns activities; never block the
// whole lesson generation on Unsplash availability.
//
// Setup: free Unsplash Access Key from https://unsplash.com/developers, set
// UNSPLASH_ACCESS_KEY in .env.local and Vercel env vars. Without the key,
// images stay null — the frontend renders a clean placeholder.

import type { Activity } from './schema'

const ENDPOINT = 'https://api.unsplash.com/search/photos'
const TIMEOUT_MS = 5_000

// Activity types that carry imagery. Used to decide which activities to run
// the Unsplash lookup for.
type WithImage = Extract<Activity, { image_url?: string | null }>

// Pull the most relevant text out of an activity for the Unsplash query.
// Falls back through image_query → title → topic-ish text in that order.
function pickQuery(a: Activity): string | null {
  if ('image_query' in a && a.image_query && a.image_query.trim().length > 0) {
    return a.image_query.trim()
  }
  switch (a.type) {
    case 'reading_passage':       return a.title
    case 'discussion_questions':  return a.title
    case 'image_prompt':          return a.prompt.split('.')[0] // first sentence
    default:                      return null
  }
}

async function fetchOne(query: string, accessKey: string): Promise<string | null> {
  const url = `${ENDPOINT}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${encodeURIComponent(accessKey)}`
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'Accept-Version': 'v1' } })
    if (!res.ok) return null
    const data = await res.json() as { results?: Array<{ urls?: { regular?: string } }> }
    return data.results?.[0]?.urls?.regular ?? null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// Run all lookups in parallel. Each one is independently best-effort —
// failures or timeouts don't break siblings or the rest of the pipeline.
export async function resolveActivityImages(activities: Activity[]): Promise<Activity[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    // No key configured. Leave image_url as the model wrote it (probably
    // hallucinated, so we proactively null it out for activities that have
    // image_query — preserving any pre-3.1 data on activities that don't).
    return activities.map(a => {
      if ('image_query' in a && a.image_query) {
        return { ...a, image_url: null } as Activity
      }
      return a
    })
  }

  const enriched = await Promise.all(activities.map(async a => {
    if (!('image_url' in a)) return a
    const query = pickQuery(a)
    if (!query) return { ...a, image_url: null } as Activity
    const url = await fetchOne(query, accessKey)
    return { ...a, image_url: url } as Activity
  }))
  return enriched
}

// Exposed so the frontend can hide / placeholder cleanly.
export const HAS_IMAGE_FIELD: Activity['type'][] = [
  'reading_passage',
  'discussion_questions',
  'image_prompt',
]

export type _UseWithImage = WithImage
