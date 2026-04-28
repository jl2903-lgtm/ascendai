import { TeachShell } from '@/components/teach/TeachShell'
import { DraftTeachRunner } from './DraftTeachRunner'

// Reads the in-flight lesson out of sessionStorage. Used after a teacher
// generates a lesson and clicks "Teach this lesson" without saving first.
export default function DraftTeachPage() {
  return (
    <TeachShell>
      <DraftTeachRunner />
    </TeachShell>
  )
}
