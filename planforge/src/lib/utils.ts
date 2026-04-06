import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const STUDENT_LEVELS = [
  { value: 'A1', label: 'A1 Beginner' },
  { value: 'A2', label: 'A2 Elementary' },
  { value: 'B1', label: 'B1 Intermediate' },
  { value: 'B2', label: 'B2 Upper Intermediate' },
  { value: 'C1', label: 'C1 Advanced' },
  { value: 'C2', label: 'C2 Proficiency' },
]

export const LESSON_LENGTHS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '60 minutes' },
  { value: 90, label: '90 minutes' },
]

export const AGE_GROUPS = [
  { value: 'Young Learners (5-12)', label: 'Young Learners (5-12)' },
  { value: 'Teenagers (13-17)', label: 'Teenagers (13-17)' },
  { value: 'Adults', label: 'Adults' },
  { value: 'Business Professionals', label: 'Business Professionals' },
]

export const NATIONALITIES = [
  { value: 'Chinese (Mandarin)', label: 'Chinese (Mandarin)' },
  { value: 'Vietnamese', label: 'Vietnamese' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Thai', label: 'Thai' },
  { value: 'Italian', label: 'Italian' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Turkish', label: 'Turkish' },
  { value: 'Russian', label: 'Russian' },
  { value: 'Polish', label: 'Polish' },
  { value: 'Indonesian', label: 'Indonesian' },
  { value: 'Malay', label: 'Malay' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Urdu', label: 'Urdu' },
  { value: 'Farsi/Persian', label: 'Farsi/Persian' },
  { value: 'Ukrainian', label: 'Ukrainian' },
  { value: 'Romanian', label: 'Romanian' },
  { value: 'Hungarian', label: 'Hungarian' },
  { value: 'Czech', label: 'Czech' },
  { value: 'Dutch', label: 'Dutch' },
  { value: 'Other', label: 'Other' },
]

export const CLASS_SIZES = [
  { value: '1-on-1', label: '1-on-1' },
  { value: 'Small group (2-6)', label: 'Small group (2-6)' },
  { value: 'Standard class (7-20)', label: 'Standard class (7-20)' },
  { value: 'Large class (20+)', label: 'Large class (20+)' },
]

export const SPECIAL_FOCUS_OPTIONS = [
  { value: 'More speaking', label: 'More speaking' },
  { value: 'More writing', label: 'More writing' },
  { value: 'Grammar heavy', label: 'Grammar heavy' },
  { value: 'Exam prep', label: 'Exam prep' },
  { value: 'Business context', label: 'Business context' },
  { value: 'Cultural exchange', label: 'Cultural exchange' },
]

export const EXERCISE_TYPES = [
  { value: 'Gap fill', label: 'Gap fill' },
  { value: 'Matching', label: 'Matching' },
  { value: 'Multiple choice', label: 'Multiple choice' },
  { value: 'Reading comprehension', label: 'Reading comprehension' },
  { value: 'Word order', label: 'Word order' },
  { value: 'Error correction', label: 'Error correction' },
  { value: 'Dialogue completion', label: 'Dialogue completion' },
  { value: 'Vocabulary in context', label: 'Vocabulary in context' },
]

export const SCHOOL_TYPES = [
  { value: 'Language school', label: 'Language school' },
  { value: 'State school', label: 'State school' },
  { value: 'International school', label: 'International school' },
  { value: 'Business English', label: 'Business English' },
  { value: 'Online tutoring', label: 'Online tutoring' },
]

export const EXPERIENCE_LEVELS = [
  { value: 'Complete beginner', label: 'Complete beginner' },
  { value: 'Under 1 year', label: 'Under 1 year' },
  { value: '1-3 years', label: '1-3 years' },
  { value: '3+ years', label: '3+ years' },
]

export const DEMO_LENGTHS = [
  { value: 15, label: '15 minutes' },
  { value: 20, label: '20 minutes' },
  { value: 30, label: '30 minutes' },
]

export const FREE_LIMITS = {
  lessons: 5,
  worksheets: 5,
  errorCoach: 3,
  demoLesson: 1,
  jobAssistant: 1,
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
