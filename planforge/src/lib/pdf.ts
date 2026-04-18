import { LessonContent, WorksheetContent } from '@/types'

export async function generateLessonPDF(lesson: LessonContent, meta: { level: string; topic: string; date: string }) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = 20

  const checkPageBreak = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 25) {
      doc.addPage()
      y = 20
    }
  }

  const addText = (text: string, fontSize: number, color: [number, number, number], bold = false, indent = 0) => {
    doc.setFontSize(fontSize)
    doc.setTextColor(...color)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    const lines = doc.splitTextToSize(text, contentWidth - indent)
    checkPageBreak(lines.length * (fontSize * 0.4) + 4)
    doc.text(lines, margin + indent, y)
    y += lines.length * (fontSize * 0.4) + 4
  }

  const addSection = (title: string) => {
    checkPageBreak(12)
    doc.setFillColor(13, 148, 136)
    doc.roundedRect(margin, y - 4, contentWidth, 10, 2, 2, 'F')
    doc.setFontSize(11)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text(title, margin + 4, y + 3)
    y += 12
  }

  // Header
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, pageWidth, 28, 'F')
  doc.setFontSize(20)
  doc.setTextColor(13, 148, 136)
  doc.setFont('helvetica', 'bold')
  doc.text('Tyoutor Pro', margin, 16)
  doc.setFontSize(10)
  doc.setTextColor(148, 163, 184)
  doc.setFont('helvetica', 'normal')
  doc.text('tyoutorpro.io', margin, 23)
  y = 38

  // Title
  addText(lesson.title, 18, [15, 23, 42], true)
  y += 2

  // Meta
  const metaText = `Level: ${meta.level}  |  Topic: ${meta.topic}  |  Generated: ${meta.date}`
  addText(metaText, 9, [100, 116, 139])
  y += 6

  // Overview
  addSection('LESSON OVERVIEW')
  addText(`Duration: ${lesson.overview.timing}`, 10, [30, 41, 59])
  y += 2
  addText('Objectives:', 10, [30, 41, 59], true)
  lesson.overview.objectives.forEach(obj => addText(`• ${obj}`, 10, [51, 65, 85], false, 4))
  addText('Materials:', 10, [30, 41, 59], true)
  lesson.overview.materials.forEach(mat => addText(`• ${mat}`, 10, [51, 65, 85], false, 4))
  y += 4

  // Warmer
  addSection(`WARMER (${lesson.warmer.duration})`)
  addText(lesson.warmer.instructions, 10, [30, 41, 59])
  if (lesson.warmer.teacherNotes) {
    addText('Teacher Note:', 10, [13, 148, 136], true)
    addText(lesson.warmer.teacherNotes, 10, [51, 65, 85])
  }
  y += 4

  // Lead-in
  addSection(`LEAD-IN (${lesson.leadIn.duration})`)
  addText(lesson.leadIn.instructions, 10, [30, 41, 59])
  y += 4

  // Main Activity
  addSection(`MAIN ACTIVITY (${lesson.mainActivity.duration})`)
  addText(lesson.mainActivity.instructions, 10, [30, 41, 59])
  if (lesson.mainActivity.variations) {
    addText('Variations:', 10, [13, 148, 136], true)
    addText(lesson.mainActivity.variations, 10, [51, 65, 85])
  }
  y += 4

  // Language Focus
  addSection('LANGUAGE FOCUS')
  addText(lesson.languageFocus.grammar_or_vocab, 10, [30, 41, 59], true)
  addText(lesson.languageFocus.explanation, 10, [30, 41, 59])
  addText('Examples:', 10, [13, 148, 136], true)
  lesson.languageFocus.examples.forEach(ex => addText(`• ${ex}`, 10, [51, 65, 85], false, 4))
  y += 4

  // L1 Notes
  addSection(`L1-AWARE NOTES (${lesson.l1Notes.nationality})`)
  addText('Common Challenges:', 10, [30, 41, 59], true)
  lesson.l1Notes.specificChallenges.forEach(c => addText(`• ${c}`, 10, [51, 65, 85], false, 4))
  addText('Tips:', 10, [13, 148, 136], true)
  lesson.l1Notes.tips.forEach(t => addText(`• ${t}`, 10, [51, 65, 85], false, 4))
  y += 4

  // Exercises
  addSection('PRACTICE EXERCISES')
  lesson.exercises.forEach((ex, i) => {
    addText(`Exercise ${i + 1}: ${ex.type}`, 10, [30, 41, 59], true)
    addText(ex.instructions, 10, [30, 41, 59])
    addText(ex.content, 10, [51, 65, 85])
    addText(`Answer Key: ${ex.answerKey}`, 9, [13, 148, 136])
    y += 2
  })

  // Speaking Task
  addSection(`SPEAKING TASK (${lesson.speakingTask.duration})`)
  addText(lesson.speakingTask.instructions, 10, [30, 41, 59])
  lesson.speakingTask.prompts.forEach(p => addText(`• ${p}`, 10, [51, 65, 85], false, 4))
  y += 4

  // Exit Ticket
  addSection('EXIT TICKET')
  addText(lesson.exitTicket.instructions, 10, [30, 41, 59])
  lesson.exitTicket.questions.forEach(q => addText(`• ${q}`, 10, [51, 65, 85], false, 4))
  y += 4

  // Homework
  if (lesson.homework.instructions) {
    addSection('HOMEWORK (Optional)')
    addText(lesson.homework.instructions, 10, [30, 41, 59])
  }

  // Footer on every page
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFillColor(15, 23, 42)
    doc.rect(0, doc.internal.pageSize.getHeight() - 14, pageWidth, 14, 'F')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(`Generated by Tyoutor Pro — tyoutorpro.io | ${meta.level} | ${meta.topic} | ${meta.date}`, margin, doc.internal.pageSize.getHeight() - 5)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 5, { align: 'right' })
  }

  doc.save(`tyoutorpro-lesson-${Date.now()}.pdf`)
}

export async function generateWorksheetPDF(worksheet: WorksheetContent, date: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = 20

  const checkPageBreak = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 25) {
      doc.addPage()
      y = 20
    }
  }

  const addText = (text: string, fontSize: number, color: [number, number, number], bold = false, indent = 0) => {
    doc.setFontSize(fontSize)
    doc.setTextColor(...color)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    const lines = doc.splitTextToSize(text, contentWidth - indent)
    checkPageBreak(lines.length * (fontSize * 0.4) + 3)
    doc.text(lines, margin + indent, y)
    y += lines.length * (fontSize * 0.4) + 3
  }

  // Header
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, pageWidth, 28, 'F')
  doc.setFontSize(18)
  doc.setTextColor(13, 148, 136)
  doc.setFont('helvetica', 'bold')
  doc.text('Tyoutor Pro', margin, 15)
  doc.setFontSize(9)
  doc.setTextColor(148, 163, 184)
  doc.text('Worksheet', margin, 22)
  y = 38

  addText(worksheet.title, 16, [15, 23, 42], true)
  addText(`Level: ${worksheet.level}  |  Topic: ${worksheet.topic}  |  Date: ${date}`, 9, [100, 116, 139])
  y += 6

  // Name / Date line
  doc.setDrawColor(203, 213, 225)
  doc.line(margin, y, margin + 80, y)
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('Name:', margin, y - 2)
  doc.line(margin + 100, y, margin + 180, y)
  doc.text('Date:', margin + 100, y - 2)
  y += 10

  worksheet.exercises.forEach((ex, i) => {
    checkPageBreak(20)
    doc.setFillColor(241, 245, 249)
    doc.roundedRect(margin, y - 4, contentWidth, 9, 2, 2, 'F')
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.text(`Exercise ${i + 1}: ${ex.type}`, margin + 3, y + 2)
    y += 12

    addText(ex.instructions, 10, [30, 41, 59])
    y += 2
    ex.items.forEach((item, j) => {
      const cleanItem = item.replace(/^\d+[\.\)]\s*/, '')
      addText(`${j + 1}. ${cleanItem}`, 10, [51, 65, 85], false, 4)
      y += 3
    })

    if (ex.answerKey && ex.answerKey.length > 0) {
      y += 4
      doc.setDrawColor(203, 213, 225)
      doc.setLineDashPattern([2, 2], 0)
      doc.line(margin, y, margin + contentWidth, y)
      doc.setLineDashPattern([], 0)
      y += 4
      addText('Answer Key:', 9, [13, 148, 136], true)
      ex.answerKey.forEach((ans, j) => addText(`${j + 1}. ${ans.replace(/^\d+[\.\)]\s*/, '')}`, 9, [51, 65, 85], false, 4))
    }
    y += 8
  })

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFillColor(15, 23, 42)
    doc.rect(0, doc.internal.pageSize.getHeight() - 12, pageWidth, 12, 'F')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(`Generated by Tyoutor Pro — tyoutorpro.io | ${worksheet.level} | ${date}`, margin, doc.internal.pageSize.getHeight() - 4)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 4, { align: 'right' })
  }

  doc.save(`tyoutorpro-worksheet-${Date.now()}.pdf`)
}
