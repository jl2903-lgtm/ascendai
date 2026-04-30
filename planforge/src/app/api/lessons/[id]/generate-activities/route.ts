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

  const { activities: normalized, droppedTypes } = normalizeActivityTypes(raw)
  const withIds = normalized.map((a: any) => {
    if (a && typeof a === 'object' && (!a.id || typeof a.id !== 'string')) {
      return { ...a, id: generateActivityId() }
    }
    return a
  })
  const tNormalize = Date.now()

  // Unsplash lookups already run in parallel inside resolveActivityImages.
  const withImages = await resolveActivityImages(withIds as Activity[])
  const tImages = Date.now()

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

        const tBeforeSave = Date.now()
        const { error: updateError } = await supabase
          .from('lessons')
          .update({ activities, activities_status: 'ready', activities_error: null })
          .eq('id', lesson.id)
          .eq('user_id', userId)
        const tAfterSave = Date.now()

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
