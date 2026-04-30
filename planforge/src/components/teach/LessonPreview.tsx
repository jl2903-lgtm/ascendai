'use client'

import type { Activity } from '@/lib/activities/schema'
import { activityTypeName } from './ActivityRenderer'
import { estimateActivityLabel, totalLessonRange } from '@/lib/activity-timing'
import { ActivityImage } from './ActivityImage'

// Full scrollable read-through of every activity, with all tutor-only content
// visible by default. This is the teacher's pre-class review surface — not a
// screen-share view — so we deliberately reveal everything.
//
// Prints cleanly via a print stylesheet at the bottom of this file: page chrome
// is hidden and each activity card breaks onto its own page nicely.
export function LessonPreview({ activities, lessonTitle }: { activities: Activity[]; lessonTitle: string }) {
  // Prefer model-supplied timing_minutes when every activity has one — that's
  // the teacher's intended budget. Fall back to per-type rough range estimates
  // for older lessons that don't carry teaching_guidance.
  const allHaveExplicitTiming = activities.every(a => !!a.teaching_guidance?.timing_minutes)
  const explicitTotal = activities.reduce((acc, a) => acc + (a.teaching_guidance?.timing_minutes ?? 0), 0)
  const fallback = totalLessonRange(activities)
  const total = allHaveExplicitTiming
    ? { min: explicitTotal, max: explicitTotal }
    : fallback
  return (
    <div className="space-y-4 lesson-preview-root">
      <div className="hidden print:block mb-4">
        <h1 className="text-2xl font-bold text-slate-900">{lessonTitle}</h1>
        <div className="text-sm text-slate-600 mt-1">Tyoutor Pro — Lesson Preview</div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Lesson preview</div>
          <div className="text-sm text-slate-700 mt-0.5">
            {activities.length} activities · {total.min === total.max ? `${total.min} min total` : `estimated ${total.min}–${total.max} min total`}
          </div>
        </div>
        <div className="text-xs text-slate-500 hidden sm:block">All tutor notes shown — this is your pre-class review.</div>
      </div>
      <ol className="space-y-3">
        {activities.map((a, i) => {
          const guidance = a.teaching_guidance
          const timingLabel = guidance?.timing_minutes
            ? `${guidance.timing_minutes} min`
            : estimateActivityLabel(a)
          return (
            <li key={a.id} className="rounded-xl border border-slate-200 bg-white px-5 py-4 lesson-preview-card">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="text-sm font-semibold text-slate-800">
                  <span className="text-slate-400 mr-2">{i + 1}.</span>
                  {activityTypeName(a.type)}
                </div>
                <div className="text-xs text-slate-500">{timingLabel}</div>
              </div>
              <div className="mt-3">
                <PreviewBody activity={a} suppressLegacyTutor={!!guidance} />
              </div>
              {guidance && <GuidanceBlock guidance={guidance} />}
            </li>
          )
        })}
      </ol>

      <style jsx global>{`
        @media print {
          @page { margin: 1.5cm; }
          body { background: white !important; }
          /* Hide everything not in the preview, then show the preview again. */
          body > *:not(.lesson-preview-print-root) { display: none !important; }
          .lesson-preview-print-root { display: block !important; }
          .lesson-preview-card { break-inside: avoid; border: 1px solid #cbd5e1 !important; }
          .lesson-preview-no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}

function PreviewBody({ activity, suppressLegacyTutor }: { activity: Activity; suppressLegacyTutor: boolean }) {
  // When v3.1 teaching_guidance is present we render that as a structured
  // block at the bottom of the card and skip the per-field legacy
  // TutorBlocks here to avoid showing the same content twice.
  const showLegacy = !suppressLegacyTutor
  switch (activity.type) {
    case 'reading_passage':
      return (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-900">{activity.title}</h3>
          <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">{activity.body}</p>
          {(activity.extra_paragraphs ?? []).map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">{p}</p>
          ))}
          {showLegacy && activity.comprehension_hooks && activity.comprehension_hooks.length > 0 && (
            <TutorBlock title="Mid-read check-ins">
              <ul className="list-disc pl-5 space-y-1">
                {activity.comprehension_hooks.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </TutorBlock>
          )}
          {showLegacy && activity.tutor_notes && (
            <TutorBlock title="Tutor notes"><p>{activity.tutor_notes}</p></TutorBlock>
          )}
        </div>
      )
    case 'multiple_choice':
      return (
        <div className="space-y-3">
          <p className="text-sm text-slate-900">{activity.question}</p>
          <ol className="space-y-1">
            {activity.options.map((o, i) => (
              <li key={i} className={`text-sm pl-4 ${i === activity.correct_index ? 'text-emerald-800 font-medium' : 'text-slate-700'}`}>
                {String.fromCharCode(97 + i)}) {o}{i === activity.correct_index ? '  ✓' : ''}
              </li>
            ))}
          </ol>
          {showLegacy && activity.tutor_explanation && (
            <TutorBlock title="Tutor explanation"><p>{activity.tutor_explanation}</p></TutorBlock>
          )}
        </div>
      )
    case 'gap_fill': {
      const display = activity.sentence_template.replace(/\{\{(\d+)\}\}/g, (_, n) => `[${activity.answers[parseInt(n, 10)] ?? '___'}]`)
      return (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-slate-900">{display}</p>
          {activity.word_bank.length > 0 && (
            <div className="text-xs text-slate-600">Word bank: <span className="font-mono">{activity.word_bank.join(' · ')}</span></div>
          )}
          {showLegacy && activity.tutor_explanation && (
            <TutorBlock title="Tutor explanation"><p>{activity.tutor_explanation}</p></TutorBlock>
          )}
        </div>
      )
    }
    case 'discussion_questions':
      return (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-900">{activity.title}</h3>
          {activity.intro && <p className="text-sm text-slate-700">{activity.intro}</p>}
          <ol className="list-decimal pl-5 text-sm text-slate-800 space-y-1">
            {activity.questions.map((q, i) => <li key={i}>{q}</li>)}
          </ol>
          {showLegacy && activity.tutor_followups.length > 0 && (
            <TutorBlock title="Suggested follow-ups">
              <ul className="list-disc pl-5 space-y-1">
                {activity.tutor_followups.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </TutorBlock>
          )}
        </div>
      )
    case 'writing_task':
      return (
        <div className="space-y-3">
          <p className="text-sm text-slate-900">{activity.prompt}</p>
          {activity.min_words ? <div className="text-xs text-slate-500">Minimum: {activity.min_words} words</div> : null}
          {showLegacy && activity.success_criteria && activity.success_criteria.length > 0 && (
            <TutorBlock title="Success criteria">
              <ul className="list-disc pl-5 space-y-1">
                {activity.success_criteria.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </TutorBlock>
          )}
          {showLegacy && activity.tutor_notes && <TutorBlock title="Tutor notes"><p>{activity.tutor_notes}</p></TutorBlock>}
          {showLegacy && activity.model_answer && <TutorBlock title="Model answer"><p className="whitespace-pre-wrap">{activity.model_answer}</p></TutorBlock>}
        </div>
      )
    case 'vocab_presentation':
      return (
        <ul className="space-y-2">
          {activity.items.map((it, i) => (
            <li key={i} className="text-sm">
              <span className="font-semibold text-slate-900">{it.word}</span>
              {it.pos && <span className="italic text-slate-500"> · {it.pos}</span>}
              {it.pronunciation && <span className="font-mono text-slate-500"> · {it.pronunciation}</span>}
              <span className="text-slate-700"> — {it.definition}</span>
              {it.example && <div className="text-slate-600 italic ml-2">&ldquo;{it.example}&rdquo;</div>}
              {it.collocation && <div className="text-slate-500 ml-2 text-xs">Collocation: <span className="font-medium">{it.collocation}</span></div>}
            </li>
          ))}
        </ul>
      )
    case 'grammar_explanation':
      return (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-900">{activity.rule_title}</h3>
          <p className="text-sm text-slate-800">{activity.rule}</p>
          {activity.examples.length > 0 && (
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-0.5">
              {activity.examples.map((e, i) => <li key={i} className="font-mono">{e}</li>)}
            </ul>
          )}
          {showLegacy && activity.common_errors.length > 0 && (
            <TutorBlock title="Common errors">
              <ul className="space-y-1.5">
                {activity.common_errors.map((e, i) => (
                  <li key={i}>
                    <div className="text-rose-700">✗ {e.wrong}</div>
                    {e.right && <div className="text-emerald-700">✓ {e.right}</div>}
                  </li>
                ))}
              </ul>
            </TutorBlock>
          )}
          {showLegacy && activity.practice_prompts && activity.practice_prompts.length > 0 && (
            <TutorBlock title="Practice prompts">
              <ul className="list-disc pl-5 space-y-1">
                {activity.practice_prompts.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </TutorBlock>
          )}
        </div>
      )
    case 'image_prompt':
      return (
        <div className="space-y-3">
          <ActivityImage src={activity.image_url} aspect="max-h-64" />
          <p className="text-sm text-slate-900">{activity.prompt}</p>
          {showLegacy && activity.tutor_followups.length > 0 && (
            <TutorBlock title="Follow-ups">
              <ul className="list-disc pl-5 space-y-1">
                {activity.tutor_followups.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </TutorBlock>
          )}
          {showLegacy && activity.vocabulary_to_elicit && activity.vocabulary_to_elicit.length > 0 && (
            <TutorBlock title="Vocabulary to elicit">
              <div className="flex flex-wrap gap-1.5">
                {activity.vocabulary_to_elicit.map((v, i) => (
                  <span key={i} className="rounded bg-white border border-amber-300 text-amber-900 px-2 py-0.5 text-xs">{v}</span>
                ))}
              </div>
            </TutorBlock>
          )}
        </div>
      )
  }
}

// v3.1 structured guidance display in the lesson preview. Mirrors the
// TutorPanel's four sections but rendered inline (always visible — this is
// the pre-class review surface, not a screen-share view).
function GuidanceBlock({ guidance }: { guidance: NonNullable<Activity['teaching_guidance']> }) {
  return (
    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 space-y-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Teaching guidance</div>
      <div>
        <div className="text-xs font-semibold text-slate-700 mb-1">🎯 Objective</div>
        <p className="text-sm text-slate-800 leading-relaxed">{guidance.objective}</p>
      </div>
      {guidance.how_to_run.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-slate-700 mb-1">📋 How to run</div>
          <ol className="list-decimal pl-5 text-sm text-slate-800 leading-relaxed space-y-0.5">
            {guidance.how_to_run.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>
      )}
      {guidance.watch_for.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-slate-700 mb-1">👂 Watch for</div>
          <ul className="list-disc pl-5 text-sm text-slate-800 leading-relaxed space-y-0.5">
            {guidance.watch_for.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
      {guidance.if_struggling.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-slate-700 mb-1">💡 If they struggle</div>
          <ul className="list-disc pl-5 text-sm text-slate-800 leading-relaxed space-y-0.5">
            {guidance.if_struggling.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

function TutorBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-1">Tutor notes — {title}</div>
      <div className="text-sm text-slate-800 leading-relaxed">{children}</div>
    </div>
  )
}
