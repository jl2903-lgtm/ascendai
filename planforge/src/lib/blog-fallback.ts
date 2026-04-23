import type { BlogPost } from '@/types'

const now = new Date().toISOString()

export const FALLBACK_POSTS: BlogPost[] = [
  {
    id: 'fallback-1',
    slug: 'vietnamese-esl-common-mistakes',
    title: '10 Common Mistakes Vietnamese ESL Learners Make (And How to Fix Them)',
    excerpt: 'A practical guide to the pronunciation, grammar, and vocabulary errors you\'ll hear most often from Vietnamese students — with classroom-tested fixes you can use tomorrow.',
    content: `
<p>If you've taught English in Vietnam — or anywhere with a large Vietnamese student community — you'll recognise the same handful of errors appearing in almost every class. Vietnamese is a tonal, monosyllabic language with no inflectional morphology, which means certain features of English (consonant clusters, verb tenses, articles) feel deeply unnatural to Vietnamese speakers. The good news: once you know what to expect, you can target these errors directly and see real progress within a few lessons.</p>

<h2>1. Dropping final consonants</h2>
<p>Vietnamese words end in a very limited set of consonants, so students often drop final <em>-s</em>, <em>-t</em>, <em>-d</em>, and <em>-k</em> sounds. "I work at a bank" becomes "I wor at a ban." <strong>Fix:</strong> minimal pair drilling (<em>bat / back / bag</em>) plus exaggerated mouthing during choral repetition.</p>

<h2>2. Confusing final /l/ and /n/</h2>
<p>"Nine" and "Nile" can sound identical. <strong>Fix:</strong> tongue-position diagrams, paired reading, and a 30-second warm-up drill at the start of each lesson.</p>

<h2>3. Flat intonation on questions</h2>
<p>Because Vietnamese uses tones on every syllable, sentence-level intonation in English often sounds flat. <strong>Fix:</strong> model rising intonation with an exaggerated hand gesture and ask students to shadow you.</p>

<h2>4. Omitting the verb "to be"</h2>
<p>Vietnamese doesn't require a copula in present-tense descriptions, so students write "He very tired" or "She a teacher." <strong>Fix:</strong> a colour-coded sentence-building exercise where the verb <em>to be</em> is always a specific colour.</p>

<h2>5. Mixing up past and present tense</h2>
<p>Vietnamese marks time with adverbs (<em>đã, đang, sẽ</em>) rather than verb endings. Students say "Yesterday I go to the market." <strong>Fix:</strong> timeline exercises and a "verb transformation" drill on the whiteboard.</p>

<h2>6. Articles (a / an / the)</h2>
<p>Articles don't exist in Vietnamese. Students either omit them ("I went to market") or overuse them. <strong>Fix:</strong> don't try to teach every rule at once — start with countable singular nouns and definite/indefinite contrast.</p>

<h2>7. Word order in questions</h2>
<p>"You are a teacher?" (statement with rising tone) instead of "Are you a teacher?" <strong>Fix:</strong> physical card-sorting activities where students rearrange words into correct question order.</p>

<h2>8. Confusing /θ/ and /t/ or /s/</h2>
<p>The <em>th</em> sound doesn't exist in Vietnamese. "Think" becomes "tink" or "sink." <strong>Fix:</strong> tongue-between-teeth visual cue, mirror practice, and low-stakes minimal-pair bingo.</p>

<h2>9. Overusing "very"</h2>
<p>"Very delicious," "very beautiful," "very happy." <strong>Fix:</strong> introduce gradable intensifiers (<em>extremely, incredibly, absolutely</em>) with a ranking activity.</p>

<h2>10. Literal translations of idioms</h2>
<p>Students often translate Vietnamese idioms word-for-word, producing phrases that puzzle native speakers. <strong>Fix:</strong> teach idioms in thematic clusters and pair each with a short dialogue for context.</p>

<h2>Bringing it all together</h2>
<p>You don't need to hunt for these patterns manually any more. If you generate a lesson in Tyoutor Pro with <em>Vietnamese</em> set as the student nationality, the L1-aware notes section flags the exact errors your class is likely to make — so you walk in prepared.</p>
`,
    cover_image_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
    category: 'Teaching Tips',
    tags: ['vietnamese', 'pronunciation', 'grammar', 'l1-interference'],
    author_name: 'Jordan',
    read_time_minutes: 6,
    published: true,
    published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'fallback-2',
    slug: 'plan-week-of-esl-lessons-30-minutes',
    title: 'How to Plan a Week of ESL Lessons in Under 30 Minutes',
    excerpt: 'The weekly planning system that saves experienced ESL teachers 10+ hours a month. Includes a free template and a step-by-step walkthrough.',
    content: `
<p>Lesson planning is the single biggest drain on an ESL teacher's evenings and weekends. The teachers who save the most time aren't the ones who work fastest — they're the ones who've switched from planning lesson-by-lesson to planning in weekly blocks. Here's the exact 30-minute process I use to plan a full week of classes, and the framework any teacher can steal.</p>

<h2>Step 1: Block out your week (2 minutes)</h2>
<p>Open a simple grid — paper, Notion, or a spreadsheet — and list every class you teach. Next to each, write the <em>level</em>, <em>length</em>, and <em>the one thing</em> those students need to practise most. That "one thing" is your anchor for the week.</p>

<h2>Step 2: Choose a weekly theme (3 minutes)</h2>
<p>Pick one topic per class for the whole week: <em>travel, work, food, relationships, technology</em>. Weekly themes let you reuse vocabulary and scaffolded language across multiple lessons, which massively reduces prep time and gives students repeated exposure — which is how language actually sticks.</p>

<h2>Step 3: Map the skills arc (5 minutes)</h2>
<p>A well-paced week moves through the four skills in a natural arc: <strong>receptive → productive → integrated</strong>. For a five-day week, that usually means:</p>
<ul>
  <li>Monday: vocabulary + reading input</li>
  <li>Tuesday: listening + controlled speaking</li>
  <li>Wednesday: grammar focus</li>
  <li>Thursday: free speaking / role-play</li>
  <li>Friday: writing + review</li>
</ul>

<h2>Step 4: Generate the lessons (10 minutes)</h2>
<p>This is where most teachers lose three to four hours per week digging through old materials, browsing ESL subreddits, and frankensteining worksheets together. Don't. Tyoutor Pro generates a fully-structured lesson — warmer, lead-in, main activity, language focus, L1-aware notes, and speaking task — in about 15 seconds, personalised to the class profile you saved once at the beginning of the course. Five lessons = about two minutes of actual generation time.</p>

<h2>Step 5: Build a linked worksheet (5 minutes)</h2>
<p>For every lesson that has a clear language focus (grammar or target vocab), auto-generate a matching worksheet. Students get consolidation practice; you get zero photocopier scrambling on Friday morning.</p>

<h2>Step 6: Lock in your demo / assessment days (3 minutes)</h2>
<p>Block out any assessment, demo, or observation days in advance so you can slot in a slower review lesson that week. Teachers who forget to do this end up panicking at 9pm the night before.</p>

<h2>Step 7: Review and tweak (2 minutes)</h2>
<p>Skim the week as a whole. Does it flow? Is there a good mix of receptive and productive work? Are you repeating the target structure at least three times across the week? If yes, you're done — close the laptop.</p>

<h2>The tools that make this possible</h2>
<p>None of this works without automation. If you're still writing lesson plans from blank pages, no amount of templating will get you under an hour. The shift happens when you let an AI do the structural work and you focus on the two things that matter: knowing your students and running the class well.</p>
`,
    cover_image_url: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=1200&q=80',
    category: 'Lesson Ideas',
    tags: ['planning', 'productivity', 'weekly-planning', 'templates'],
    author_name: 'Jordan',
    read_time_minutes: 4,
    published: true,
    published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: now,
    updated_at: now,
  },
  {
    id: 'fallback-3',
    slug: 'tefl-interview-demo-lesson-guide',
    title: 'TEFL Interview Guide: How to Nail Your Demo Lesson',
    excerpt: 'Everything you need to walk into a TEFL interview with confidence — from the 20-minute lesson structure hiring managers look for to the methodology language that gets you the job.',
    content: `
<p>The demo lesson is the single highest-leverage part of any TEFL interview. A strong CV gets you in the door, but it's the 20 minutes in front of real (or pretend) students that decides whether you walk out with an offer. Having sat on both sides of the hiring table at schools in Hanoi, Madrid, and Seoul, here's what actually moves the needle.</p>

<h2>1. Know the format before you walk in</h2>
<p>Demo lessons usually run 15–25 minutes with either live students, interviewer-as-student, or a mix. Ask in advance: <em>how many students, what level, what topic, do I need to bring materials?</em> Schools that don't tell you are often testing how proactively you ask. Always ask.</p>

<h2>2. Use a clear, recognisable lesson shape</h2>
<p>Hiring managers aren't looking for genius — they're looking for <strong>coherence</strong>. The shape they want to see is:</p>
<ol>
  <li><strong>Warmer</strong> (2–3 min): a hook that gets students speaking immediately</li>
  <li><strong>Lead-in</strong> (2–3 min): brief context-setting for the target language</li>
  <li><strong>Presentation</strong> (5 min): clear model of the target structure or vocab</li>
  <li><strong>Controlled practice</strong> (5 min): gap-fills, matching, pair work</li>
  <li><strong>Freer practice</strong> (5 min): role-play or mini-discussion</li>
  <li><strong>Wrap-up</strong> (1–2 min): exit ticket or quick recap</li>
</ol>
<p>If your demo hits these six beats visibly, you'll out-score 80% of candidates by structure alone.</p>

<h2>3. Get students talking in the first 30 seconds</h2>
<p>The fastest way to tank a demo is to spend three minutes on introductions and instructions. Greet the class, ask one quick question that everyone can answer, and you're already teaching.</p>

<h2>4. Use methodology language explicitly</h2>
<p>When you explain your rationale afterwards (most interviews include a short Q&amp;A), use the terms hiring managers are trained to hear: <em>PPP, TBL, eliciting, scaffolding, concept-checking questions, TTT vs STT ratio, recast, L1 interference.</em> You don't need to name-drop every term — one or two, used correctly, is more than enough.</p>

<h2>5. Plan concept-checking questions in advance</h2>
<p>If you're teaching <em>used to</em>, write down the CCQs you'll ask: <strong>"Is this in the past?" "Does he still play football now?" "Was it a habit?"</strong> Observers love seeing CCQs because they prove you understand how meaning is negotiated, not just delivered.</p>

<h2>6. Anticipate student problems</h2>
<p>A strong lesson plan includes a section called <em>anticipated problems and solutions</em>. If you're demoing to Vietnamese learners, mention final-consonant deletion. If they're Japanese, mention /r/ vs /l/. Schools hire teachers who think about students, not just content.</p>

<h2>7. End with something memorable</h2>
<p>A short, personal exit ticket ("Tell me one thing you'll do this weekend using the new structure") works better than a formal test. It leaves the interviewer with the feeling that you care about the students as people, which is what everything actually hinges on.</p>

<h2>Preparing in less than an hour</h2>
<p>Most candidates spend two or three evenings building their demo lesson from scratch. With Tyoutor Pro's Demo Lesson Builder, you can generate a fully-structured, methodology-sound demo in about 60 seconds — topic, level, school type, country — and then spend your prep time on rehearsal, which is where the real marks are won.</p>
`,
    cover_image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    category: 'Career',
    tags: ['tefl', 'interview', 'demo-lesson', 'career'],
    author_name: 'Jordan',
    read_time_minutes: 8,
    published: true,
    published_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: now,
    updated_at: now,
  },
]
