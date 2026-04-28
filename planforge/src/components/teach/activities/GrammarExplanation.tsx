'use client'

import type { GrammarExplanation as TGE } from '@/lib/activities/schema'
import { TutorReveal } from '../TutorReveal'

export function GrammarExplanation({ activity }: { activity: TGE }) {
  return (
    <div className="space-y-5">
      <header>
        <div className="text-xs uppercase tracking-wider text-slate-400">Grammar</div>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">{activity.rule_title}</h2>
      </header>
      <p className="text-base leading-relaxed text-slate-800">{activity.rule}</p>
      {activity.examples.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Examples</div>
          <ul className="space-y-2">
            {activity.examples.map((e, i) => (
              <li key={i} className="text-base text-slate-800 bg-slate-50 border border-slate-200 rounded-md px-4 py-2 font-mono">{e}</li>
            ))}
          </ul>
        </div>
      )}
      {activity.common_errors.length > 0 && (
        <TutorReveal label="Show common errors" hideLabel="Hide common errors" variant="tip">
          <ul className="space-y-2">
            {activity.common_errors.map((e, i) => (
              <li key={i}>
                <div className="text-rose-700"><span className="font-semibold">✗</span> {e.wrong}</div>
                {e.right && <div className="text-emerald-700 mt-0.5"><span className="font-semibold">✓</span> {e.right}</div>}
              </li>
            ))}
          </ul>
        </TutorReveal>
      )}
    </div>
  )
}
