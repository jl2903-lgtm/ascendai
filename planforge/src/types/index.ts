export interface SharedResource {
  id: string
  user_id: string
  uploader_name: string
  uploader_avatar_url: string | null
  title: string
  description: string | null
  file_url: string
  file_name: string
  file_type: string
  file_size_bytes: number | null
  cefr_level: string
  age_group: string
  subject: string
  resource_type: string
  tags: string[] | null
  download_count: number
  created_at: string
  updated_at: string
}

export interface ReportedResource {
  id: string
  resource_id: string
  reporter_id: string
  reason: string
  created_at: string
}

export interface PracticeSession {
  id: string
  share_code: string
  user_id: string
  lesson_title: string
  lesson_topic: string
  lesson_level: string
  student_nationality: string
  vocabulary: Array<{ word: string; definition: string; example: string }>
  grammar_focus: string
  practice_sentences: Array<{ sentence: string; blank_word: string; hint: string }>
  lesson_content: string
  view_count: number
  created_at: string
  expires_at: string
}

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
  onboarding_completed_at: string | null
  teaching_context: 'private_tutor' | 'classroom' | 'both' | null
  default_level: string | null
  default_nationality: string | null
  default_age_group: string | null
  main_goal: string | null
}

export interface ClassProfile {
  id: string
  user_id: string
  class_name: string
  student_nationality: string
  student_age_group: string
  class_size: number
  cefr_level: string
  course_type: string
  textbook: string | null
  weak_areas: string[]
  focus_skills: string[]
  additional_notes: string | null
  created_at: string
  updated_at: string
}

export interface ClassContext {
  className: string
  cefrLevel: string
  studentAgeGroup: string
  studentNationality: string
  courseType: string
  weakAreas: string[]
  focusSkills: string[]
  additionalNotes?: string
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

export type ActivitiesStatus = 'not_started' | 'generating' | 'ready' | 'failed'

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
  // Populated for lessons generated after Teach Mode launch. Null on legacy rows.
  activities: unknown[] | null
  // v3: tracks the on-demand activity generation lifecycle. Defaults to
  // 'not_started' for new lessons; backfilled to 'ready' for old rows that
  // already had activities populated.
  activities_status: ActivitiesStatus
  activities_error: string | null
  created_at: string
}

export interface WorksheetContent {
  title: string
  level: string
  topic: string
  exercises: Array<{
    type: string
    instructions: string
    passage?: string
    items: string[]
    answerKey?: string[]
    matchingPairs?: Array<{ word: string; definition: string }>
    shuffledRight?: Array<{ letter: string; definition: string; origIdx: number }>
    compactAnswerKey?: string
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

export interface DemoLesson {
  title: string
  targetSchool: string
  overview: {
    level: string
    duration: string
    objectives: string[]
    methodology: string
  }
  stages: Array<{
    name: string
    duration: string
    activities: string
    whyItWorks: string
  }>
  methodologyNotes: string
  interviewTips: string[]
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

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  cover_image_url: string | null
  category: string
  tags: string[]
  author_name: string
  read_time_minutes: number
  published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}
