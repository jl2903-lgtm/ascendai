import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import mammoth from 'mammoth'

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
  const isDocx = name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

  try {
    let text = ''

    if (isPdf) {
      // pdf-parse/lib/pdf-parse avoids the test-file side-effect at module load
      const pdfParse = require('pdf-parse/lib/pdf-parse')
      const result = await pdfParse(buffer)
      text = result.text ?? ''
    } else if (isDocx) {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value ?? ''
    } else {
      text = buffer.toString('utf-8')
    }

    text = text.replace(/\s{3,}/g, '\n\n').trim()

    if (text.length < 50) {
      return NextResponse.json(
        { error: 'Could not read PDF, please try copying and pasting your CV text instead' },
        { status: 422 }
      )
    }

    return NextResponse.json({ text })
  } catch {
    return NextResponse.json(
      { error: 'Could not read PDF, please try copying and pasting your CV text instead' },
      { status: 422 }
    )
  }
}
