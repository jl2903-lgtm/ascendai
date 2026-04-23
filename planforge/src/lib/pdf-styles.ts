// Shared brand constants and layout utilities for all Tyoutor Pro PDF exports

export type RGB = [number, number, number]

// ── Brand palette ─────────────────────────────────────────────────────────────
export const G = {
  green:    [45, 106, 79]   as RGB,   // #2D6A4F  primary
  accent:   [82, 183, 136]  as RGB,   // #52B788  highlight
  terra:    [224, 122, 95]  as RGB,   // #E07A5F  warnings / L1
  dark:     [26, 26, 26]    as RGB,   // #1A1A1A  headings
  body:     [68, 68, 68]    as RGB,   // #444444  body text
  muted:    [153, 153, 153] as RGB,   // #999999  metadata
  bbb:      [187, 187, 187] as RGB,   // #BBBBBB  dates / footer
  lightBg:  [247, 246, 242] as RGB,   // #F7F6F2  section bg
  border:   [232, 228, 222] as RGB,   // #E8E4DE  card borders
  terraBg:  [255, 245, 242] as RGB,   // #FFF5F2  L1 callout bg
  accentBg: [240, 255, 244] as RGB,   // #F0FFF4  materials bg
  accentBd: [200, 230, 201] as RGB,   // #C8E6C9  materials border
  white:    [255, 255, 255] as RGB,
}

// ── Page layout (A4 mm) ───────────────────────────────────────────────────────
export const PAGE = {
  W:        210 as const,
  H:        297 as const,
  M:        14  as const,   // left/right margin
  CW:       182 as const,   // content width
  FOOTER_Y: 279 as const,   // y where footer separator sits
  CONT_Y:   18  as const,   // y for continuation pages (no header)
}

// ── Shared drawing helpers ────────────────────────────────────────────────────

/** Full-bleed header bar + logo + "Prepared by" + title + pills + date.
 *  Returns the y-position where body content should begin. */
export function drawPageHeader(
  doc: any,
  title: string,
  pills: string[],
  date: string,
  teacherName: string,
): number {
  const { M, W, CW } = PAGE

  // ── Full-bleed header bar ─────────────────────────────────────────
  doc.setFillColor(G.lightBg[0], G.lightBg[1], G.lightBg[2])
  doc.rect(0, 0, W, 20, 'F')

  // ── Logo: green rounded square ────────────────────────────────────
  doc.setFillColor(G.green[0], G.green[1], G.green[2])
  doc.roundedRect(M, 5.5, 8, 8, 1.3, 1.3, 'F')
  doc.setFontSize(7.5)
  doc.setTextColor(G.white[0], G.white[1], G.white[2])
  doc.setFont('helvetica', 'bold')
  doc.text('T', M + 4, 11.8, { align: 'center' })

  // ── Brand name: "Tyoutor" dark + "Pro" terra cotta ────────────────
  const BX = M + 11    // text starts after logo
  const BY = 12        // text baseline
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(G.dark[0], G.dark[1], G.dark[2])
  doc.text('Tyoutor', BX, BY)
  const tyw = doc.getTextWidth('Tyoutor')
  doc.setTextColor(G.terra[0], G.terra[1], G.terra[2])
  doc.text(' Pro', BX + tyw, BY)

  // ── Prepared by (right-aligned) ───────────────────────────────────
  doc.setFontSize(8.5)
  doc.setTextColor(G.muted[0], G.muted[1], G.muted[2])
  doc.setFont('helvetica', 'normal')
  doc.text(`Prepared by ${teacherName}`, W - M, BY, { align: 'right' })

  // ── Separator below header bar ────────────────────────────────────
  doc.setDrawColor(G.border[0], G.border[1], G.border[2])
  doc.setLineWidth(0.3)
  doc.line(0, 20, W, 20)

  // ── Document title ────────────────────────────────────────────────
  const TITLE_Y = 30
  doc.setFontSize(18)
  doc.setTextColor(G.dark[0], G.dark[1], G.dark[2])
  doc.setFont('helvetica', 'bold')
  const titleLines: string[] = doc.splitTextToSize(title, CW)
  doc.text(titleLines, M, TITLE_Y)
  let y = TITLE_Y + titleLines.length * 7.8

  // ── Metadata pill tags ────────────────────────────────────────────
  if (pills.length > 0) {
    y += 4
    let px = M
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    for (const pill of pills) {
      if (!pill) continue
      const tw = doc.getTextWidth(pill)
      const pw = tw + 5
      const ph = 4.8
      const py = y - 3.5
      doc.setFillColor(G.lightBg[0], G.lightBg[1], G.lightBg[2])
      doc.setDrawColor(G.border[0], G.border[1], G.border[2])
      doc.setLineWidth(0.25)
      doc.roundedRect(px, py, pw, ph, 1.2, 1.2, 'FD')
      doc.setTextColor(102, 102, 102)
      doc.text(pill, px + 2.5, y)
      px += pw + 2.5
    }
    y += 4
  }

  // ── Date line ─────────────────────────────────────────────────────
  if (date) {
    y += 2
    doc.setFontSize(8.5)
    doc.setTextColor(G.bbb[0], G.bbb[1], G.bbb[2])
    doc.setFont('helvetica', 'normal')
    doc.text(date, M, y)
    y += 4
  }

  // ── Second separator before content ──────────────────────────────
  y += 2
  doc.setDrawColor(G.border[0], G.border[1], G.border[2])
  doc.setLineWidth(0.3)
  doc.line(M, y, W - M, y)

  return y + 7  // content starts here
}

/** Draws footer (separator line + attribution + page number) on every page. */
export function drawPageFooters(doc: any, info = ''): void {
  const { M, W, FOOTER_Y } = PAGE
  const n = doc.getNumberOfPages()
  for (let p = 1; p <= n; p++) {
    doc.setPage(p)

    // Separator
    doc.setDrawColor(G.border[0], G.border[1], G.border[2])
    doc.setLineWidth(0.3)
    doc.line(M, FOOTER_Y, W - M, FOOTER_Y)

    // Small green square icon
    doc.setFillColor(G.green[0], G.green[1], G.green[2])
    doc.rect(M, FOOTER_Y + 3, 2, 2, 'F')

    // Left text
    const leftText = info
      ? `Generated by Tyoutor Pro · tyoutorpro.io  ·  ${info}`
      : 'Generated by Tyoutor Pro · tyoutorpro.io'
    doc.setFontSize(8)
    doc.setTextColor(G.bbb[0], G.bbb[1], G.bbb[2])
    doc.setFont('helvetica', 'normal')
    doc.text(leftText, M + 4, FOOTER_Y + 5)

    // Right: page number
    doc.text(`Page ${p} of ${n}`, W - M, FOOTER_Y + 5, { align: 'right' })
  }
}
