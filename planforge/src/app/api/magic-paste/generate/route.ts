import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { getOpenAIClient } from '@/lib/openai'
import { checkRateLimit } from '@/lib/rate-limit'
import type { LessonContent } from '@/types'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&hellip;/g, '…')
}

interface ExtractionResult {
  content: string
  sourceLabel: string
  contentNote?: string
}

// ─── Pure helpers (unchanged) ────────────────────────────────────────────────

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

// ─── Meta tag extraction ─────────────────────────────────────────────────────

function getMetaTag(html: string, ...names: string[]): string {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const patterns = [
      new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"'<]+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"'<]+)["'][^>]+(?:name|property)=["']${escaped}["']`, 'i'),
    ]
    for (const p of patterns) {
      const m = html.match(p)
      if (m?.[1]?.trim()) return decodeHtmlEntities(m[1].trim())
    }
  }
  return ''
}

function extractMeta(html: string, url: string): { metaContent: string; title: string } {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title =
    decodeHtmlEntities(titleMatch?.[1]?.trim() ?? '') ||
    getMetaTag(html, 'og:title', 'twitter:title') ||
    ''
  const description = getMetaTag(html, 'og:description', 'description', 'twitter:description')
  const keywords = getMetaTag(html, 'keywords')

  let domain = url
  try { domain = new URL(url).hostname.replace(/^www\./, '') } catch { /* keep */ }

  const parts = [
    title       && `TITLE: ${title}`,
    description && `DESCRIPTION: ${description}`,
    keywords    && `KEYWORDS: ${keywords}`,
    `SOURCE: ${domain}`,
    `URL: ${url}`,
    '',
    "Note: Full article text wasn't accessible. Generate a complete ESL lesson based on this metadata. Include the URL for students to access the article in class or as homework. Create vocabulary, comprehension, and discussion activities around the apparent topic.",
  ].filter(Boolean)

  return { metaContent: parts.join('\n'), title: title || domain }
}

// ─── YouTube extraction (3-method fallback) ──────────────────────────────────

async function extractYouTube(url: string, videoId: string): Promise<ExtractionResult> {
  // Method 1: youtube-transcript package
  console.log('[magic-paste] Detected: YouTube URL, trying transcript...')
  try {
    const { YoutubeTranscript } = await import('youtube-transcript')
    const items = await YoutubeTranscript.fetchTranscript(videoId)
    const content = decodeHtmlEntities(items.map((i: { text: string }) => i.text).join(' '))
    if (content.trim().length > 100) {
      console.log(`[magic-paste] Transcript success — ${content.length} chars`)
      return { content, sourceLabel: `YouTube video (${url})` }
    }
    throw new Error('transcript too short')
  } catch (err) {
    console.log('[magic-paste] Transcript failed:', (err as Error).message, '— falling back to oEmbed...')
  }

  // Method 2: YouTube oEmbed API (works for any public video)
  try {
    const oEmbedRes = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!oEmbedRes.ok) throw new Error(`HTTP ${oEmbedRes.status}`)
    const data = await oEmbedRes.json() as { title?: string; author_name?: string }
    const title = decodeHtmlEntities(data.title ?? '')
    const author = decodeHtmlEntities(data.author_name ?? '')
    console.log(`[magic-paste] Using oEmbed data: "${title}" by ${author}`)

    const content = `VIDEO TITLE: ${title}
CHANNEL: ${author}
URL: ${url}

Note: Full transcript unavailable. Generate a complete ESL lesson based on the video title and its likely topic. Pre-teach vocabulary students will encounter. Include the URL for in-class or homework viewing. Create comprehension questions inferred from the title, and include discussion questions about the broader topic.`

    return {
      content,
      sourceLabel: `YouTube: ${title}`,
      contentNote: 'Lesson built from video title — transcript not available',
    }
  } catch (err) {
    console.log('[magic-paste] oEmbed failed:', (err as Error).message, '— using URL-based generation...')
  }

  // Method 3: URL-based last resort
  const content = `VIDEO URL: ${url}

Note: No video information was accessible. Generate a practical ESL lesson that teachers can use alongside any YouTube video. Include general video-watching skills (prediction, note-taking, comprehension), and discussion prompts that work for any topic.`

  return {
    content,
    sourceLabel: `YouTube video (${url})`,
    contentNote: 'Lesson built from URL — video details not accessible',
  }
}

// ─── Article extraction (3-method fallback) ──────────────────────────────────

async function extractArticle(url: string): Promise<ExtractionResult> {
  console.log(`[magic-paste] Fetching article: ${url}`)

  // Single fetch — reused for both Method 1 and Method 2
  let html: string | null = null
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
      },
      signal: AbortSignal.timeout(15000),
    })
    console.log(`[magic-paste] HTTP ${response.status} from ${url}`)
    if (response.ok) {
      html = await response.text()
      console.log(`[magic-paste] Fetched ${html.length} chars of HTML`)
    } else {
      console.log(`[magic-paste] Fetch returned HTTP ${response.status} — will try URL-based fallback`)
    }
  } catch (err) {
    console.log('[magic-paste] Fetch failed:', (err as Error).message)
  }

  if (html) {
    // Method 1: Readability
    try {
      const { JSDOM } = await import('jsdom')
      const { Readability } = await import('@mozilla/readability')
      const dom = new JSDOM(html, { url })
      const article = new Readability(dom.window.document).parse()
      const rawContent = article?.textContent?.trim() ?? ''
      const content = decodeHtmlEntities(rawContent)
      console.log(`[magic-paste] Readability extracted ${content.length} chars`)
      if (content.length > 200) {
        console.log(`[magic-paste] Readability success — using article: "${article?.title}"`)
        return { content, sourceLabel: `Article: ${decodeHtmlEntities(article?.title ?? url)}` }
      }
      console.log(`[magic-paste] Readability content too short (${content.length} chars) — falling back to meta tags`)
    } catch (err) {
      console.log('[magic-paste] Readability error — falling back to meta tags:', (err as Error).message)
    }

    // Method 2: Meta tags (from already-fetched HTML — no second request)
    const { metaContent, title } = extractMeta(html, url)
    if (metaContent.length > 50) {
      console.log(`[magic-paste] Meta tags success: "${title}"`)
      return {
        content: metaContent,
        sourceLabel: `Article: ${title}`,
        contentNote: "Lesson built from page title — full article wasn't accessible",
      }
    }
    console.log('[magic-paste] Meta tags yielded no useful content')
  }

  // Method 3: URL-based last resort
  console.log('[magic-paste] All article methods failed, using URL-based generation...')
  let domain = url
  let pathWords = ''
  try {
    const parsed = new URL(url)
    domain = parsed.hostname.replace(/^www\./, '')
    pathWords = parsed.pathname
      .split('/')
      .filter(Boolean)
      .join(' ')
      .replace(/[-_]/g, ' ')
  } catch { /* keep defaults */ }

  const content = `ARTICLE SOURCE: ${domain}
URL: ${url}
Apparent topic from URL: ${pathWords || domain}

Note: The article couldn't be accessed. Generate a complete ESL lesson on the likely topic suggested by this URL and domain. Include vocabulary, reading skills activities, and discussion questions. Teachers can adapt activities when they have access to the actual article.`

  return {
    content,
    sourceLabel: `Article from ${domain}`,
    contentNote: "Lesson built from URL — article wasn't accessible",
  }
}

// ─── Route handler ───────────────────────────────────────────────────────────

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

    // Extract content using fallback chains
    const contentType = detectContentType(pastedContent.trim())
    let extraction: ExtractionResult

    if (contentType === 'youtube') {
      const videoId = extractYouTubeId(pastedContent.trim())
      if (!videoId) {
        return NextResponse.json(
          { error: 'Could not parse the YouTube URL. Try pasting the video transcript directly.' },
          { status: 400 }
        )
      }
      extraction = await extractYouTube(pastedContent.trim(), videoId)
    } else if (contentType === 'url') {
      extraction = await extractArticle(pastedContent.trim())
    } else {
      console.log('[magic-paste] Detected: plain text paste')
      extraction = { content: pastedContent.trim(), sourceLabel: 'Pasted text' }
    }

    const { content, sourceLabel, contentNote } = extraction
    const truncated = truncateContent(content)

    const aiResponse = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 6000,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert TEFL/ESL teacher and curriculum designer. You create complete, classroom-ready lesson plans. Return valid JSON only — no markdown fences, no extra text.',
        },
        { role: 'user', content: buildPrompt(truncated, sourceLabel, cefrLevel, duration, ageGroup, nationality) },
      ],
    })

    const rawText = aiResponse.choices[0].message.content ?? ''
    let lessonContent: LessonContent
    try {
      lessonContent = JSON.parse(rawText)
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return NextResponse.json({ error: 'Failed to parse AI response. Please try again.' }, { status: 500 })
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
      contentNote,
    })
  } catch (error) {
    console.error('[magic-paste/generate]', error)
    return NextResponse.json(
      { error: 'We couldn\'t create a lesson right now. Please try again, or paste the text directly into the box above.' },
      { status: 500 }
    )
  }
}
