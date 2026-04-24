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

// ── Worksheet PDF (redesigned) ────────────────────────────────────────────────

export async function generateWorksheetPDF(
  worksheet: WorksheetContent,
  date: string,
  teacherName = 'Teacher',
): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const { M, W, CW, H, FOOTER_Y } = PAGE
  const SAFE_BOTTOM = FOOTER_Y - 4
  const firstName = teacherName.split(' ')[0] || 'Teacher'
  const sfColor: [number, number, number] = [170, 170, 170]

  // ── Custom worksheet header ───────────────────────────────────────────────────
  // Returns y where body content starts.
  const drawWorksheetHeader = (): number => {
    // Brand bar (same as drawPageHeader)
    doc.setFillColor(G.lightBg[0], G.lightBg[1], G.lightBg[2])
    doc.rect(0, 0, W, 20, 'F')
    doc.setFillColor(G.green[0], G.green[1], G.green[2])
    doc.roundedRect(M, 5.5, 8, 8, 1.3, 1.3, 'F')
    doc.setFontSize(7.5); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
    doc.text('T', M + 4, 11.8, { align: 'center' })
    const BX = M + 11; const BY = 12
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(G.dark[0], G.dark[1], G.dark[2])
    doc.text('Tyoutor', BX, BY)
    const tyw = doc.getTextWidth('Tyoutor')
    doc.setTextColor(G.terra[0], G.terra[1], G.terra[2])
    doc.text(' Pro', BX + tyw, BY)
    doc.setFontSize(8.5); doc.setTextColor(G.muted[0], G.muted[1], G.muted[2]); doc.setFont('helvetica', 'normal')
    doc.text(`Prepared by ${firstName}`, W - M, BY, { align: 'right' })
    doc.setDrawColor(G.border[0], G.border[1], G.border[2]); doc.setLineWidth(0.3)
    doc.line(0, 20, W, 20)

    // ── Title + student fields side-by-side ────────────────────────────────────
    const CONTENT_Y = 27
    const TITLE_MAX_W = CW * 0.52          // ~94 mm, leaves room for fields
    const SF_X = M + TITLE_MAX_W + 6       // student fields start x

    // Title: 22pt bold #1A1A1A
    doc.setFontSize(22); doc.setTextColor(G.dark[0], G.dark[1], G.dark[2]); doc.setFont('helvetica', 'bold')
    const titleLines: string[] = doc.splitTextToSize(worksheet.topic, TITLE_MAX_W)
    doc.text(titleLines, M, CONTENT_Y)
    const titleEndY = CONTENT_Y + titleLines.length * (22 * 0.42)

    // Student fields right-aligned block (top-right of page)
    doc.setFontSize(11); doc.setTextColor(sfColor[0], sfColor[1], sfColor[2]); doc.setFont('helvetica', 'normal')
    doc.text('Name:', SF_X, CONTENT_Y)
    const nameLW = doc.getTextWidth('Name:')
    doc.setDrawColor(sfColor[0], sfColor[1], sfColor[2]); doc.setLineWidth(0.3)
    doc.line(SF_X + nameLW + 2, CONTENT_Y + 0.5, W - M, CONTENT_Y + 0.5)
    const sf2Y = CONTENT_Y + 7
    doc.text('Date:', SF_X, sf2Y)
    const dateLW = doc.getTextWidth('Date:')
    doc.line(SF_X + dateLW + 2, sf2Y + 0.5, W - M, sf2Y + 0.5)
    const sfEndY = sf2Y + 5

    let ty = Math.max(titleEndY, sfEndY) + 3

    // Accent underline: #52B788, ~0.8mm thick, 50% page width
    doc.setDrawColor(G.accent[0], G.accent[1], G.accent[2]); doc.setLineWidth(0.8)
    doc.line(M, ty, M + CW * 0.5, ty)
    doc.setLineWidth(0.3); ty += 5

    // Level + topic pills
    const pills = [worksheet.level, worksheet.topic].filter(Boolean)
    if (pills.length > 0) {
      let px = M
      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal')
      for (const pill of pills) {
        if (!pill) continue
        const tw = doc.getTextWidth(pill)
        const pw = tw + 5; const ph = 4.8; const py = ty - 3.5
        doc.setFillColor(G.lightBg[0], G.lightBg[1], G.lightBg[2])
        doc.setDrawColor(G.border[0], G.border[1], G.border[2]); doc.setLineWidth(0.25)
        doc.roundedRect(px, py, pw, ph, 1.2, 1.2, 'FD')
        doc.setTextColor(102, 102, 102)
        doc.text(pill, px + 2.5, ty)
        px += pw + 2.5
      }
      ty += 4
    }

    // Date line
    if (date) {
      ty += 2
      doc.setFontSize(8.5); doc.setTextColor(G.bbb[0], G.bbb[1], G.bbb[2]); doc.setFont('helvetica', 'normal')
      doc.text(date, M, ty); ty += 4
    }

    // Separator before body
    ty += 2
    doc.setDrawColor(G.border[0], G.border[1], G.border[2]); doc.setLineWidth(0.3)
    doc.line(M, ty, W - M, ty)
    return ty + 7
  }

  let y = drawWorksheetHeader()

  // ── Helpers ───────────────────────────────────────────────────────────────────
  type AKEntry = { num: number; type: string; isMatching: boolean; compact?: string; items: string[]; keys: string[] }
  const answerKeys: AKEntry[] = []

  const addPage = () => { doc.addPage(); y = PAGE.M + 6 }
  const chk = (needed: number) => { if (y + needed > SAFE_BOTTOM) addPage() }

  // Renders a gap-fill item inline with green underlines replacing ___
  const drawGapFillItem = (text: string, num: number) => {
    const BLANK_W = 22
    const parts = text.split(/_{2,}/)
    chk(8)
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(G.body[0], G.body[1], G.body[2])
    const numStr = `${num}.  `
    doc.text(numStr, M, y)
    let lx = M + doc.getTextWidth(numStr)
    const maxX = M + CW

    parts.forEach((part, pi) => {
      // Render each word of the text segment
      part.split(' ').forEach(tok => {
        if (!tok) return
        const tw = doc.getTextWidth(tok)
        if (lx + tw > maxX) { y += 10 * 0.42 + 1.5; lx = M + 8; chk(8) }
        doc.setTextColor(G.body[0], G.body[1], G.body[2])
        doc.text(tok, lx, y)
        lx += tw + doc.getTextWidth(' ')
      })
      // Green underline for each blank slot
      if (pi < parts.length - 1) {
        if (lx + BLANK_W > maxX) { y += 10 * 0.42 + 1.5; lx = M + 8 }
        doc.setDrawColor(G.green[0], G.green[1], G.green[2]); doc.setLineWidth(0.5)
        doc.line(lx, y + 1.5, lx + BLANK_W, y + 1.5)
        doc.setLineWidth(0.3)
        lx += BLANK_W + 2
      }
    })
    y += 10 * 0.42 + 6
  }

  // ── Exercise sections ─────────────────────────────────────────────────────────
  worksheet.exercises.forEach((ex, i) => {
    // Section divider between exercises (not before first)
    if (i > 0) {
      y += 4
      doc.setDrawColor(G.border[0], G.border[1], G.border[2]); doc.setLineWidth(0.3)
      doc.line(M, y, W - M, y)
      y += 5
    }

    // ── Numbered square badge + exercise type ──────────────────────────────────
    const BADGE_S = 5
    chk(BADGE_S + 14)
    const badgeY = y
    doc.setFillColor(G.green[0], G.green[1], G.green[2])
    doc.roundedRect(M, badgeY, BADGE_S, BADGE_S, 1.1, 1.1, 'F')
    doc.setFontSize(10); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
    doc.text(`${i + 1}`, M + BADGE_S / 2, badgeY + BADGE_S / 2 + 1.3, { align: 'center' })

    // Exercise type label (14pt bold #1A1A1A)
    doc.setFontSize(14); doc.setTextColor(G.dark[0], G.dark[1], G.dark[2]); doc.setFont('helvetica', 'bold')
    doc.text(ex.type, M + BADGE_S + 3, badgeY + BADGE_S / 2 + 1.5)
    y = badgeY + BADGE_S + 4

    // Instruction line (10pt italic #999)
    if (ex.instructions) {
      doc.setFontSize(10); doc.setTextColor(G.muted[0], G.muted[1], G.muted[2]); doc.setFont('helvetica', 'italic')
      const instrLines: string[] = doc.splitTextToSize(ex.instructions, CW)
      doc.text(instrLines, M, y)
      y += instrLines.length * (10 * 0.42) + 4
    }

    // ── Reading passage box ────────────────────────────────────────────────────
    if (ex.passage) {
      const passLines: string[] = doc.splitTextToSize(ex.passage, CW - 8)
      const boxH = passLines.length * (10 * 0.42) + 8
      chk(boxH + 4)
      const py = y
      doc.setFillColor(G.lightBg[0], G.lightBg[1], G.lightBg[2])
      doc.setDrawColor(G.border[0], G.border[1], G.border[2]); doc.setLineWidth(0.3)
      doc.rect(M, py - 2, CW, boxH, 'FD')
      doc.setFontSize(10); doc.setTextColor(G.body[0], G.body[1], G.body[2]); doc.setFont('helvetica', 'italic')
      doc.text(passLines, M + 4, py + 3)
      y = py + boxH + 4
    }

    // ── Matching: two-column with column headers + dotted divider ──────────────
    if (ex.matchingPairs && ex.matchingPairs.length > 0 && ex.shuffledRight) {
      const midX = M + CW / 2
      const colW = CW / 2 - 6

      // Column headers
      doc.setFontSize(9); doc.setTextColor(G.muted[0], G.muted[1], G.muted[2]); doc.setFont('helvetica', 'bold')
      doc.text('Column A', M, y)
      doc.text('Column B', W - M, y, { align: 'right' })
      y += 5
      const startRow = y

      ex.matchingPairs.forEach((pair, j) => {
        const leftTxt = `${j + 1}.  ${pair.word}`
        const rightEntry = ex.shuffledRight![j]
        const rightTxt = `${rightEntry.letter}.  ${rightEntry.definition}`
        doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(G.body[0], G.body[1], G.body[2])
        const lLines: string[] = doc.splitTextToSize(leftTxt, colW)
        const rLines: string[] = doc.splitTextToSize(rightTxt, colW)
        const rowH = Math.max(lLines.length, rLines.length) * (10 * 0.42) + 4
        chk(rowH)
        const ry = y
        doc.text(lLines, M, ry)
        doc.text(rLines, W - M, ry, { align: 'right' })
        y = ry + rowH
      })

      // Dotted vertical divider
      doc.setDrawColor(G.border[0], G.border[1], G.border[2])
      doc.setLineDashPattern([1, 2], 0); doc.setLineWidth(0.3)
      doc.line(midX, startRow - 1, midX, y)
      doc.setLineDashPattern([], 0)

      if (ex.compactAnswerKey) {
        answerKeys.push({ num: i + 1, type: ex.type, isMatching: true, compact: ex.compactAnswerKey, items: [], keys: [] })
      }
    } else {
      // ── Regular / gap-fill items ───────────────────────────────────────────
      ex.items.forEach((item, j) => {
        const clean = item.replace(/^\d+[.)]\s*/, '').trim()
        if (clean.includes('___')) {
          drawGapFillItem(clean, j + 1)
        } else {
          chk(8)
          doc.setFontSize(10); doc.setTextColor(G.body[0], G.body[1], G.body[2]); doc.setFont('helvetica', 'normal')
          const label = `${j + 1}.  ${clean}`
          const lines: string[] = doc.splitTextToSize(label, CW - 5)
          doc.text(lines, M, y)
          y += lines.length * (10 * 0.42) + 6
        }
      })

      if (ex.answerKey && ex.answerKey.length > 0) {
        answerKeys.push({ num: i + 1, type: ex.type, isMatching: false, items: ex.items, keys: ex.answerKey })
      }
    }
  })

  // ── Answer Key: new page, #FAFAF6 background, two-column compact grid ─────────
  const hasAnswers = answerKeys.length > 0 && answerKeys.some(a => a.compact || a.keys.length > 0)
  if (hasAnswers) {
    const startAKPage = () => {
      doc.addPage()
      doc.setFillColor(G.lightBg[0], G.lightBg[1], G.lightBg[2])
      doc.rect(0, 0, W, H, 'F')
      return PAGE.M + 6
    }

    let ay = startAKPage()

    // Header: 'ANSWER KEY' 14pt bold #999
    doc.setFontSize(14); doc.setTextColor(G.muted[0], G.muted[1], G.muted[2]); doc.setFont('helvetica', 'bold')
    doc.text('ANSWER KEY', M, ay + 7)
    ay += 14

    doc.setDrawColor(G.border[0], G.border[1], G.border[2]); doc.setLineWidth(0.3)
    doc.line(M, ay, W - M, ay)
    ay += 6

    const AK_COL_GAP = 8
    const AK_COL_W = (CW - AK_COL_GAP) / 2
    const AK_COL2_X = M + AK_COL_W + AK_COL_GAP

    answerKeys.forEach(ak => {
      if (ay > PAGE.FOOTER_Y - 30) { ay = startAKPage() }

      // Exercise label
      doc.setFontSize(11); doc.setTextColor(G.dark[0], G.dark[1], G.dark[2]); doc.setFont('helvetica', 'bold')
      doc.text(`${ak.num}.  ${ak.type}`, M, ay)
      ay += 6

      if (ak.isMatching && ak.compact) {
        doc.setFontSize(10); doc.setTextColor(G.body[0], G.body[1], G.body[2]); doc.setFont('helvetica', 'normal')
        const lines: string[] = doc.splitTextToSize(ak.compact, CW - 5)
        doc.text(lines, M + 5, ay)
        ay += lines.length * 5 + 4
      } else if (ak.keys.length > 0) {
        // Two-column compact grid
        const half = Math.ceil(ak.keys.length / 2)
        for (let r = 0; r < half; r++) {
          const leftAns = (ak.keys[r] ?? '').replace(/^\d+[.)]\s*/, '')
          const rightAns = (ak.keys[r + half] ?? '').replace(/^\d+[.)]\s*/, '')
          doc.setFontSize(10); doc.setTextColor(G.body[0], G.body[1], G.body[2]); doc.setFont('helvetica', 'normal')
          if (leftAns) doc.text(`${r + 1}.  ${leftAns}`, M + 5, ay)
          if (rightAns) doc.text(`${r + half + 1}.  ${rightAns}`, AK_COL2_X, ay)
          ay += 5.5
        }
        ay += 2
      }
      ay += 5
    })
  }

  drawPageFooters(doc, `${worksheet.level} · ${worksheet.topic}`)
  doc.save(`tyoutorpro-worksheet-${Date.now()}.pdf`)
}

// ── Demo Lesson PDF (redesigned — premium interview document) ─────────────────

export async function generateDemoLessonPDF(
  demo: DemoLesson,
  teacherName = 'Teacher',
): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const { M, W, CW, FOOTER_Y } = PAGE

  const displayName = teacherName || 'Teacher'

  // Brand bar + title (targetSchool as context pill in header)
  const startY = drawPageHeader(doc, demo.title, [demo.targetSchool].filter(Boolean) as string[], '', displayName)

  // ── Layout constants ──────────────────────────────────────────────────────────
  const PAD = 4
  const HDR_H = 7
  const BAR_W = 1.2
  const CARD_GAP = 5
  const CX = M + BAR_W + 4
  const CW2 = CW - BAR_W - 8
  const SAFE_BOTTOM = FOOTER_Y - 4

  let y = startY
  let si = 0

  // ── Measure helpers ───────────────────────────────────────────────────────────
  const mText = (s: string, fs: number, indent = 0): number => {
    if (!s?.trim()) return 0
    doc.setFontSize(fs)
    const lines: string[] = doc.splitTextToSize(s.trim(), CW2 - indent)
    return lines.length * (fs * 0.42) + 1
  }
  const mGap = (mm = 4) => mm
  const mBlt = (s: string) => mText(`• ${s}`, 10, 5) + 1

  // ── Draw helpers ──────────────────────────────────────────────────────────────
  const dText = (s: string, fs: number, c: [number, number, number], bold = false, indent = 0) => {
    const str = s?.trim()
    if (!str) return
    doc.setFontSize(fs); doc.setTextColor(c[0], c[1], c[2]); doc.setFont('helvetica', bold ? 'bold' : 'normal')
    const lines: string[] = doc.splitTextToSize(str, CW2 - indent)
    doc.text(lines, CX + indent, y)
    y += lines.length * (fs * 0.42) + 1
  }
  const dGap = (mm = 4) => { y += mm }
  const dBlt = (s: string) => { dText(`• ${s}`, 10, G.body, false, 5); y += 1 }
  const newPage = () => { doc.addPage(); y = PAGE.M + 4 }

  // ── Two-pass section card (stageNum adds a numbered circle before label) ──────
  const card = (
    label: string,
    timing: string | undefined,
    measureFn: () => number,
    drawFn: () => void,
    stageNum?: number,
  ) => {
    const contentH = measureFn()
    const cardH = PAD + HDR_H + contentH + PAD
    const maxFit = SAFE_BOTTOM - (PAGE.M + 4)
    if (cardH <= maxFit && y + cardH > SAFE_BOTTOM) newPage()

    const cardY = y
    const bg: [number, number, number] = si % 2 === 0 ? [250, 250, 246] : [255, 255, 255]
    si++

    doc.setFillColor(bg[0], bg[1], bg[2])
    doc.setDrawColor(G.border[0], G.border[1], G.border[2]); doc.setLineWidth(0.3)
    doc.roundedRect(M, cardY, CW, cardH, 1.6, 1.6, 'FD')

    doc.setFillColor(G.green[0], G.green[1], G.green[2])
    doc.rect(M, cardY + 2, BAR_W, cardH - 4, 'F')

    // Optional numbered circle in header
    let labelX = CX
    if (stageNum !== undefined) {
      const cx = CX + 3; const cy = cardY + HDR_H / 2
      doc.setFillColor(G.green[0], G.green[1], G.green[2])
      doc.circle(cx, cy, 3, 'F')
      doc.setFontSize(8); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
      doc.text(`${stageNum}`, cx, cy + 1.1, { align: 'center' })
      labelX = CX + 9
    }

    doc.setFontSize(13); doc.setTextColor(G.green[0], G.green[1], G.green[2]); doc.setFont('helvetica', 'bold')
    doc.text(label, labelX, cardY + 5.8)

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

    y = cardY + PAD + HDR_H
    drawFn()
    y += PAD + CARD_GAP
  }

  // ── Teacher name (prominent — 16pt #444) ──────────────────────────────────────
  doc.setFontSize(16); doc.setTextColor(68, 68, 68); doc.setFont('helvetica', 'bold')
  doc.text(`Prepared by ${displayName}`, M, y)
  y += 9

  // ── Metadata pills: Level / Duration / Focus ──────────────────────────────────
  const metaPills = [
    demo.overview.level ? `Level: ${demo.overview.level}` : '',
    demo.overview.duration ? `Duration: ${demo.overview.duration}` : '',
    demo.overview.methodology ? `Focus: ${demo.overview.methodology}` : '',
  ].filter(Boolean)

  if (metaPills.length > 0) {
    let px = M
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal')
    for (const pill of metaPills) {
      const tw = doc.getTextWidth(pill)
      const pw = tw + 5; const ph = 4.8; const pyl = y - 3.5
      doc.setFillColor(G.accentBg[0], G.accentBg[1], G.accentBg[2])
      doc.setDrawColor(G.accentBd[0], G.accentBd[1], G.accentBd[2]); doc.setLineWidth(0.25)
      doc.roundedRect(px, pyl, pw, ph, 1.2, 1.2, 'FD')
      doc.setTextColor(G.green[0], G.green[1], G.green[2])
      doc.text(pill, px + 2.5, y)
      px += pw + 2.5
    }
    y += 6
  }

  // Separator
  y += 2
  doc.setDrawColor(G.border[0], G.border[1], G.border[2]); doc.setLineWidth(0.3)
  doc.line(M, y, W - M, y)
  y += 6

  // ── Materials Needed box (#F0FFF4 bg, #C8E6C9 border) — conditional ───────────
  const materials = (demo.overview as any).materials as string[] | undefined
  if (materials?.length) {
    doc.setFontSize(10)
    const matLineBlocks: string[][] = materials.map(m => doc.splitTextToSize(`• ${m}`, CW - 8))
    const matContentH = matLineBlocks.reduce((s, ls) => s + ls.length * (10 * 0.42) + 3, 0)
    const matBoxH = matContentH + 10
    if (y + matBoxH > SAFE_BOTTOM) newPage()
    const my = y
    doc.setFillColor(G.accentBg[0], G.accentBg[1], G.accentBg[2])
    doc.setDrawColor(G.accentBd[0], G.accentBd[1], G.accentBd[2]); doc.setLineWidth(0.3)
    doc.roundedRect(M, my, CW, matBoxH, 1.6, 1.6, 'FD')
    doc.setFontSize(9); doc.setTextColor(G.green[0], G.green[1], G.green[2]); doc.setFont('helvetica', 'bold')
    doc.text('MATERIALS NEEDED', M + 4, my + 5)
    y = my + 9
    doc.setFontSize(10); doc.setTextColor(G.body[0], G.body[1], G.body[2]); doc.setFont('helvetica', 'normal')
    matLineBlocks.forEach(ls => { doc.text(ls, M + 4, y); y += ls.length * (10 * 0.42) + 3 })
    y = my + matBoxH + 5
  }

  // ── Learning Objectives ───────────────────────────────────────────────────────
  card('LEARNING OBJECTIVES', undefined,
    () => {
      let h = 0
      demo.overview.objectives?.forEach(o => { h += mBlt(o) })
      return h
    },
    () => { demo.overview.objectives?.forEach(o => dBlt(o)) }
  )

  // ── Lesson Stages ─────────────────────────────────────────────────────────────
  demo.stages?.forEach((stage, i) => {
    // Stage card with numbered circle in header
    card(stage.name, stage.duration,
      () => {
        let h = mText('Activities:', 10) + mGap(1)
        h += mText(stage.activities, 10, 3)
        return h
      },
      () => {
        dText('Activities:', 10, G.dark, true)
        dGap(1)
        dText(stage.activities, 10, G.body, false, 3)
      },
      i + 1,
    )

    // 'Why This Works' box: #F7F6F2 bg, #E8E4DE border, 6px radius, green label
    if (stage.whyItWorks) {
      doc.setFontSize(10)
      const whyLines: string[] = doc.splitTextToSize(stage.whyItWorks.trim(), CW - 8)
      const whyH = whyLines.length * (10 * 0.42) + 12
      if (y + whyH > SAFE_BOTTOM) newPage()
      const wy = y
      doc.setFillColor(G.lightBg[0], G.lightBg[1], G.lightBg[2])
      doc.setDrawColor(G.border[0], G.border[1], G.border[2]); doc.setLineWidth(0.3)
      doc.roundedRect(M, wy, CW, whyH, 1.6, 1.6, 'FD')
      doc.setFontSize(9); doc.setTextColor(G.green[0], G.green[1], G.green[2]); doc.setFont('helvetica', 'bold')
      doc.text('\u{1F4A1} Why this works', M + 4, wy + 4.5)
      doc.setFontSize(10); doc.setTextColor(102, 102, 102); doc.setFont('helvetica', 'normal')
      doc.text(whyLines, M + 4, wy + 9)
      y = wy + whyH + CARD_GAP
    }
  })

  // ── Anticipated Problems: terra callout, Problem | Solution two-column ─────────
  if (demo.interviewTips?.length) {
    // Parse each tip into problem / solution pair
    const tipRows = demo.interviewTips.map(t => {
      const pipe = t.indexOf(' | ')
      if (pipe > -1) return { problem: t.slice(0, pipe).trim(), solution: t.slice(pipe + 3).trim() }
      const colon = t.indexOf(': ')
      if (colon > -1 && colon < 40) return { problem: t.slice(0, colon).trim(), solution: t.slice(colon + 2).trim() }
      return { problem: t, solution: '' }
    })

    const hasSolutions = tipRows.some(r => r.solution)
    const COL_GAP = 6
    const COL_W = (CW2 - COL_GAP) / 2
    const COL2_X = CX + COL_W + COL_GAP

    // Measure total box height
    doc.setFontSize(10)
    let boxH = 12 + (hasSolutions ? 7 : 0)  // header + optional col headers
    tipRows.forEach(row => {
      const pL: string[] = doc.splitTextToSize(row.problem, COL_W)
      const sL: string[] = row.solution ? doc.splitTextToSize(row.solution, COL_W) : []
      boxH += Math.max(pL.length, sL.length || 1) * (10 * 0.42) + 4
    })
    boxH += 4  // bottom padding

    if (y + boxH > SAFE_BOTTOM) newPage()
    const by = y

    // Box: #FFF5F2 bg, 1.5mm terra left bar, border
    doc.setFillColor(G.terraBg[0], G.terraBg[1], G.terraBg[2])
    doc.setDrawColor(G.border[0], G.border[1], G.border[2]); doc.setLineWidth(0.3)
    doc.roundedRect(M, by, CW, boxH, 1.6, 1.6, 'FD')
    doc.setFillColor(G.terra[0], G.terra[1], G.terra[2])
    doc.rect(M, by + 2, 1.5, boxH - 4, 'F')

    // Header
    doc.setFontSize(9); doc.setTextColor(G.terra[0], G.terra[1], G.terra[2]); doc.setFont('helvetica', 'bold')
    doc.text('⚠️ ANTICIPATED PROBLEMS', CX, by + 5.5)
    y = by + 11

    // Column headers (if split data available)
    if (hasSolutions) {
      doc.setFontSize(8); doc.setTextColor(G.muted[0], G.muted[1], G.muted[2]); doc.setFont('helvetica', 'bold')
      doc.text('PROBLEM', CX, y)
      doc.text('SOLUTION', COL2_X, y)
      y += 3
      doc.setDrawColor(G.border[0], G.border[1], G.border[2]); doc.setLineWidth(0.2)
      doc.line(CX, y + 1, M + CW - 2, y + 1)
      y += 4
    }

    // Rows
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    tipRows.forEach(row => {
      const pL: string[] = doc.splitTextToSize(row.problem, COL_W)
      const sL: string[] = row.solution ? doc.splitTextToSize(row.solution, COL_W) : []
      const rowH = Math.max(pL.length, sL.length || 1) * (10 * 0.42) + 4
      doc.setTextColor(G.body[0], G.body[1], G.body[2])
      doc.text(pL, CX, y)
      if (sL.length) doc.text(sL, COL2_X, y)
      y += rowH
    })

    y = by + boxH + CARD_GAP
  }

  // ── Methodology Notes ──────────────────────────────────────────────────────────
  if (demo.methodologyNotes) {
    card('METHODOLOGY NOTES', undefined,
      () => mText(demo.methodologyNotes, 10),
      () => dText(demo.methodologyNotes, 10, G.body)
    )
  }

  drawPageFooters(doc, `Demo Lesson · ${demo.overview.level}`)
  doc.save(`tyoutorpro-demo-lesson-${Date.now()}.pdf`)
}
