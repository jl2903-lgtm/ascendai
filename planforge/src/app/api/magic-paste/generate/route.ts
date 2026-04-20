import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { getOpenAIClient } from '@/lib/openai'
import { checkRateLimit } from '@/lib/rate-limit'
import type { LessonContent } from '@/types'

function detectContentType(content: string): 'youtube' | 'url' | 'text' {
  const trimmed = content.trim()
  if (!/^https?:\/\//i.test(trimmed)) return 'text'
  if (/youtube\.com|youtu\.be/i.test(trimmed)) return 'youtube'
  return 'url'
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  )
  return match ? match[1] : null
}

function truncateContent(text: string, maxChars = 12000): string {
  if (text.length <= maxChars) return text
  const firstPart = Math.floor(maxChars * 0.75)
  const lastPart = maxChars - firstPart
  return (
    text.slice(0, firstPart) +
    '\n\n[...content truncated for length...]\n\n' +
    text.slice(-lastPart)
  )
}

function buildPrompt(
  extractedContent: string,
  sourceLabel: string,
  cefrLevel: string,
  duration: number,
  ageGroup: string,
  nationality: string
): string {
  return `Create a complete EFL lesson plan based on the source content below.

Parameters:
- CEFR Level: ${cefrLevel}
- Lesson Length: ${duration} minutes
- Age Group: ${ageGroup}
- Student L1 / Nationality context: ${nationality}
- Source: ${sourceLabel}

CRITICAL REQUIREMENTS for exercises:
- Gap fill: 8–10 fully-written numbered sentences with _____ blanks. Complete answer key.
- Multiple choice: 5–6 fully-written questions each with a) b) c) options. Complete answer key.
- Matching: 8–10 pairs, Column A numbered, Column B lettered out of order. Complete answer key.
- Every item must come from or relate directly to the source content. No placeholders.

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "title": "engaging lesson title based on the source content",
  "overview": {
    "level": "${cefrLevel}",
    "timing": "${duration} minutes",
    "objectives": ["objective 1", "objective 2", "objective 3"],
    "materials": ["Source article/text", "Whiteboard", "Printed exercises"]
  },
  "warmer": {
    "duration": "5 minutes",
    "instructions": "activity to activate prior knowledge about the topic",
    "teacherNotes": "tips and anticipated issues"
  },
  "leadIn": {
    "duration": "5 minutes",
    "instructions": "how to introduce the source content to students",
    "context": "background context from the source material"
  },
  "mainActivity": {
    "duration": "20 minutes",
    "instructions": "step-by-step instructions for engaging with the source content",
    "variations": "adaptations for different student abilities",
    "teacherNotes": "classroom management tips"
  },
  "languageFocus": {
    "grammar_or_vocab": "key language item from the source content",
    "explanation": "clear teacher-facing explanation",
    "examples": ["example from source", "example 2", "example 3"],
    "commonErrors": ["common mistake 1", "common mistake 2"]
  },
  "l1Notes": {
    "nationality": "${nationality}",
    "specificChallenges": ["challenge 1", "challenge 2"],
    "tips": ["tip 1", "tip 2"]
  },
  "culturalNote": {
    "hasCulturalConsideration": true,
    "note": "cultural note relevant to the source content"
  },
  "exercises": [
    {
      "type": "Gap fill",
      "instructions": "Fill in the blanks with words from the text.",
      "content": "1. Sentence with _____.\n2. Another _____ sentence.\n3. Third sentence _____.\n4. Fourth _____ here.\n5. Fifth sentence with _____.\n6. Sixth _____ sentence.\n7. Seventh sentence _____.\n8. Eighth _____ here.",
      "answerKey": "1. word, 2. word, 3. word, 4. word, 5. word, 6. word, 7. word, 8. word"
    },
    {
      "type": "Multiple choice",
      "instructions": "Choose the correct answer for each question.",
      "content": "1. Question?\n   a) option\n   b) option\n   c) option\n\n2. Question?\n   a) option\n   b) option\n   c) option\n\n3. Question?\n   a) option\n   b) option\n   c) option\n\n4. Question?\n   a) option\n   b) option\n   c) option\n\n5. Question?\n   a) option\n   b) option\n   c) option",
      "answerKey": "1. b, 2. a, 3. c, 4. a, 5. b"
    },
    {
      "type": "Matching",
      "instructions": "Match each word or phrase in Column A with its meaning in Column B.",
      "content": "Column A: 1. term, 2. term, 3. term, 4. term, 5. term, 6. term, 7. term, 8. term\nColumn B: a. definition, b. definition, c. definition, d. definition, e. definition, f. definition, g. definition, h. definition",
      "answerKey": "1-c, 2-a, 3-f, 4-b, 5-h, 6-d, 7-g, 8-e"
    }
  ],
  "speakingTask": {
    "duration": "10 minutes",
    "instructions": "discussion activity instructions",
    "prompts": ["prompt 1 about the content", "prompt 2", "prompt 3", "prompt 4", "prompt 5"]
  },
  "exitTicket": {
    "instructions": "Ask students to answer on a slip of paper before leaving.",
    "questions": ["question 1", "question 2"]
  },
  "homework": {
    "optional": true,
    "instructions": "follow-up task tied to the source content"
  }
}

SOURCE CONTENT:
${extractedContent}`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    if (!checkRateLimit(userId, 5, 60000)) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
    }

    const body = await req.json()
    const { pastedContent, cefrLevel = 'B1', duration = 60, ageGroup = 'Adults', classId } = body

    if (!pastedContent?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Resolve nationality from class if provided
    let nationality = 'International'
    if (classId) {
      const { data: classProfile } = await supabase
        .from('class_profiles')
        .select('student_nationality')
        .eq('id', classId)
        .eq('user_id', userId)
        .single()
      if (classProfile?.student_nationality) nationality = classProfile.student_nationality
    }

    // Detect and extract content
    const contentType = detectContentType(pastedContent.trim())
    let extractedContent = ''
    let sourceLabel = ''

    if (contentType === 'youtube') {
      const videoId = extractYouTubeId(pastedContent.trim())
      if (!videoId) {
        return NextResponse.json(
          { error: 'Could not parse the YouTube URL. Try pasting the video transcript directly.' },
          { status: 400 }
        )
      }
      try {
        const { YoutubeTranscript } = await import('youtube-transcript')
        const items = await YoutubeTranscript.fetchTranscript(videoId)
        extractedContent = items.map((i: { text: string }) => i.text).join(' ')
        sourceLabel = `YouTube video (${pastedContent.trim()})`
      } catch {
        return NextResponse.json(
          { error: "We couldn't access this video's transcript. Try pasting the transcript or video description directly." },
          { status: 422 }
        )
      }
    } else if (contentType === 'url') {
      try {
        const response = await fetch(pastedContent.trim(), {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TyoutorPro/1.0; +https://tyoutorpro.com)' },
          signal: AbortSignal.timeout(10000),
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const html = await response.text()
        const { JSDOM } = await import('jsdom')
        const { Readability } = await import('@mozilla/readability')
        const dom = new JSDOM(html, { url: pastedContent.trim() })
        const article = new Readability(dom.window.document).parse()
        extractedContent = article?.textContent?.trim() ?? ''
        if (!extractedContent) throw new Error('No readable content found')
        sourceLabel = `Article: ${article?.title ?? pastedContent.trim()}`
      } catch {
        return NextResponse.json(
          { error: "We couldn't read this URL. Try copying and pasting the article text directly." },
          { status: 422 }
        )
      }
    } else {
      extractedContent = pastedContent.trim()
      sourceLabel = 'Pasted text'
    }

    extractedContent = truncateContent(extractedContent)

    const aiResponse = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 6000,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert TEFL/ESL teacher and curriculum designer. You create complete, classroom-ready lesson plans. Return valid JSON only — no markdown fences, no extra text.',
        },
        { role: 'user', content: buildPrompt(extractedContent, sourceLabel, cefrLevel, duration, ageGroup, nationality) },
      ],
    })

    const rawText = aiResponse.choices[0].message.content ?? ''
    let lessonContent: LessonContent
    try {
      lessonContent = JSON.parse(rawText)
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
      lessonContent = JSON.parse(jsonMatch[0])
    }

    // Track stats
    const { data: existingStats } = await supabase
      .from('user_stats')
      .select('total_lessons_created, lessons_this_week, last_weekly_reset')
      .eq('user_id', userId)
      .single()
    const now = new Date()
    const lastReset = existingStats?.last_weekly_reset ? new Date(existingStats.last_weekly_reset) : null
    const weekExpired = !lastReset || now.getTime() - lastReset.getTime() > 7 * 24 * 60 * 60 * 1000
    await supabase.from('user_stats').upsert(
      {
        user_id: userId,
        total_lessons_created: (existingStats?.total_lessons_created ?? 0) + 1,
        lessons_this_week: weekExpired ? 1 : (existingStats?.lessons_this_week ?? 0) + 1,
        ...(weekExpired ? { last_weekly_reset: now.toISOString(), worksheets_this_week: 0 } : {}),
      },
      { onConflict: 'user_id' }
    )

    return NextResponse.json({
      lesson: lessonContent,
      sourceLabel,
      sourcePreview: pastedContent.trim().slice(0, 100),
    })
  } catch (error) {
    console.error('[magic-paste/generate]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
