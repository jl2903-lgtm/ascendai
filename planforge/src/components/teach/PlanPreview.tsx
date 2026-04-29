'use client'

import type { LessonContent } from '@/types'

// Plan-only preview for lessons that haven't had activities generated yet.
// Mirrors the section structure used elsewhere (warmer / lead-in / language
// focus / exercises / etc.) so the page never looks empty pre-Teach Mode.
//
// Uses the same print stylesheet hooks as LessonPreview so the Print button
// on the lesson view page produces a clean printable artifact in either state.
export function PlanPreview({ lesson, lessonTitle }: { lesson: LessonContent; lessonTitle: string }) {
  return (
    <div className="space-y-4 lesson-preview-root">
      <div className="hidden print:block mb-4">
        <h1 className="text-2xl font-bold text-slate-900">{lessonTitle}</h1>
        <div className="text-sm text-slate-600 mt-1">Tyoutor Pro — Lesson Plan</div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Lesson plan</div>
          <div className="text-sm text-slate-700 mt-0.5">{lesson.overview?.timing} · {lesson.overview?.objectives?.length ?? 0} objectives</div>
        </div>
        <div className="text-xs text-slate-500 hidden sm:block">Click &ldquo;Teach this lesson&rdquo; to build the interactive activity flow.</div>
      </div>

      <Section title="Overview" subtitle={lesson.overview?.timing}>
        {lesson.overview?.objectives?.length ? (
          <>
            <SubHead>Objectives</SubHead>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-800">
              {lesson.overview.objectives.map((o, i) => <li key={i}>{o}</li>)}
            </ul>
          </>
        ) : null}
        {lesson.overview?.materials?.length ? (
          <div className="mt-3">
            <SubHead>Materials</SubHead>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-800">
              {lesson.overview.materials.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>
        ) : null}
      </Section>

      <Section title="Warmer" subtitle={lesson.warmer?.duration}>
        <p className="text-sm text-slate-800 leading-relaxed">{lesson.warmer?.instructions}</p>
        {lesson.warmer?.teacherNotes && <Tutor>{lesson.warmer.teacherNotes}</Tutor>}
      </Section>

      <Section title="Lead-in" subtitle={lesson.leadIn?.duration}>
        <p className="text-sm text-slate-800 leading-relaxed">{lesson.leadIn?.instructions}</p>
        {lesson.leadIn?.context && <p className="text-sm text-slate-600 italic mt-2">{lesson.leadIn.context}</p>}
      </Section>

      <Section title="Main activity" subtitle={lesson.mainActivity?.duration}>
        <p className="text-sm text-slate-800 leading-relaxed">{lesson.mainActivity?.instructions}</p>
        {lesson.mainActivity?.variations && (
          <div className="mt-3 text-sm text-slate-700">
            <SubHead>Variations</SubHead>
            <p>{lesson.mainActivity.variations}</p>
          </div>
        )}
        {lesson.mainActivity?.teacherNotes && <Tutor>{lesson.mainActivity.teacherNotes}</Tutor>}
      </Section>

      <Section title="Language focus">
        <SubHead>{lesson.languageFocus?.grammar_or_vocab}</SubHead>
        <p className="text-sm text-slate-800 leading-relaxed">{lesson.languageFocus?.explanation}</p>
        {lesson.languageFocus?.examples?.length ? (
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-slate-800 font-mono">
            {lesson.languageFocus.examples.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        ) : null}
        {lesson.languageFocus?.commonErrors?.length ? (
          <Tutor title="Common errors">
            <ul className="list-disc pl-5 space-y-1">
              {lesson.languageFocus.commonErrors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </Tutor>
        ) : null}
      </Section>

      {lesson.l1Notes && (
        <Section title={`L1-aware notes — ${lesson.l1Notes.nationality}`}>
          {lesson.l1Notes.specificChallenges?.length ? (
            <>
              <SubHead>Common challenges</SubHead>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-800">
                {lesson.l1Notes.specificChallenges.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </>
          ) : null}
          {lesson.l1Notes.tips?.length ? (
            <div className="mt-3">
              <SubHead>Teaching tips</SubHead>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-800">
                {lesson.l1Notes.tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          ) : null}
        </Section>
      )}

      {lesson.exercises?.length ? (
        <Section title="Exercises">
          <div className="space-y-4">
            {lesson.exercises.map((ex, i) => (
              <div key={i} className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-sm font-semibold text-slate-800">{i + 1}. {ex.type}</div>
                <p className="text-xs text-slate-600 mt-1">{ex.instructions}</p>
                <p className="text-sm text-slate-800 whitespace-pre-wrap mt-2">{ex.content}</p>
                {ex.answerKey && <Tutor title="Answer key"><span className="whitespace-pre-wrap">{ex.answerKey}</span></Tutor>}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {lesson.speakingTask && (
        <Section title="Speaking task" subtitle={lesson.speakingTask.duration}>
          <p className="text-sm text-slate-800 leading-relaxed">{lesson.speakingTask.instructions}</p>
          {lesson.speakingTask.prompts?.length ? (
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-slate-800">
              {lesson.speakingTask.prompts.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          ) : null}
        </Section>
      )}

      {lesson.exitTicket?.questions?.length ? (
        <Section title="Exit ticket">
          <p className="text-sm text-slate-700">{lesson.exitTicket.instructions}</p>
          <ul className="mt-3 list-decimal pl-5 space-y-1 text-sm text-slate-800">
            {lesson.exitTicket.questions.map((q, i) => <li key={i}>{q}</li>)}
          </ul>
        </Section>
      ) : null}

      {lesson.homework?.instructions && (
        <Section title="Homework">
          <p className="text-sm text-slate-800 leading-relaxed">{lesson.homework.instructions}</p>
        </Section>
      )}

      <style jsx global>{`
        @media print {
          @page { margin: 1.5cm; }
          body { background: white !important; }
          body > *:not(.lesson-preview-print-root) { display: none !important; }
          .lesson-preview-print-root { display: block !important; }
          .lesson-preview-card { break-inside: avoid; border: 1px solid #cbd5e1 !important; }
          .lesson-preview-no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 lesson-preview-card">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
      </div>
      {children}
    </section>
  )
}

function SubHead({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{children}</div>
}

function Tutor({ title = 'Tutor notes', children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-1">{title}</div>
      <div className="text-sm text-slate-800 leading-relaxed">{children}</div>
    </div>
  )
}
