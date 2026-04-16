import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import mammoth from 'mammoth'

const IMAGE_BASED_RESPONSE = {
  error: 'We had trouble reading your PDF. Please paste your CV content in the text box below.',
  isImageBased: true,
}

async function extractWithPdfjs(buffer: Buffer): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = ''
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
  })
  const pdf = await loadingTask.promise
  const pages: string[] = []
  for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map((item) => 'str' in item ? item.str : '').join(' '))
  }
  return pages.join('\n').trim()
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
      // Primary: pdf-parse
      try {
        const pdfParse = require('pdf-parse/lib/pdf-parse')
        const result = await pdfParse(buffer)
        text = (result.text ?? '').replace(/\s{3,}/g, '\n\n').trim()
      } catch {
        // fall through to pdfjs
      }

      // Secondary: pdfjs-dist text extraction (handles more PDF variants)
      if (text.length < 100) {
        try {
          text = (await extractWithPdfjs(buffer)).replace(/\s{3,}/g, '\n\n').trim()
        } catch {
          // fall through to image-based response
        }
      }

      if (text.length < 100) {
        console.error('[parse-cv-file] PDF appears image-based — no text layer found')
        return NextResponse.json(IMAGE_BASED_RESPONSE, { status: 422 })
      }
    } else if (isDocx) {
      const result = await mammoth.extractRawText({ buffer })
      text = (result.value ?? '').replace(/\s{3,}/g, '\n\n').trim()
      if (text.length < 50) {
        return NextResponse.json(IMAGE_BASED_RESPONSE, { status: 422 })
      }
    } else {
      text = buffer.toString('utf-8').replace(/\s{3,}/g, '\n\n').trim()
    }

    return NextResponse.json({ text })
  } catch {
    console.error('[parse-cv-file] Unexpected error during parsing')
    return NextResponse.json(IMAGE_BASED_RESPONSE, { status: 422 })
  }
}
