import type { LessonContent, WorksheetContent, DemoLesson } from '@/types'
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

// ── Lesson Plan PDF (redesigned) ─────────────────────────────────────────────

export async function generateLessonPDF(
  lesson: LessonContent,
  meta: { level: string; topic: string; date: string; nationality?: string; classSize?: string; duration?: string },
  teacherName = 'Teacher',
): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const { M, W, CW, FOOTER_Y } = PAGE

  const firstName = teacherName.split(' ')[0] || 'Teacher'
  const pills = [meta.level, meta.nationality, meta.classSize, meta.duration].filter(Boolean) as string[]
  const startY = drawPageHeader(doc, lesson.title, pills, meta.date, firstName)

  // ── Layout constants ─────────────────────────────────────────────────────────
  const PAD = 4        // card inner padding mm
  const HDR_H = 7      // card header row height mm
  const BAR_W = 1.2    // left accent bar mm
  const CARD_GAP = 4   // gap between cards mm
  const CX = M + BAR_W + 4           // content x inside card
  const CW2 = CW - BAR_W - 8         // content width inside card
  const SAFE_BOTTOM = FOOTER_Y - 4

  let y = startY
  let si = 0  // section index for alternating bg

  // ── Measure helpers (no drawing — use doc only for splitTextToSize metrics) ──
  const mText = (s: string, fs: number, indent = 0): number => {
    if (!s?.trim()) return 0
    doc.setFontSize(fs)
    const lines: string[] = doc.splitTextToSize(s.trim(), CW2 - indent)
    return lines.length * (fs * 0.42) + 1
  }
  const mGap = (mm = 4) => mm
  const mBlt = (s: string) => mText(`• ${s}`, 10, 5) + 1
  const mCallout = (s: string): number => {
    doc.setFontSize(10)
    const lines: string[] = doc.splitTextToSize(s.trim(), CW2 - 8)
    return lines.length * (10 * 0.42) + 12  // box header + text + bottom gap
  }

  // ── Draw helpers ─────────────────────────────────────────────────────────────
  const dText = (s: string, fs: number, c: [number,number,number], bold = false, indent = 0) => {
    const str = s?.trim()
    if (!str) return
    doc.setFontSize(fs)
    doc.setTextColor(c[0], c[1], c[2])
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    const lines: string[] = doc.splitTextToSize(str, CW2 - indent)
    doc.text(lines, CX + indent, y)
    y += lines.length * (fs * 0.42) + 1
  }
  const dGap = (mm = 4) => { y += mm }
  const dBlt = (s: string) => { dText(`• ${s}`, 10, G.body, false, 5); y += 1 }

  const dL1 = (s: string) => {
    doc.setFontSize(10)
    const lines: string[] = doc.splitTextToSize(s.trim(), CW2 - 8)
    const bh = lines.length * (10 * 0.42) + 9
    const by = y
    doc.setFillColor(G.terraBg[0], G.terraBg[1], G.terraBg[2])
    doc.rect(CX, by, CW2, bh, 'F')
    doc.setFillColor(G.terra[0], G.terra[1], G.terra[2])
    doc.rect(CX, by, 1.5, bh, 'F')
    doc.setFontSize(9); doc.setTextColor(G.terra[0], G.terra[1], G.terra[2]); doc.setFont('helvetica', 'bold')
    doc.text('L1 Tip', CX + 3, by + 4.5)
    doc.setFontSize(10); doc.setTextColor(102, 102, 102); doc.setFont('helvetica', 'italic')
    doc.text(lines, CX + 3, by + 8)
    y = by + bh + 3
  }

  const dScript = (s: string) => {
    doc.setFontSize(10)
    const lines: string[] = doc.splitTextToSize(s.trim(), CW2 - 8)
    const bh = lines.length * (10 * 0.42) + 9
    const by = y
    doc.setFillColor(G.lightBg[0], G.lightBg[1], G.lightBg[2])
    doc.rect(CX, by, CW2, bh, 'F')
    doc.setFillColor(G.bbb[0], G.bbb[1], G.bbb[2])
    doc.rect(CX, by, 1.5, bh, 'F')
    doc.setFontSize(9); doc.setTextColor(G.muted[0], G.muted[1], G.muted[2]); doc.setFont('helvetica', 'bold')
    doc.text('Teacher says:', CX + 3, by + 4.5)
    doc.setFontSize(10); doc.setTextColor(85, 85, 85); doc.setFont('helvetica', 'italic')
    doc.text(lines, CX + 3, by + 8)
    y = by + bh + 3
  }

  // ── Two-pass section card ─────────────────────────────────────────────────────
  // measureFn: returns content height (no drawing)
  // drawFn: renders content, advances y
  const card = (
    label: string,
    timing: string | undefined,
    measureFn: () => number,
    drawFn: () => void,
  ) => {
    const contentH = measureFn()
    const cardH = PAD + HDR_H + contentH + PAD
    const maxFit = SAFE_BOTTOM - (PAGE.M + 4)

    // If card fits on a full page but not on this page, start fresh
    if (cardH <= maxFit && y + cardH > SAFE_BOTTOM) {
      doc.addPage(); y = PAGE.M + 4
    }

    const cardY = y
    const bg: [number, number, number] = si % 2 === 0 ? [250, 250, 246] : [255, 255, 255]
    si++

    // Background + border
    doc.setFillColor(bg[0], bg[1], bg[2])
    doc.setDrawColor(G.border[0], G.border[1], G.border[2])
    doc.setLineWidth(0.3)
    doc.roundedRect(M, cardY, CW, cardH, 1.6, 1.6, 'FD')

    // Left accent bar (inset 2 mm from top/bottom to clear rounded corners)
    doc.setFillColor(G.green[0], G.green[1], G.green[2])
    doc.rect(M, cardY + 2, BAR_W, cardH - 4, 'F')

    // Section label
    doc.setFontSize(13); doc.setTextColor(G.green[0], G.green[1], G.green[2]); doc.setFont('helvetica', 'bold')
    doc.text(label, CX, cardY + 5.8)

    // Timing badge
    if (timing) {
      doc.setFontSize(8); doc.setFont('helvetica', 'bold')
      const tw = doc.getTextWidth(timing)
      const bw = tw + 5; const bh = 5
      const bx = W - M - bw; const byi = cardY + 1.5
      doc.setFillColor(G.accent[0], G.accent[1], G.accent[2])
      doc.roundedRect(bx, byi, bw, bh, 1.5, 1.5, 'F')
      doc.setTextColor(G.white[0], G.white[1], G.white[2])
      doc.text(timing, bx + 2.5, byi + 3.5)
    }

    // Render content
    y = cardY + PAD + HDR_H
    drawFn()
    y += PAD + CARD_GAP
  }

  // ── Lesson Overview ───────────────────────────────────────────────────────────
  card('LESSON OVERVIEW', lesson.overview.timing,
    () => {
      let h = 0
      if (lesson.overview.objectives?.length) {
        h += mText('Objectives:', 10) + mGap(1)
        lesson.overview.objectives.forEach(o => { h += mBlt(o) })
      }
      if (lesson.overview.materials?.length) {
        h += mGap(2) + mText('Materials:', 10) + mGap(1)
        lesson.overview.materials.forEach(m => { h += mBlt(m) })
      }
      return h
    },
    () => {
      if (lesson.overview.objectives?.length) {
        dText('Objectives:', 10, G.dark, true); dGap(1)
        lesson.overview.objectives.forEach(o => dBlt(o))
      }
      if (lesson.overview.materials?.length) {
        dGap(2); dText('Materials:', 10, G.dark, true); dGap(1)
        lesson.overview.materials.forEach(m => dBlt(m))
      }
    }
  )

  // ── Warmer ────────────────────────────────────────────────────────────────────
  card('WARMER', lesson.warmer.duration,
    () => {
      let h = mText(lesson.warmer.instructions, 10)
      if (lesson.warmer.teacherNotes) h += mGap(2) + mCallout(lesson.warmer.teacherNotes)
      return h
    },
    () => {
      dText(lesson.warmer.instructions, 10, G.body)
      if (lesson.warmer.teacherNotes) { dGap(2); dScript(lesson.warmer.teacherNotes) }
    }
  )

  // ── Lead-in ───────────────────────────────────────────────────────────────────
  card('LEAD-IN', lesson.leadIn.duration,
    () => {
      let h = mText(lesson.leadIn.instructions, 10)
      if (lesson.leadIn.context) h += mGap(2) + mText(lesson.leadIn.context, 9, 3)
      return h
    },
    () => {
      dText(lesson.leadIn.instructions, 10, G.body)
      if (lesson.leadIn.context) { dGap(2); dText(lesson.leadIn.context, 9, G.muted, false, 3) }
    }
  )

  // ── Main Activity ─────────────────────────────────────────────────────────────
  card('MAIN ACTIVITY', lesson.mainActivity.duration,
    () => {
      let h = mText(lesson.mainActivity.instructions, 10)
      if (lesson.mainActivity.variations) h += mGap(2) + mCallout(lesson.mainActivity.variations)
      if (lesson.mainActivity.teacherNotes) h += mGap(2) + mCallout(lesson.mainActivity.teacherNotes)
      return h
    },
    () => {
      dText(lesson.mainActivity.instructions, 10, G.body)
      if (lesson.mainActivity.variations) { dGap(2); dScript(`Variations: ${lesson.mainActivity.variations}`) }
      if (lesson.mainActivity.teacherNotes) { dGap(2); dScript(lesson.mainActivity.teacherNotes) }
    }
  )

  // ── Language Focus ────────────────────────────────────────────────────────────
  card('LANGUAGE FOCUS', undefined,
    () => {
      let h = mText(lesson.languageFocus.grammar_or_vocab, 11) + mGap(2)
      h += mText(lesson.languageFocus.explanation, 10)
      if (lesson.languageFocus.examples?.length) {
        h += mGap(2) + mText('Examples:', 10) + mGap(1)
        lesson.languageFocus.examples.forEach(e => { h += mBlt(e) })
      }
      if (lesson.languageFocus.commonErrors?.length) {
        h += mGap(1) + mText('Common errors:', 10) + mGap(1)
        lesson.languageFocus.commonErrors.forEach(e => { h += mBlt(e) })
      }
      return h
    },
    () => {
      dText(lesson.languageFocus.grammar_or_vocab, 11, G.dark, true); dGap(2)
      dText(lesson.languageFocus.explanation, 10, G.body)
      if (lesson.languageFocus.examples?.length) {
        dGap(2); dText('Examples:', 10, G.dark, true); dGap(1)
        lesson.languageFocus.examples.forEach(e => dBlt(e))
      }
      if (lesson.languageFocus.commonErrors?.length) {
        dGap(1); dText('Common errors:', 10, G.dark, true); dGap(1)
        lesson.languageFocus.commonErrors.forEach(e => dBlt(e))
      }
    }
  )

  // ── L1-Aware Notes ────────────────────────────────────────────────────────────
  card(`L1 NOTES  ·  ${lesson.l1Notes.nationality}`, undefined,
    () => {
      let h = 0
      if (lesson.l1Notes.specificChallenges?.length) {
        h += mText('Challenges:', 10) + mGap(1)
        lesson.l1Notes.specificChallenges.forEach(c => { h += mCallout(c) })
      }
      if (lesson.l1Notes.tips?.length) {
        h += mGap(2) + mText('Teaching tips:', 10) + mGap(1)
        lesson.l1Notes.tips.forEach(t => { h += mBlt(t) })
      }
      return h
    },
    () => {
      if (lesson.l1Notes.specificChallenges?.length) {
        dText('Challenges:', 10, G.dark, true); dGap(1)
        lesson.l1Notes.specificChallenges.forEach(c => dL1(c))
      }
      if (lesson.l1Notes.tips?.length) {
        dGap(2); dText('Teaching tips:', 10, G.dark, true); dGap(1)
        lesson.l1Notes.tips.forEach(t => dBlt(t))
      }
    }
  )

  // ── Cultural Note ─────────────────────────────────────────────────────────────
  if (lesson.culturalNote?.hasCulturalConsideration && lesson.culturalNote.note) {
    card('CULTURAL NOTE', undefined,
      () => mText(lesson.culturalNote.note, 10),
      () => dText(lesson.culturalNote.note, 10, G.body)
    )
  }

  // ── Practice Exercises ────────────────────────────────────────────────────────
  const answerKeys: Array<{ num: number; type: string; key: string }> = []

  card('PRACTICE EXERCISES', undefined,
    () => {
      let h = 0
      lesson.exercises.forEach((ex, i) => {
        h += mGap(2) + mText(`${i + 1}.  ${ex.type}`, 11) + mGap(1)
        h += mText(ex.instructions, 9, 3) + mGap(2)
        h += mText(ex.content, 10, 3) + mGap(4)
      })
      return h
    },
    () => {
      lesson.exercises.forEach((ex, i) => {
        dGap(2)
        // Numbered circle
        const cx = CX + 3; const cy = y + 2.5
        doc.setFillColor(G.green[0], G.green[1], G.green[2])
        doc.circle(cx, cy, 2.8, 'F')
        doc.setFontSize(8); doc.setTextColor(G.white[0], G.white[1], G.white[2]); doc.setFont('helvetica', 'bold')
        doc.text(`${i + 1}`, cx, cy + 1, { align: 'center' })
        // Exercise type label
        dText(ex.type, 11, G.dark, true, 9)
        dGap(1)
        dText(ex.instructions, 9, G.muted, false, 3)
        dGap(2)
        dText(ex.content, 10, G.body, false, 3)
        if (ex.answerKey) answerKeys.push({ num: i + 1, type: ex.type, key: ex.answerKey })
        dGap(4)
      })
    }
  )

  // ── Speaking Task ─────────────────────────────────────────────────────────────
  card('SPEAKING TASK', lesson.speakingTask.duration,
    () => {
      let h = mText(lesson.speakingTask.instructions, 10) + mGap(2)
      lesson.speakingTask.prompts?.forEach(p => { h += mBlt(p) })
      return h
    },
    () => {
      dText(lesson.speakingTask.instructions, 10, G.body); dGap(2)
      lesson.speakingTask.prompts?.forEach(p => dBlt(p))
    }
  )

  // ── Exit Ticket ───────────────────────────────────────────────────────────────
  card('EXIT TICKET', undefined,
    () => {
      let h = mText(lesson.exitTicket.instructions, 10) + mGap(2)
      lesson.exitTicket.questions?.forEach(q => { h += mBlt(q) })
      return h
    },
    () => {
      dText(lesson.exitTicket.instructions, 10, G.body); dGap(2)
      lesson.exitTicket.questions?.forEach(q => dBlt(q))
    }
  )

  // ── Homework ──────────────────────────────────────────────────────────────────
  if (lesson.homework?.instructions) {
    card('HOMEWORK', 'Optional',
      () => mText(lesson.homework.instructions, 10),
      () => dText(lesson.homework.instructions, 10, G.body)
    )
  }

  // ── Answer Key ────────────────────────────────────────────────────────────────
  if (answerKeys.length > 0) {
    y += 2
    doc.setDrawColor(G.border[0], G.border[1], G.border[2])
    doc.setLineDashPattern([2, 2], 0)
    doc.line(M, y, W - M, y)
    doc.setLineDashPattern([], 0)
    y += 6

    doc.setFontSize(12); doc.setTextColor(G.muted[0], G.muted[1], G.muted[2]); doc.setFont('helvetica', 'bold')
    doc.text('ANSWER KEY', M, y)
    y += 7

    answerKeys.forEach(ak => {
      if (y > SAFE_BOTTOM - 20) { doc.addPage(); y = PAGE.M + 4 }
      doc.setFontSize(10); doc.setTextColor(G.dark[0], G.dark[1], G.dark[2]); doc.setFont('helvetica', 'bold')
      doc.text(`Exercise ${ak.num}  (${ak.type})`, M, y)
      y += 5
      doc.setFontSize(10); doc.setTextColor(102, 102, 102); doc.setFont('helvetica', 'normal')
      const akLines: string[] = doc.splitTextToSize(ak.key, CW - 5)
      doc.text(akLines, M + 5, y)
      y += akLines.length * (10 * 0.42) + 5
    })
  }

  drawPageFooters(doc, `${meta.level} · ${meta.topic}`)
  doc.save(`tyoutorpro-lesson-${Date.now()}.pdf`)
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
