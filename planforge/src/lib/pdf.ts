import type { LessonContent, WorksheetContent, DemoLesson } from '@/types'
import type { Activity } from './activities/schema'
import { G, PAGE, drawPageHeader, drawPageFooters } from './pdf-styles'

// ── Document context ──────────────────────────────────────────────────────────
// Wraps a jsPDF instance with stateful y-tracking and convenience helpers.

function makeCtx(doc: any, startY: number) {
  let y = startY
  const { M, W, CW, FOOTER_Y } = PAGE
  const CONT_Y = PAGE.M + 4  // y for continuation pages (no header)

  const chk = (needed: number) => {
    if (y + needed > FOOTER_Y - 4) {
      doc.addPage()
      y = CONT_Y
    }
  }

  const txt = (s: string, fs: number, c: [number,number,number], bold = false, indent = 0) => {
    const str = s?.trim()
    if (!str) return
    doc.setFontSize(fs)
    doc.setTextColor(c[0], c[1], c[2])
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    const lines: string[] = doc.splitTextToSize(str, CW - indent)
    const lh = fs * 0.42
    chk(lines.length * lh + 2)
    doc.text(lines, M + indent, y)
    y += lines.length * lh + 1
  }

  const gap = (mm = 4) => { y += mm }

  // Section header: 3 mm coloured left bar + bold label
  const sHdr = (label: string, c: [number,number,number] = G.green) => {
    chk(10)
    doc.setFillColor(c[0], c[1], c[2])
    doc.rect(M, y, 3, 7, 'F')
    doc.setFontSize(11)
    doc.setTextColor(G.dark[0], G.dark[1], G.dark[2])
    doc.setFont('helvetica', 'bold')
    doc.text(label, M + 5, y + 5)
    y += 10
  }

  // Dashed divider line
  const dash = () => {
    chk(6)
    doc.setDrawColor(G.border[0], G.border[1], G.border[2])
    doc.setLineDashPattern([2, 2], 0)
    doc.line(M, y, W - M, y)
    doc.setLineDashPattern([], 0)
    y += 5
  }

  // Thin solid rule
  const rule = () => {
    doc.setDrawColor(G.border[0], G.border[1], G.border[2])
    doc.setLineWidth(0.3)
    doc.line(M, y, W - M, y)
    y += 4
  }

  const blt = (s: string, indent = 5) => { txt(`• ${s}`, 10, G.body, false, indent); gap(1) }

  const num = (s: string, n: number, indent = 5) => {
    txt(`${n}. ${s.replace(/^\d+[\.\)]\s*/, '')}`, 10, G.body, false, indent)
    gap(2)
  }

  return {
    txt, gap, sHdr, dash, rule, blt, num, chk, doc,
    getY: () => y,
    setY: (v: number) => { y = v },
  }
}

// ── Lesson Plan PDF ───────────────────────────────────────────────────────────

export async function generateLessonPDF(
  lesson: LessonContent,
  meta: { level: string; topic: string; date: string },
  teacherName = 'Teacher',
  // Optional. When provided, an extra "Activity Sequence (Teach Mode)" section
  // is appended with the activity-based view of the lesson. When null/undefined
  // the PDF renders exactly as it did before this change (legacy fallback).
  activities?: Activity[] | null,
): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const firstName = teacherName.split(' ')[0] || 'Teacher'
  const pills = [meta.level, meta.topic].filter(Boolean)
  const startY = drawPageHeader(doc, lesson.title, pills, meta.date, firstName)
  const ctx = makeCtx(doc, startY)
  const { txt, gap, sHdr, dash, blt, doc: d } = ctx

  // ── Lesson Overview ─────────────────────────────────────────────────────────
  sHdr('LESSON OVERVIEW')
  txt(`Duration: ${lesson.overview.timing}`, 10, G.dark, true)
  gap(2)
  txt('Objectives:', 10, G.dark, true)
  lesson.overview.objectives.forEach(o => blt(o))
  gap(1)
  txt('Materials:', 10, G.dark, true)
  lesson.overview.materials.forEach(m => blt(m))
  gap(5)

  // ── Warmer ──────────────────────────────────────────────────────────────────
  sHdr(`WARMER  ·  ${lesson.warmer.duration}`)
  txt(lesson.warmer.instructions, 10, G.body)
  if (lesson.warmer.teacherNotes) {
    gap(2)
    txt('Teacher note:', 9, G.accent, true, 3)
    txt(lesson.warmer.teacherNotes, 9, G.muted, false, 3)
  }
  gap(5)

  // ── Lead-in ─────────────────────────────────────────────────────────────────
  sHdr(`LEAD-IN  ·  ${lesson.leadIn.duration}`)
  txt(lesson.leadIn.instructions, 10, G.body)
  if (lesson.leadIn.context) {
    gap(2)
    txt(lesson.leadIn.context, 9, G.muted, false, 3)
  }
  gap(5)

  // ── Main Activity ───────────────────────────────────────────────────────────
  sHdr(`MAIN ACTIVITY  ·  ${lesson.mainActivity.duration}`)
  txt(lesson.mainActivity.instructions, 10, G.body)
  if (lesson.mainActivity.variations) {
    gap(2)
    txt('Variations:', 9, G.accent, true, 3)
    txt(lesson.mainActivity.variations, 9, G.muted, false, 3)
  }
  if (lesson.mainActivity.teacherNotes) {
    gap(2)
    txt('Teacher note:', 9, G.accent, true, 3)
    txt(lesson.mainActivity.teacherNotes, 9, G.muted, false, 3)
  }
  gap(5)

  // ── Language Focus ──────────────────────────────────────────────────────────
  sHdr('LANGUAGE FOCUS')
  txt(lesson.languageFocus.grammar_or_vocab, 11, G.dark, true)
  gap(2)
  txt(lesson.languageFocus.explanation, 10, G.body)
  gap(2)
  txt('Examples:', 10, G.dark, true)
  lesson.languageFocus.examples.forEach(e => blt(e))
  if (lesson.languageFocus.commonErrors?.length) {
    gap(1)
    txt('Common errors to watch for:', 10, G.dark, true)
    lesson.languageFocus.commonErrors.forEach(e => blt(e))
  }
  gap(5)

  // ── L1-Aware Notes (terra cotta) ────────────────────────────────────────────
  sHdr(`L1-AWARE NOTES  ·  ${lesson.l1Notes.nationality}`, G.terra)
  txt('Common challenges:', 10, G.dark, true)
  lesson.l1Notes.specificChallenges.forEach(c => blt(c))
  gap(2)
  txt('Teaching tips:', 10, G.dark, true)
  lesson.l1Notes.tips.forEach(t => blt(t))
  gap(5)

  // ── Cultural Note (if flagged) ──────────────────────────────────────────────
  if (lesson.culturalNote?.hasCulturalConsideration && lesson.culturalNote.note) {
    sHdr('CULTURAL NOTE', G.accent)
    txt(lesson.culturalNote.note, 10, G.body)
    gap(5)
  }

  // ── Practice Exercises ──────────────────────────────────────────────────────
  sHdr('PRACTICE EXERCISES')
  const answerKeys: Array<{ num: number; type: string; key: string }> = []

  lesson.exercises.forEach((ex, i) => {
    ctx.chk(14)
    txt(`Exercise ${i + 1}: ${ex.type}`, 11, G.dark, true)
    gap(1)
    txt(ex.instructions, 10, G.muted, false, 3)
    gap(2)
    txt(ex.content, 10, G.body, false, 3)
    if (ex.answerKey) {
      answerKeys.push({ num: i + 1, type: ex.type, key: ex.answerKey })
    }
    gap(4)
  })

  // ── Speaking Task ───────────────────────────────────────────────────────────
  sHdr(`SPEAKING TASK  ·  ${lesson.speakingTask.duration}`)
  txt(lesson.speakingTask.instructions, 10, G.body)
  gap(2)
  lesson.speakingTask.prompts.forEach(p => blt(p))
  gap(5)

  // ── Exit Ticket ─────────────────────────────────────────────────────────────
  sHdr('EXIT TICKET')
  txt(lesson.exitTicket.instructions, 10, G.body)
  gap(2)
  lesson.exitTicket.questions.forEach(q => blt(q))
  gap(5)

  // ── Homework (optional) ─────────────────────────────────────────────────────
  if (lesson.homework?.instructions) {
    sHdr('HOMEWORK  ·  Optional')
    txt(lesson.homework.instructions, 10, G.body)
    gap(5)
  }

  // ── Answer Key ──────────────────────────────────────────────────────────────
  if (answerKeys.length > 0) {
    gap(2)
    dash()
    sHdr('ANSWER KEY')
    answerKeys.forEach(ak => {
      txt(`Exercise ${ak.num}  (${ak.type})`, 10, G.dark, true)
      txt(ak.key, 9, G.muted, false, 5)
      gap(3)
    })
  }

  // ── Activity Sequence (Teach Mode) ──────────────────────────────────────────
  // Optional. Mirrors the activities rendered by the in-app Teach Mode runner.
  // Tutor-only fields are surfaced under a "Teacher's Notes" label since the
  // PDF is the take-home / printable artifact.
  if (activities && activities.length > 0) {
    gap(2)
    dash()
    sHdr('ACTIVITY SEQUENCE  ·  TEACH MODE', G.accent)

    activities.forEach((a, i) => {
      ctx.chk(14)
      txt(`Activity ${i + 1}: ${activityHeaderLabel(a)}`, 11, G.dark, true)
      gap(1)
      renderActivityToPdf(ctx, a)
      gap(4)
    })
  }

  drawPageFooters(d, `${meta.level} · ${meta.topic}`)
  d.save(`tyoutorpro-lesson-${Date.now()}.pdf`)
}

// ── Activity → PDF helpers ────────────────────────────────────────────────────

function activityHeaderLabel(a: Activity): string {
  switch (a.type) {
    case 'reading_passage': return `Reading — ${a.title}`
    case 'multiple_choice': return 'Multiple choice'
    case 'gap_fill': return 'Gap fill'
    case 'discussion_questions': return `Discussion — ${a.title}`
    case 'writing_task': return 'Writing task'
    case 'vocab_presentation': return 'Vocabulary'
    case 'grammar_explanation': return `Grammar — ${a.rule_title}`
    case 'image_prompt': return 'Image prompt'
  }
}

function renderActivityToPdf(ctx: ReturnType<typeof makeCtx>, a: Activity): void {
  const { txt, gap, blt } = ctx
  switch (a.type) {
    case 'reading_passage':
      txt(a.body, 10, G.body, false, 3)
      a.extra_paragraphs?.forEach(p => { gap(1); txt(p, 10, G.body, false, 3) })
      if (a.tutor_notes) {
        gap(2)
        txt("Teacher's notes:", 9, G.accent, true, 3)
        txt(a.tutor_notes, 9, G.muted, false, 5)
      }
      break
    case 'multiple_choice':
      txt(a.question, 10, G.body, false, 3)
      a.options.forEach((o, i) => txt(`${String.fromCharCode(97 + i)}) ${o}`, 10, G.body, false, 6))
      gap(1)
      txt("Teacher's notes:", 9, G.accent, true, 3)
      txt(`Correct answer: ${String.fromCharCode(97 + a.correct_index)}) ${a.options[a.correct_index]}`, 9, G.muted, false, 5)
      if (a.tutor_explanation) txt(a.tutor_explanation, 9, G.muted, false, 5)
      break
    case 'gap_fill': {
      // Render the template with bracketed blanks for the printable version.
      const display = a.sentence_template.replace(/\{\{(\d+)\}\}/g, '_______')
      txt(display, 10, G.body, false, 3)
      if (a.word_bank.length) {
        gap(1)
        txt(`Word bank: ${a.word_bank.join(' · ')}`, 9, G.muted, false, 5)
      }
      gap(1)
      txt("Teacher's notes:", 9, G.accent, true, 3)
      txt(`Answers: ${a.answers.join(' · ')}`, 9, G.muted, false, 5)
      if (a.tutor_explanation) txt(a.tutor_explanation, 9, G.muted, false, 5)
      break
    }
    case 'discussion_questions':
      if (a.intro) { txt(a.intro, 10, G.body, false, 3); gap(1) }
      a.questions.forEach((q, i) => txt(`${i + 1}. ${q}`, 10, G.body, false, 5))
      if (a.tutor_followups.length) {
        gap(1)
        txt("Teacher's notes — follow-ups:", 9, G.accent, true, 3)
        a.tutor_followups.forEach(f => blt(f, 7))
      }
      break
    case 'writing_task':
      txt(a.prompt, 10, G.body, false, 3)
      if (a.min_words) { gap(1); txt(`Minimum words: ${a.min_words}`, 9, G.muted, false, 5) }
      if (a.tutor_notes || a.model_answer) {
        gap(1)
        txt("Teacher's notes:", 9, G.accent, true, 3)
        if (a.tutor_notes) txt(a.tutor_notes, 9, G.muted, false, 5)
        if (a.model_answer) {
          gap(1)
          txt('Model answer:', 9, G.dark, true, 5)
          txt(a.model_answer, 9, G.muted, false, 5)
        }
      }
      break
    case 'vocab_presentation':
      a.items.forEach(it => {
        const head = `${it.word}${it.pos ? ` (${it.pos})` : ''}${it.pronunciation ? ` ${it.pronunciation}` : ''}`
        txt(head, 10, G.dark, true, 3)
        txt(it.definition, 10, G.body, false, 5)
        if (it.example) txt(`Example: ${it.example}`, 9, G.muted, false, 5)
        gap(1)
      })
      break
    case 'grammar_explanation':
      txt(a.rule, 10, G.body, false, 3)
      if (a.examples.length) {
        gap(1)
        txt('Examples:', 10, G.dark, true, 3)
        a.examples.forEach(e => blt(e, 7))
      }
      if (a.common_errors.length) {
        gap(1)
        txt("Teacher's notes — common errors:", 9, G.accent, true, 3)
        a.common_errors.forEach(e => {
          txt(`✗ ${e.wrong}`, 9, G.muted, false, 5)
          if (e.right) txt(`✓ ${e.right}`, 9, G.muted, false, 5)
        })
      }
      break
    case 'image_prompt':
      txt(a.prompt, 10, G.body, false, 3)
      if (a.image_url) txt(`Image: ${a.image_url}`, 9, G.muted, false, 5)
      if (a.tutor_followups.length) {
        gap(1)
        txt("Teacher's notes — follow-ups:", 9, G.accent, true, 3)
        a.tutor_followups.forEach(f => blt(f, 7))
      }
      break
  }
}

// ── Worksheet PDF ─────────────────────────────────────────────────────────────

export async function generateWorksheetPDF(
  worksheet: WorksheetContent,
  date: string,
  teacherName = 'Teacher',
): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const firstName = teacherName.split(' ')[0] || 'Teacher'
  const pills = [worksheet.level, worksheet.topic].filter(Boolean)
  const startY = drawPageHeader(doc, `Worksheet: ${worksheet.topic}`, pills, date, firstName)
  const { M, W, CW } = PAGE

  // ── Student name / date fields ──────────────────────────────────────────────
  let y = startY
  doc.setFontSize(9)
  doc.setTextColor(G.muted[0], G.muted[1], G.muted[2])
  doc.setFont('helvetica', 'normal')
  doc.text('Name:', M, y)
  doc.setDrawColor(G.border[0], G.border[1], G.border[2])
  doc.setLineWidth(0.4)
  doc.line(M + 12, y, M + 90, y)
  doc.text('Date:', M + 100, y)
  doc.line(M + 112, y, M + 165, y)
  y += 10

  const ctx = makeCtx(doc, y)
  ctx.setY(y)
  const { txt, gap, sHdr, doc: d } = ctx

  // Collect answer keys for final page
  type AKEntry = { num: number; type: string; isMatching: boolean; compact?: string; items: string[]; keys: string[] }
  const answerKeys: AKEntry[] = []

  worksheet.exercises.forEach((ex, i) => {
    // ── Exercise header ──────────────────────────────────────────────────────
    sHdr(`${i + 1}.  ${ex.type}`)
    txt(ex.instructions, 10, G.muted)
    gap(3)

    // ── Reading passage ──────────────────────────────────────────────────────
    if (ex.passage) {
      const passLines: string[] = d.splitTextToSize(ex.passage, CW - 8)
      const boxH = passLines.length * (10 * 0.42) + 8
      ctx.chk(boxH + 4)
      const py = ctx.getY()
      d.setFillColor(G.lightBg[0], G.lightBg[1], G.lightBg[2])
      d.setDrawColor(G.border[0], G.border[1], G.border[2])
      d.setLineWidth(0.3)
      d.rect(M, py - 2, CW, boxH, 'FD')
      d.setFontSize(10)
      d.setTextColor(G.body[0], G.body[1], G.body[2])
      d.setFont('helvetica', 'italic')
      d.text(passLines, M + 4, py + 3)
      ctx.setY(py + boxH + 4)
    }

    // ── Matching exercise ────────────────────────────────────────────────────
    if (ex.matchingPairs && ex.matchingPairs.length > 0 && ex.shuffledRight) {
      const midX = M + CW / 2
      const colW = CW / 2 - 6
      const startRow = ctx.getY()

      ex.matchingPairs.forEach((pair, j) => {
        const leftTxt = `${j + 1}.  ${pair.word}`
        const rightEntry = ex.shuffledRight![j]
        const rightTxt = `${rightEntry.letter}.  ${rightEntry.definition}`
        d.setFontSize(10)
        d.setFont('helvetica', 'normal')
        d.setTextColor(G.body[0], G.body[1], G.body[2])
        const lLines: string[] = d.splitTextToSize(leftTxt, colW)
        const rLines: string[] = d.splitTextToSize(rightTxt, colW)
        const rowH = Math.max(lLines.length, rLines.length) * (10 * 0.42) + 3
        ctx.chk(rowH)
        const ry = ctx.getY()
        d.text(lLines, M + 2, ry)
        d.text(rLines, midX + 2, ry)
        ctx.setY(ry + rowH)
      })

      // Vertical divider between columns
      d.setDrawColor(G.border[0], G.border[1], G.border[2])
      d.setLineWidth(0.3)
      d.line(midX, startRow - 1, midX, ctx.getY())

      if (ex.compactAnswerKey) {
        answerKeys.push({ num: i + 1, type: ex.type, isMatching: true, compact: ex.compactAnswerKey, items: [], keys: [] })
      }
    } else {
      // ── Regular items ──────────────────────────────────────────────────────
      ex.items.forEach((item, j) => {
        const clean = item.replace(/^\d+[\.\)]\s*/, '')
        txt(`${j + 1}.  ${clean}`, 10, G.body, false, 5)
        gap(4)
      })

      if (ex.answerKey && ex.answerKey.length > 0) {
        answerKeys.push({ num: i + 1, type: ex.type, isMatching: false, items: ex.items, keys: ex.answerKey })
      }
    }

    gap(6)
  })

  // ── Answer Key page ─────────────────────────────────────────────────────────
  const hasAnswers = answerKeys.length > 0 && answerKeys.some(a => a.compact || a.keys.length > 0)
  if (hasAnswers) {
    d.addPage()
    let ay = PAGE.M + 6

    // "ANSWER KEY" title
    d.setFillColor(G.green[0], G.green[1], G.green[2])
    d.rect(M, ay, 3, 9, 'F')
    d.setFontSize(14)
    d.setTextColor(G.dark[0], G.dark[1], G.dark[2])
    d.setFont('helvetica', 'bold')
    d.text('ANSWER KEY', M + 6, ay + 6.5)
    ay += 14

    d.setDrawColor(G.border[0], G.border[1], G.border[2])
    d.setLineWidth(0.3)
    d.line(M, ay, W - M, ay)
    ay += 6

    answerKeys.forEach(ak => {
      if (ay > PAGE.FOOTER_Y - 30) { d.addPage(); ay = PAGE.M + 6 }

      d.setFontSize(11)
      d.setTextColor(G.dark[0], G.dark[1], G.dark[2])
      d.setFont('helvetica', 'bold')
      d.text(`${ak.num}.  ${ak.type}`, M, ay)
      ay += 6

      if (ak.isMatching && ak.compact) {
        d.setFontSize(10)
        d.setTextColor(G.body[0], G.body[1], G.body[2])
        d.setFont('helvetica', 'normal')
        const lines: string[] = d.splitTextToSize(ak.compact, CW - 5)
        d.text(lines, M + 5, ay)
        ay += lines.length * 5 + 4
      } else {
        ak.keys.forEach((ans, j) => {
          const clean = ans.replace(/^\d+[\.\)]\s*/, '')
          d.setFontSize(10)
          d.setTextColor(G.body[0], G.body[1], G.body[2])
          d.setFont('helvetica', 'normal')
          d.text(`${j + 1}.  ${clean}`, M + 5, ay)
          ay += 5
        })
        ay += 2
      }
      ay += 4
    })
  }

  drawPageFooters(d, `${worksheet.level} · ${worksheet.topic}`)
  d.save(`tyoutorpro-worksheet-${Date.now()}.pdf`)
}

// ── Demo Lesson PDF ───────────────────────────────────────────────────────────

export async function generateDemoLessonPDF(
  demo: DemoLesson,
  teacherName = 'Teacher',
): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const { M, W, CW } = PAGE

  const displayName = teacherName || 'Teacher'
  const pills = [demo.overview.level, demo.overview.duration, demo.targetSchool].filter(Boolean)
  const startY = drawPageHeader(doc, demo.title, pills, '', displayName)
  const ctx = makeCtx(doc, startY)
  const { txt, gap, sHdr, blt, doc: d } = ctx

  // ── Prepared by (prominent — interviews need the name visible) ──────────────
  ctx.chk(10)
  d.setFillColor(G.lightBg[0], G.lightBg[1], G.lightBg[2])
  d.setDrawColor(G.border[0], G.border[1], G.border[2])
  d.setLineWidth(0.3)
  d.rect(M, ctx.getY() - 1, CW, 9, 'FD')
  d.setFontSize(10)
  d.setTextColor(G.muted[0], G.muted[1], G.muted[2])
  d.setFont('helvetica', 'normal')
  d.text('Prepared by', M + 4, ctx.getY() + 5)
  d.setTextColor(G.dark[0], G.dark[1], G.dark[2])
  d.setFont('helvetica', 'bold')
  d.text(displayName, M + 30, ctx.getY() + 5)
  ctx.setY(ctx.getY() + 13)

  // ── Learning Objectives ─────────────────────────────────────────────────────
  sHdr('LEARNING OBJECTIVES')
  demo.overview.objectives.forEach(o => blt(o))
  if (demo.overview.methodology) {
    gap(2)
    txt(`Methodology: ${demo.overview.methodology}`, 10, G.muted, false, 3)
  }
  gap(5)

  // ── Lesson Stages ───────────────────────────────────────────────────────────
  sHdr('LESSON STAGES')
  gap(2)

  demo.stages.forEach((stage, i) => {
    ctx.chk(30)
    const stageY = ctx.getY()

    // Stage header bar
    d.setFillColor(G.lightBg[0], G.lightBg[1], G.lightBg[2])
    d.setDrawColor(G.border[0], G.border[1], G.border[2])
    d.setLineWidth(0.3)
    d.rect(M, stageY - 1, CW, 9, 'FD')

    // Stage number circle
    d.setFillColor(G.green[0], G.green[1], G.green[2])
    d.circle(M + 5, stageY + 3.5, 3.5, 'F')
    d.setFontSize(8)
    d.setTextColor(G.white[0], G.white[1], G.white[2])
    d.setFont('helvetica', 'bold')
    d.text(`${i + 1}`, M + 5, stageY + 5.5, { align: 'center' })

    // Stage name
    d.setFontSize(11)
    d.setTextColor(G.dark[0], G.dark[1], G.dark[2])
    d.setFont('helvetica', 'bold')
    d.text(stage.name, M + 12, stageY + 5.5)

    // Duration (right-aligned)
    d.setFontSize(9)
    d.setTextColor(G.muted[0], G.muted[1], G.muted[2])
    d.setFont('helvetica', 'normal')
    d.text(`⏱ ${stage.duration}`, W - M, stageY + 5.5, { align: 'right' })

    ctx.setY(stageY + 12)

    // Activities block
    txt('Activities:', 10, G.dark, true, 2)
    txt(stage.activities, 10, G.body, false, 4)
    gap(3)

    // "Why This Works" block — green left border + light bg
    const whyLines: string[] = d.splitTextToSize(stage.whyItWorks, CW - 18)
    const whyH = whyLines.length * (10 * 0.42) + 10
    ctx.chk(whyH + 2)
    const wy = ctx.getY()

    d.setFillColor(G.lightBg[0], G.lightBg[1], G.lightBg[2])
    d.rect(M, wy - 1, CW, whyH, 'F')
    d.setFillColor(G.green[0], G.green[1], G.green[2])
    d.rect(M, wy - 1, 3, whyH, 'F')

    d.setFontSize(9)
    d.setTextColor(G.green[0], G.green[1], G.green[2])
    d.setFont('helvetica', 'bold')
    d.text('WHY THIS WORKS', M + 6, wy + 4)

    d.setFontSize(9)
    d.setTextColor(G.body[0], G.body[1], G.body[2])
    d.setFont('helvetica', 'italic')
    d.text(whyLines, M + 6, wy + 9)

    ctx.setY(wy + whyH + 5)
    gap(3)
  })

  // ── Anticipated Problems ────────────────────────────────────────────────────
  // (demo.interviewTips doubles as anticipated-problem guidance)
  if (demo.interviewTips?.length) {
    ctx.chk(14)
    sHdr('INTERVIEW TIPS & ANTICIPATED PROBLEMS', G.terra)
    demo.interviewTips.forEach(t => blt(t))
    gap(5)
  }

  // ── Methodology Notes ───────────────────────────────────────────────────────
  if (demo.methodologyNotes) {
    sHdr('METHODOLOGY NOTES')
    txt(demo.methodologyNotes, 10, G.body)
    gap(4)
  }

  drawPageFooters(d, `Demo Lesson · ${demo.overview.level}`)
  d.save(`tyoutorpro-demo-lesson-${Date.now()}.pdf`)
}
