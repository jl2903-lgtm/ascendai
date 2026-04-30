'use client'

import { ReactNode } from 'react'
import { Eye, EyeOff, Clock } from 'lucide-react'
import type { Activity, TeachingGuidance } from '@/lib/activities/schema'

// Right-edge tutor panel. Collapsed by default — the eye button on the screen
// edge expands it. Always closable before sharing the screen with the student.
//
// v3.1: when activity.teaching_guidance is present (new lessons), render the
// four structured sections (Objective / How to run / Watch for / If they
// struggle) plus a timing badge. Falls back to legacy ad-hoc fields for older
// lessons that don't have teaching_guidance yet.
export function TutorPanel({
  activity,
  open,
  onToggle,
}: {
  activity: Activity
  open: boolean
  onToggle: () => void
}) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-label={open ? 'Hide tutor panel' : 'Show tutor panel'}
        title={open ? 'Hide tutor panel (T)' : 'Show tutor panel (T)'}
        className="fixed top-1/2 right-0 -translate-y-1/2 z-30 flex items-center gap-1.5 rounded-l-lg border border-r-0 border-slate-300 bg-white px-2 py-3 text-xs text-slate-600 shadow hover:bg-slate-50"
      >
        {open ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        <span className="writing-mode-vertical hidden xl:inline">Tutor</span>
      </button>
      {open && (
        <aside className="fixed top-0 right-0 bottom-0 w-[360px] z-20 bg-white border-l border-slate-200 shadow-xl overflow-y-auto">
          <div className="px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tutor Panel</div>
              {activity.teaching_guidance?.timing_minutes ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">
                  <Clock className="w-3 h-3" /> {activity.teaching_guidance.timing_minutes} min
                </span>
              ) : null}
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mt-0.5">
              Notes for this activity
            </h3>
            <p className="text-xs text-slate-500 mt-1">Visible only to you. Close before sharing your screen.</p>
          </div>
          <div className="px-5 py-4 space-y-5">
            {activity.teaching_guidance ? (
              <GuidanceContent guidance={activity.teaching_guidance} />
            ) : (
              <LegacyContent activity={activity} />
            )}
          </div>
        </aside>
      )}
    </>
  )
}

// New v3.1 structured guidance display. Used whenever teaching_guidance is
// populated on the activity.
function GuidanceContent({ guidance }: { guidance: TeachingGuidance }) {
  return (
    <>
      <Section title="🎯 Objective">
        <p className="text-sm text-slate-800 leading-relaxed">{guidance.objective}</p>
      </Section>
      {guidance.how_to_run.length > 0 && (
        <Section title="📋 How to run">
          <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-700 leading-relaxed">
            {guidance.how_to_run.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </Section>
      )}
      {guidance.watch_for.length > 0 && (
        <Section title="👂 Watch for">
          <ul className="space-y-1.5 text-sm text-slate-700 leading-relaxed">
            {guidance.watch_for.map((item, i) => (
              <li key={i} className="border-l-2 border-amber-400 pl-3">{item}</li>
            ))}
          </ul>
        </Section>
      )}
      {guidance.if_struggling.length > 0 && (
        <Section title="💡 If they struggle">
          <ul className="space-y-1.5 text-sm text-slate-700 leading-relaxed">
            {guidance.if_struggling.map((item, i) => (
              <li key={i} className="border-l-2 border-teal-400 pl-3">{item}</li>
            ))}
          </ul>
        </Section>
      )}
    </>
  )
}

// Legacy display for activities generated before v3.1. Retains the ad-hoc
// per-type rendering so old lessons keep working unchanged.
function LegacyContent({ activity }: { activity: Activity }) {
  switch (activity.type) {
    case 'reading_passage':
      return (
        <>
          <Section title="Tutor notes">
            {activity.tutor_notes ? <p className="text-sm text-slate-700 leading-relaxed">{activity.tutor_notes}</p> : <Empty />}
          </Section>
          {activity.comprehension_hooks && activity.comprehension_hooks.length > 0 && (
            <Section title="Mid-read check-ins">
              <ul className="space-y-2">
                {activity.comprehension_hooks.map((h, i) => (
                  <li key={i} className="text-sm text-slate-700 leading-relaxed border-l-2 border-amber-400 pl-3">{h}</li>
                ))}
              </ul>
            </Section>
          )}
        </>
      )
    case 'multiple_choice':
      return (
        <>
          <Section title="Why this answer is correct">
            {activity.tutor_explanation ? <p className="text-sm text-slate-700 leading-relaxed">{activity.tutor_explanation}</p> : <Empty />}
          </Section>
          <Section title="Correct answer">
            <div className="text-sm font-medium text-emerald-700">{activity.options[activity.correct_index]}</div>
          </Section>
        </>
      )
    case 'gap_fill':
      return (
        <>
          <Section title="Tutor explanation">
            {activity.tutor_explanation ? <p className="text-sm text-slate-700 leading-relaxed">{activity.tutor_explanation}</p> : <Empty />}
          </Section>
          <Section title="Answers">
            <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-1">
              {activity.answers.map((a, i) => <li key={i}>{a}</li>)}
            </ol>
          </Section>
        </>
      )
    case 'discussion_questions':
      return (
        <Section title="Suggested follow-ups">
          {activity.tutor_followups.length ? (
            <ul className="space-y-2">
              {activity.tutor_followups.map((f, i) => (
                <li key={i} className="text-sm text-slate-700 leading-relaxed border-l-2 border-amber-400 pl-3">{f}</li>
              ))}
            </ul>
          ) : <Empty />}
        </Section>
      )
    case 'writing_task':
      return (
        <>
          <Section title="Tutor notes">
            {activity.tutor_notes ? <p className="text-sm text-slate-700 leading-relaxed">{activity.tutor_notes}</p> : <Empty />}
          </Section>
          {activity.success_criteria && activity.success_criteria.length > 0 && (
            <Section title="Success criteria">
              <ul className="space-y-1.5 list-disc pl-5">
                {activity.success_criteria.map((c, i) => <li key={i} className="text-sm text-slate-700">{c}</li>)}
              </ul>
            </Section>
          )}
          {activity.model_answer && (
            <Section title="Model answer">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{activity.model_answer}</p>
            </Section>
          )}
        </>
      )
    case 'vocab_presentation':
      return (
        <Section title="Tutor notes">
          <p className="text-sm text-slate-500 italic">Vocab presentation has no tutor-only content — it&apos;s shared openly.</p>
        </Section>
      )
    case 'grammar_explanation':
      return (
        <>
          <Section title="Common errors">
            {activity.common_errors.length ? (
              <ul className="space-y-2">
                {activity.common_errors.map((e, i) => (
                  <li key={i} className="text-sm border-l-2 border-rose-400 pl-3">
                    <div className="text-rose-700"><span className="font-medium">✗</span> {e.wrong}</div>
                    {e.right && <div className="text-emerald-700 mt-0.5"><span className="font-medium">✓</span> {e.right}</div>}
                  </li>
                ))}
              </ul>
            ) : <Empty />}
          </Section>
          {activity.practice_prompts && activity.practice_prompts.length > 0 && (
            <Section title="Quick verbal drills">
              <ul className="space-y-1.5 list-disc pl-5">
                {activity.practice_prompts.map((p, i) => <li key={i} className="text-sm text-slate-700">{p}</li>)}
              </ul>
            </Section>
          )}
        </>
      )
    case 'image_prompt':
      return (
        <>
          <Section title="Suggested follow-ups">
            {activity.tutor_followups.length ? (
              <ul className="space-y-2">
                {activity.tutor_followups.map((f, i) => (
                  <li key={i} className="text-sm text-slate-700 leading-relaxed border-l-2 border-amber-400 pl-3">{f}</li>
                ))}
              </ul>
            ) : <Empty />}
          </Section>
          {activity.vocabulary_to_elicit && activity.vocabulary_to_elicit.length > 0 && (
            <Section title="Vocabulary to elicit">
              <div className="flex flex-wrap gap-1.5">
                {activity.vocabulary_to_elicit.map((v, i) => (
                  <span key={i} className="rounded-full bg-amber-50 border border-amber-300 text-amber-900 px-2.5 py-0.5 text-xs">{v}</span>
                ))}
              </div>
            </Section>
          )}
        </>
      )
  }
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-700 mb-2">{title}</div>
      {children}
    </div>
  )
}

function Empty() {
  return <p className="text-sm text-slate-400 italic">No notes for this activity.</p>
}
