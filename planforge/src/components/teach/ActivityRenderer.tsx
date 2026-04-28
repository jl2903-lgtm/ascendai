'use client'

import type { Activity } from '@/lib/activities/schema'
import { ReadingPassage } from './activities/ReadingPassage'
import { MultipleChoice } from './activities/MultipleChoice'
import { GapFill } from './activities/GapFill'
import { DiscussionQuestions } from './activities/DiscussionQuestions'
import { WritingTask } from './activities/WritingTask'
import { VocabPresentation } from './activities/VocabPresentation'
import { GrammarExplanation } from './activities/GrammarExplanation'
import { ImagePrompt } from './activities/ImagePrompt'

// Switches on activity.type to render the right component. We re-key on
// activity.id so each activity gets its own fresh state when navigating —
// answers, selections, and reveals don't bleed between activities.
//
// rehearsal: when true, all `<TutorReveal>` blocks open by default and
// "Show correct answer" / "Show answers" toggles in MCQ/GapFill auto-reveal.
export function ActivityRenderer({ activity, flashAnswer, rehearsal }: { activity: Activity; flashAnswer?: number; rehearsal?: boolean }) {
  const key = activity.id + (rehearsal ? ':rehearsal' : '')
  switch (activity.type) {
    case 'reading_passage':    return <ReadingPassage key={key} activity={activity} rehearsal={rehearsal} />
    case 'multiple_choice':    return <MultipleChoice key={key} activity={activity} flashAnswer={flashAnswer} rehearsal={rehearsal} />
    case 'gap_fill':           return <GapFill key={key} activity={activity} flashAnswer={flashAnswer} rehearsal={rehearsal} />
    case 'discussion_questions': return <DiscussionQuestions key={key} activity={activity} />
    case 'writing_task':       return <WritingTask key={key} activity={activity} rehearsal={rehearsal} />
    case 'vocab_presentation': return <VocabPresentation key={key} activity={activity} />
    case 'grammar_explanation': return <GrammarExplanation key={key} activity={activity} rehearsal={rehearsal} />
    case 'image_prompt':       return <ImagePrompt key={key} activity={activity} rehearsal={rehearsal} />
  }
}

export function activityLabel(activity: Activity): string {
  switch (activity.type) {
    case 'reading_passage':    return activity.title || 'Reading'
    case 'multiple_choice':    return activity.question.slice(0, 50)
    case 'gap_fill':           return 'Gap fill'
    case 'discussion_questions': return activity.title || 'Discussion'
    case 'writing_task':       return 'Writing task'
    case 'vocab_presentation': return `Vocabulary (${activity.items.length} words)`
    case 'grammar_explanation': return activity.rule_title || 'Grammar'
    case 'image_prompt':       return 'Image prompt'
  }
}

export function activityTypeName(type: Activity['type']): string {
  return ({
    reading_passage: 'Reading',
    multiple_choice: 'Multiple choice',
    gap_fill: 'Gap fill',
    discussion_questions: 'Discussion',
    writing_task: 'Writing',
    vocab_presentation: 'Vocabulary',
    grammar_explanation: 'Grammar',
    image_prompt: 'Image prompt',
  } as const)[type]
}
