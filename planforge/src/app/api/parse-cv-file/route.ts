import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import mammoth from 'mammoth'

const PASTE_FALLBACK = {
  error: 'We had trouble reading your PDF. Please paste your CV content in the text box below.',
  isImageBased: true,
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = ''
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  }).promise

  const pages: string[] = []
  for (let i = 1; i <= Math.min(pdf.numPages, 15); i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    pages.push(pageText)
  }

  return pages.join('\n').replace(/\s{3,}/g, '\n\n').trim()
}

export async function POST(req: NextRequest) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const name = file.name.toLowerCase()
  const isPdf = name.endsWith('.pdf') || file.type === 'application/pdf'
  const isDocx =
    name.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

  try {
    let text = ''

    if (isPdf) {
      try {
        text = await extractPdfText(buffer)
      } catch (err) {
        console.error('[parse-cv-file] pdfjs extraction error:', err)
      }
      if (text.length < 100) {
        console.error('[parse-cv-file] PDF text too short — likely image-based')
        return NextResponse.json(PASTE_FALLBACK, { status: 422 })
      }
    } else if (isDocx) {
      const result = await mammoth.extractRawText({ buffer })
      text = (result.value ?? '').replace(/\s{3,}/g, '\n\n').trim()
      if (text.length < 50) {
        return NextResponse.json(PASTE_FALLBACK, { status: 422 })
      }
    } else {
      text = buffer.toString('utf-8').replace(/\s{3,}/g, '\n\n').trim()
    }

    return NextResponse.json({ text })
  } catch (err) {
    console.error('[parse-cv-file] Unexpected error:', err)
    return NextResponse.json(PASTE_FALLBACK, { status: 422 })
  }
}
