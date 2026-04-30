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

// Activity types that carry imagery — driven by schema, not by inspecting
// the live activity object. The previous version checked `'image_url' in a`
// which returns false now that the model writes only image_query (the
// post-processor writes image_url). Result was that every image lookup was
// skipped silently.
const TYPES_WITH_IMAGES = new Set<Activity['type']>([
  'reading_passage',
  'discussion_questions',
  'image_prompt',
])

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

// [IMG-DEBUG] Optional logging context. Threaded through so each Unsplash
// request/response can be tagged with the lesson id and request id without
// changing the function's behavior.
export interface ImgDebugCtx {
  lessonId: string
  requestId: string
}

async function fetchOne(
  query: string,
  accessKey: string,
  debug?: { ctx?: ImgDebugCtx; activityIndex: number; activityId: string; activityType: string },
): Promise<string | null> {
  const url = `${ENDPOINT}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${encodeURIComponent(accessKey)}`
  // [IMG-DEBUG] Layer 3: pre-request log (key REDACTED).
  const redactedUrl = url.replace(/client_id=[^&]+/, 'client_id=REDACTED')
  const tStart = Date.now()
  console.log('[IMG-DEBUG] unsplash request', {
    ...(debug?.ctx ?? {}),
    activityIndex: debug?.activityIndex,
    activityId: debug?.activityId,
    activityType: debug?.activityType,
    query,
    url: redactedUrl,
  })
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'Accept-Version': 'v1' } })
    const tEnd = Date.now()
    if (!res.ok) {
      let body = ''
      try { body = (await res.text()).slice(0, 500) } catch { body = '<failed to read body>' }
      // [IMG-DEBUG] Layer 3: non-2xx response.
      console.error('[IMG-DEBUG] unsplash response (error)', {
        ...(debug?.ctx ?? {}),
        activityIndex: debug?.activityIndex,
        query,
        status: res.status,
        durationMs: tEnd - tStart,
        body,
      })
      return null
    }
    const data = await res.json() as { results?: Array<{ urls?: { regular?: string } }>; total?: number }
    const firstUrl = data.results?.[0]?.urls?.regular ?? null
    // [IMG-DEBUG] Layer 3: 2xx response details.
    console.log('[IMG-DEBUG] unsplash response (ok)', {
      ...(debug?.ctx ?? {}),
      activityIndex: debug?.activityIndex,
      query,
      status: res.status,
      total: data.total ?? null,
      resultsCount: data.results?.length ?? 0,
      firstUrl: firstUrl ?? 'none',
      durationMs: tEnd - tStart,
    })
    return firstUrl
  } catch (err) {
    const tEnd = Date.now()
    // [IMG-DEBUG] Layer 3: thrown / aborted / network error.
    const e = err as Error
    console.error('[IMG-DEBUG] unsplash fetch threw', {
      ...(debug?.ctx ?? {}),
      activityIndex: debug?.activityIndex,
      query,
      name: e?.name,
      message: e?.message,
      stack: e?.stack,
      durationMs: tEnd - tStart,
    })
    return null
  } finally {
    clearTimeout(timer)
  }
}

// Run all lookups in parallel. Each one is independently best-effort —
// failures or timeouts don't break siblings or the rest of the pipeline.
export async function resolveActivityImages(
  activities: Activity[],
  ctx?: ImgDebugCtx,
): Promise<Activity[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  // [IMG-DEBUG] Layer 1 echo from the post-processor's perspective. The route
  // already logs Layer 1 once per request; this confirms the key reached
  // *this* module too (different process? bundled? edge runtime?).
  console.log('[IMG-DEBUG] resolveActivityImages invoked', {
    ...(ctx ?? {}),
    keyExists: !!accessKey,
    keyLength: accessKey ? accessKey.length : 0,
    activitiesTotal: activities.length,
    imageBearingTypes: activities.filter(a => TYPES_WITH_IMAGES.has(a.type)).length,
  })

  if (!accessKey) {
    // [IMG-DEBUG] Layer 4: skip path because no key. Per-activity reason.
    return activities.map((a, i) => {
      if (TYPES_WITH_IMAGES.has(a.type)) {
        console.log('[IMG-DEBUG] post-process activity', {
          ...(ctx ?? {}),
          activityIndex: i,
          activityId: a.id,
          type: a.type,
          image_query: 'image_query' in a ? a.image_query : 'MISSING',
          image_url_assigned: null,
          reason: 'no UNSPLASH_ACCESS_KEY',
        })
      }
      if ('image_query' in a && a.image_query) {
        return { ...a, image_url: null } as Activity
      }
      return a
    })
  }

  // Run lookups in parallel for every image-bearing activity type. Failures
  // are independently handled so one bad query doesn't break siblings.
  const enriched = await Promise.all(activities.map(async (a, i) => {
    if (!TYPES_WITH_IMAGES.has(a.type)) return a
    const query = pickQuery(a)
    if (!query) {
      console.log('[IMG-DEBUG] post-process activity', {
        ...(ctx ?? {}),
        activityIndex: i,
        activityId: a.id,
        type: a.type,
        image_query: 'MISSING',
        image_url_assigned: null,
        reason: 'pickQuery returned null',
      })
      return { ...a, image_url: null } as Activity
    }
    const url = await fetchOne(query, accessKey, {
      ctx,
      activityIndex: i,
      activityId: a.id,
      activityType: a.type,
    })
    // [IMG-DEBUG] Layer 4: per-activity assignment, post-fetch.
    console.log('[IMG-DEBUG] post-process activity', {
      ...(ctx ?? {}),
      activityIndex: i,
      activityId: a.id,
      type: a.type,
      image_query: query,
      image_url_assigned: url,
      reason: url == null ? 'unsplash returned null' : 'ok',
    })
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
