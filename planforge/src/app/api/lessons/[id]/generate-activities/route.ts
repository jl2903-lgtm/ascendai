import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { checkRateLimit } from '@/lib/rate-limit'
import { generateActivitiesRaw } from '@/lib/activities/generate'
import { resolveActivityImages } from '@/lib/activities/unsplash'
import { shuffleMcqOptions } from '@/lib/activities/shuffle'
import {
  ActivitiesSchema,
  generateActivityId,
  normalizeActivityTypes,
  type Activity,
} from '@/lib/activities/schema'
import type { LessonFormData, LessonContent } from '@/types'

// Stage 2: on-demand activity generation. The lesson view's "Teach this
// lesson" button hits this endpoint when activities aren't ready yet. We mark
// the row as `generating` so a refresh during the wait correctly resumes the
// polling screen, then run the structured-output call against the existing
// plan, then mark `ready` (or `failed` with a stored error message).
//
// IMPORTANT: this is a long-running synchronous endpoint (~60–90s on average).
// On Vercel Hobby (10s timeout) it WILL fail. Confirm Pro (60s) or higher in
// the project's Vercel settings.
export const maxDuration = 300 // 5 min cap; honored on Vercel Pro+ tiers.

const FRIENDLY_ERROR = "We couldn't build the activities. Please try again — if this keeps happening, contact support."

// v3.2 pipeline (parallelized + MCQ shuffle):
//   1. generateActivitiesRaw → two model calls in parallel (first half +
//      second half), concatenate
//   2. normalizeActivityTypes → snake_case + drop unknowns
//   3. resolveActivityImages → Unsplash lookups in parallel for every
//      image-bearing activity
//   4. shuffleMcqOptions → seeded Fisher-Yates so MCQ correct answers land
//      at varied positions; deterministic per (lessonId, activityId)
//   5. ActivitiesSchema.parse → Zod validation
//
// Timing logs at every step land in Vercel logs tagged with the requestId
// so we can quickly tell where slow generations are spending their seconds.
async function runPipeline(opts: {
  lessonId: string
  formData: LessonFormData
  plan: LessonContent
  retryHint?: string
  requestId: string
}): Promise<{ activities: Activity[]; droppedTypes: string[]; timings: Record<string, number> }> {
  const t0 = Date.now()
  const raw = await generateActivitiesRaw(opts.formData, null, opts.plan, opts.retryHint)
  const tGen = Date.now()

  // [IMG-DEBUG] Layer 2: raw model output, per activity. Reports whether
  // the model produced image_query and whether it produced image_url
  // (it shouldn't — only image_query is asked for in v3.1+).
  raw.forEach((a: any, i: number) => {
    const t = a?.type
    if (t === 'reading_passage' || t === 'discussion_questions' || t === 'image_prompt') {
      console.log('[IMG-DEBUG] model output', {
        lessonId: opts.lessonId,
        requestId: opts.requestId,
        activityIndex: i,
        type: t,
        hasImageQuery: typeof a?.image_query === 'string' && a.image_query.length > 0,
        imageQueryValue: typeof a?.image_query === 'string' ? a.image_query : 'MISSING',
        hasImageUrlField: 'image_url' in (a ?? {}),
        imageUrlValue: 'image_url' in (a ?? {}) ? a.image_url : 'MISSING',
      })
    }
  })

  const { activities: normalized, droppedTypes } = normalizeActivityTypes(raw)
  const withIds = normalized.map((a: any) => {
    if (a && typeof a === 'object' && (!a.id || typeof a.id !== 'string')) {
      return { ...a, id: generateActivityId() }
    }
    return a
  })
  const tNormalize = Date.now()

  // Unsplash lookups already run in parallel inside resolveActivityImages.
  // Pass debug context so the helper can emit Layer 3/4 logs with lesson tags.
  const withImages = await resolveActivityImages(withIds as Activity[], {
    lessonId: opts.lessonId,
    requestId: opts.requestId,
  })
  const tImages = Date.now()

  // [IMG-DEBUG] Layer 4 (post-process visibility from caller side): final
  // image_url assigned to each activity after the Unsplash step, before any
  // further mutation. Pairs with Layer 5 to detect mid-pipeline drops.
  withImages.forEach((a: any, i: number) => {
    const t = a?.type
    if (t === 'reading_passage' || t === 'discussion_questions' || t === 'image_prompt') {
      console.log('[IMG-DEBUG] post-unsplash on activity', {
        lessonId: opts.lessonId,
        requestId: opts.requestId,
        activityIndex: i,
        type: t,
        image_query: a?.image_query ?? 'MISSING',
        image_url: a?.image_url ?? null,
      })
    }
  })

  // Validate before shuffling — shuffleMcqOptions needs a typed Activity[].
  const validated = ActivitiesSchema.parse(withImages)
  const tValidate = Date.now()

  const activities = shuffleMcqOptions(validated, opts.lessonId)
  const tShuffle = Date.now()

  const timings = {
    generationMs: tGen - t0,
    normalizeMs: tNormalize - tGen,
    unsplashMs: tImages - tNormalize,
    validateMs: tValidate - tImages,
    shuffleMs: tShuffle - tValidate,
    pipelineTotalMs: tShuffle - t0,
  }
  console.log('[generate-activities] pipeline timings', { requestId: opts.requestId, ...timings })

  return { activities, droppedTypes, timings }
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  // requestId returned to the client and printed in every server log line so
  // a user-reported "Error reference: …" can be greped against Vercel logs.
  const requestId = generateActivityId().replace(/^act_/, 'req_')

  // [IMG-DEBUG] Layer 1: confirm UNSPLASH_ACCESS_KEY is reaching this runtime.
  // BYTE-LEVEL — when the dashboard says one thing and curl-with-this-key
  // works but the running function gets 401, the env var is contaminated by
  // an invisible character. JSON.stringify exposes \n / \t / spaces as
  // visible escapes; charCodes pin down exact byte values at the boundaries.
  {
    const k = process.env.UNSPLASH_ACCESS_KEY ?? ''
    const codes = (s: string, n: number) => {
      const out: number[] = []
      for (let i = 0; i < Math.min(n, s.length); i++) out.push(s.charCodeAt(i))
      return out
    }
    console.log('[IMG-DEBUG] env check', {
      lessonId: params.id,
      requestId,
      keyExists: !!process.env.UNSPLASH_ACCESS_KEY,
      keyLength: k.length,
      first4: k.slice(0, 4),
      last4: k.slice(-4),
      // JSON-stringify exposes embedded whitespace / control chars as escapes.
      // If you see \\n or \\u0020 here, that's your contamination.
      keyJson: JSON.stringify(k),
      // Decimal char codes for the first and last 6 characters. Should be
      // alphanumeric or `_` / `-` for a clean key. Anything < 33 (control
      // chars / whitespace) or > 126 (non-printable) is contamination.
      first6Codes: codes(k, 6),
      last6Codes: codes(k.slice(-6), 6),
      trimmedLength: k.trim().length,
      lengthsMatch: k.length === k.trim().length,
    })
  }

  try {
    const supabase = createRouteClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 })

    const userId = session.user.id
    if (!checkRateLimit(userId, 5, 60_000)) {
      return NextResponse.json({ error: 'Too many requests', requestId }, { status: 429 })
    }

    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('id, user_id, title, student_level, topic, lesson_length, student_age_group, student_nationality, lesson_content, activities_status')
      .eq('id', params.id)
      .single()

    if (error || !lesson) return NextResponse.json({ error: 'Not found', requestId }, { status: 404 })
    if (lesson.user_id !== userId) return NextResponse.json({ error: 'Forbidden', requestId }, { status: 403 })

    // De-dupe: if a generation is already in flight (or finished) just return
    // the current state so the polling screen lights up correctly.
    if (lesson.activities_status === 'generating') {
      return NextResponse.json({ status: 'generating', requestId })
    }
    if (lesson.activities_status === 'ready') {
      return NextResponse.json({ status: 'ready', requestId })
    }

    const { error: lockError } = await supabase
      .from('lessons')
      .update({ activities_status: 'generating', activities_error: null })
      .eq('id', lesson.id)
      .eq('user_id', userId)

    if (lockError) {
      console.error('[generate-activities] failed to mark generating', {
        requestId,
        message: lockError.message,
        code: lockError.code,
        details: lockError.details,
        hint: lockError.hint,
      })
      const debug = process.env.NODE_ENV === 'development'
        ? { debug: { code: lockError.code, message: lockError.message, hint: lockError.hint } }
        : {}
      return NextResponse.json({ error: FRIENDLY_ERROR, requestId, ...debug }, { status: 500 })
    }

    const formData: LessonFormData = {
      level: lesson.student_level,
      topic: lesson.topic,
      length: lesson.lesson_length,
      ageGroup: lesson.student_age_group,
      nationality: lesson.student_nationality,
      classSize: 'Standard class (7-20)',
      specialFocus: [],
    }
    const plan = lesson.lesson_content as LessonContent

    // First attempt + one automatic retry on validation failure. Two failures
    // in a row → genuine breakage; surface a friendly error and let the user
    // hit "Try again" manually.
    const tEndpointStart = Date.now()
    let lastError: unknown = null
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const retryHint = attempt === 2 && lastError instanceof ZodError
          ? `The previous attempt produced invalid activities. Issues: ${JSON.stringify(lastError.issues.slice(0, 5))}. Strictly use ONLY these eight type values, no others: reading_passage, multiple_choice, gap_fill, discussion_questions, writing_task, vocab_presentation, grammar_explanation, image_prompt. Do not output an image_url field — only image_query.`
          : undefined

        const { activities, droppedTypes, timings } = await runPipeline({
          lessonId: lesson.id,
          formData,
          plan,
          retryHint,
          requestId,
        })

        if (droppedTypes.length > 0) {
          console.warn('[generate-activities] dropped invalid activity types', {
            requestId,
            droppedTypes,
            attempt,
          })
        }

        // [IMG-DEBUG] Layer 5 (pre-write): the activities array we're about
        // to persist. Lists every image_url so we can confirm post-process
        // results are still attached at write time.
        activities.forEach((a, i) => {
          if (a.type === 'reading_passage' || a.type === 'discussion_questions' || a.type === 'image_prompt') {
            console.log('[IMG-DEBUG] pre-DB write', {
              lessonId: lesson.id,
              requestId,
              activityIndex: i,
              activityId: a.id,
              type: a.type,
              image_url: 'image_url' in a ? a.image_url : 'NOT_PRESENT',
            })
          }
        })

        const tBeforeSave = Date.now()
        const { error: updateError } = await supabase
          .from('lessons')
          .update({ activities, activities_status: 'ready', activities_error: null })
          .eq('id', lesson.id)
          .eq('user_id', userId)
        const tAfterSave = Date.now()

        // [IMG-DEBUG] Layer 5 (post-write): confirm the row actually wrote
        // and re-read image_url values to detect any silent column mismatch.
        {
          const { data: verify, error: verifyError } = await supabase
            .from('lessons')
            .select('activities')
            .eq('id', lesson.id)
            .single()
          const verifyArr: any[] = Array.isArray(verify?.activities) ? (verify!.activities as any[]) : []
          verifyArr.forEach((a, i) => {
            if (a?.type === 'reading_passage' || a?.type === 'discussion_questions' || a?.type === 'image_prompt') {
              console.log('[IMG-DEBUG] post-DB write verify', {
                lessonId: lesson.id,
                requestId,
                activityIndex: i,
                activityId: a?.id,
                type: a?.type,
                image_url_from_db: a?.image_url ?? 'NULL_OR_MISSING',
              })
            }
          })
          if (verifyError) {
            console.error('[IMG-DEBUG] post-DB write verify error', {
              lessonId: lesson.id, requestId,
              message: verifyError.message, code: verifyError.code,
            })
          }
        }

        if (updateError) throw new Error(`save failed: ${updateError.message}`)

        console.log('[generate-activities] success', {
          requestId,
          attempt,
          activityCount: activities.length,
          mcqCount: activities.filter(a => a.type === 'multiple_choice').length,
          dbSaveMs: tAfterSave - tBeforeSave,
          totalEndpointMs: tAfterSave - tEndpointStart,
          ...timings,
        })

        return NextResponse.json({ status: 'ready', activities, requestId })
      } catch (err) {
        lastError = err
        if (err instanceof ZodError) {
          console.error('[generate-activities] zod validation failed', {
            requestId,
            attempt,
            issues: err.issues,
          })
          if (attempt < 2) continue // retry once
        } else {
          // Non-validation failure (model API down, network, etc.) — don't
          // retry, those rarely fix themselves on a second call within ms.
          console.error('[generate-activities] generation error', { requestId, attempt, err })
          break
        }
      }
    }

    // Both attempts failed. Mark the row failed and surface friendly text.
    const internalMessage = lastError instanceof Error ? lastError.message : String(lastError ?? 'unknown error')
    await supabase
      .from('lessons')
      .update({
        activities_status: 'failed',
        activities_error: `[${requestId}] ${internalMessage.slice(0, 480)}`,
      })
      .eq('id', lesson.id)
      .eq('user_id', userId)

    return NextResponse.json({ status: 'failed', error: FRIENDLY_ERROR, requestId }, { status: 500 })
  } catch (err) {
    console.error('[generate-activities] unexpected', { requestId, err })
    return NextResponse.json({ error: FRIENDLY_ERROR, requestId }, { status: 500 })
  }
}
