export type SubscriptionStatus = 'free' | 'pro' | 'cancelled'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  stripe_customer_id: string | null
  subscription_status: SubscriptionStatus
  subscription_id: string | null
  lessons_used_this_month: number
  worksheets_used_this_month: number
  error_coach_used_this_month: number
  demo_lesson_used_this_month: number
  job_assistant_used_this_month: number
  lessons_reset_date: string
  created_at: string
  onboarding_completed: boolean
  default_level: string | null
  default_nationality: string | null
  default_age_group: string | null
  main_goal: string | null
}

export interface LessonContent {
  title: string
  overview: {
    level: string
    timing: string
    objectives: string[]
    materials: string[]
  }
  warmer: {
    duration: string
    instructions: string
    teacherNotes: string
  }
  leadIn: {
    duration: string
    instructions: string
    context: string
  }
  mainActivity: {
    duration: string
    instructions: string
    variations: string
    teacherNotes: string
  }
  languageFocus: {
    grammar_or_vocab: string
    explanation: string
    examples: string[]
    commonErrors: string[]
  }
  l1Notes: {
    nationality: string
    specificChallenges: string[]
    tips: string[]
  }
  culturalNote: {
    hasCulturalConsideration: boolean
    note: string
  }
  exercises: Array<{
    type: string
    instructions: string
    content: string
    answerKey: string
  }>
  speakingTask: {
    duration: string
    instructions: string
    prompts: string[]
  }
  exitTicket: {
    instructions: string
    questions: string[]
  }
  homework: {
    optional: boolean
    instructions: string
  }
}

export interface Lesson {
  id: string
  user_id: string
  title: string
  student_level: string
  topic: string
  lesson_length: number
  student_age_group: string
  student_nationality: string
  lesson_content: LessonContent
  created_at: string
}

export interface WorksheetContent {
  title: string
  level: string
  topic: string
  exercises: Array<{
    type: string
    instructions: string
    items: string[]
    answerKey?: string[]
  }>
}

export interface Worksheet {
  id: string
  user_id: string
  lesson_id: string | null
  title: string
  content: WorksheetContent
  created_at: string
}

export interface LessonFormData {
  level: string
  topic: string
  length: number
  ageGroup: string
  nationality: string
  classSize: string
  specialFocus: string[]
}

export interface WorksheetFormData {
  exerciseTypes: string[]
  topic: string
  level: string
  questionCount: number
  includeAnswerKey: boolean
}

export interface ErrorCoachFormData {
  text: string
  level: string
  nationality: string
}

export interface DemoLessonFormData {
  schoolType: string
  country: string
  topic: string
  level: string
  demoLength: number
  experienceLevel: string
}

export interface JobApplicationFormData {
  schoolType: string
  country: string
  experienceLevel: string
  certifications: string
  motivation: string
  schoolValues?: string
}

export interface UsageLimits {
  lessons: { used: number; limit: number }
  worksheets: { used: number; limit: number }
  errorCoach: { used: number; limit: number }
  demoLesson: { used: number; limit: number }
  jobAssistant: { used: number; limit: number }
}
