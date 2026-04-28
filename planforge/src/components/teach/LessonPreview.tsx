'use client'

import type { Activity } from '@/lib/activities/schema'
import { activityTypeName } from './ActivityRenderer'
import { estimateActivityLabel, totalLessonRange } from '@/lib/activity-timing'

// Full scrollable read-through of every activity, with all tutor-only content
// visible by default. This is the teacher's pre-class review surface — not a
// screen-share view — so we deliberately reveal everything.
//
// Prints cleanly via a print stylesheet at the bottom of this file: page chrome
// is hidden and each activity card breaks onto its own page nicely.
export function LessonPreview({ activities, lessonTitle }: { activities: Activity[]; lessonTitle: string }) {
  const total = totalLessonRange(activities)
  return (
    <div className="space-y-4 lesson-preview-root">
      <div className="hidden print:block mb-4">
        <h1 className="text-2xl font-bold text-slate-900">{lessonTitle}</h1>
        <div className="text-sm text-slate-600 mt-1">Tyoutor Pro — Lesson Preview</div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Lesson preview</div>
          <div className="text-sm text-slate-700 mt-0.5">{activities.length} activities · estimated {total.min}–{total.max} min total</div>
        </div>
        <div className="text-xs text-slate-500 hidden sm:block">All tutor notes shown — this is your pre-class review.</div>
      </div>
      <ol className="space-y-3">
        {activities.map((a, i) => (
          <li key={a.id} className="rounded-xl border border-slate-200 bg-white px-5 py-4 lesson-preview-card">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <div className="text-sm font-semibold text-slate-800">
                <span className="text-slate-400 mr-2">{i + 1}.</span>
                {activityTypeName(a.type)}
              </div>
              <div className="text-xs text-slate-500">{estimateActivityLabel(a)}</div>
            </div>
            <div className="mt-3">
              <PreviewBody activity={a} />
            </div>
          </li>
        ))}
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

function PreviewBody({ activity }: { activity: Activity }) {
  switch (activity.type) {
    case 'reading_passage':
      return (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-900">{activity.title}</h3>
          <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">{activity.body}</p>
          {(activity.extra_paragraphs ?? []).map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">{p}</p>
          ))}
          {activity.comprehension_hooks && activity.comprehension_hooks.length > 0 && (
            <TutorBlock title="Mid-read check-ins">
              <ul className="list-disc pl-5 space-y-1">
                {activity.comprehension_hooks.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </TutorBlock>
          )}
          {activity.tutor_notes && (
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
          {activity.tutor_explanation && (
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
          {activity.tutor_explanation && (
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
          {activity.tutor_followups.length > 0 && (
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
          {activity.success_criteria && activity.success_criteria.length > 0 && (
            <TutorBlock title="Success criteria">
              <ul className="list-disc pl-5 space-y-1">
                {activity.success_criteria.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </TutorBlock>
          )}
          {activity.tutor_notes && <TutorBlock title="Tutor notes"><p>{activity.tutor_notes}</p></TutorBlock>}
          {activity.model_answer && <TutorBlock title="Model answer"><p className="whitespace-pre-wrap">{activity.model_answer}</p></TutorBlock>}
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
          {activity.common_errors.length > 0 && (
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
          {activity.practice_prompts && activity.practice_prompts.length > 0 && (
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={activity.image_url} alt="" className="w-full max-h-64 object-cover rounded-lg border border-slate-200" />
          <p className="text-sm text-slate-900">{activity.prompt}</p>
          {activity.tutor_followups.length > 0 && (
            <TutorBlock title="Follow-ups">
              <ul className="list-disc pl-5 space-y-1">
                {activity.tutor_followups.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </TutorBlock>
          )}
          {activity.vocabulary_to_elicit && activity.vocabulary_to_elicit.length > 0 && (
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

function TutorBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-1">Tutor notes — {title}</div>
      <div className="text-sm text-slate-800 leading-relaxed">{children}</div>
    </div>
  )
}
