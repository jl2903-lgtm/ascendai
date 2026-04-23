-- Seeds 5 SEO-targeted blog post drafts (published = false).
-- Promote to published by toggling the `published` flag in the dashboard
-- when each post is reviewed and approved for launch.
-- Idempotent: ON CONFLICT updates non-publish fields only.

insert into public.blog_posts (slug, title, excerpt, content, cover_image_url, category, tags, author_name, read_time_minutes, published, published_at)
values
(
  'how-to-teach-present-perfect-esl',
  'The Complete Guide to Teaching Present Perfect to ESL Students',
  'How to teach the present perfect to ESL students — with concept-checking questions, timeline diagrams, controlled practice, and L1-specific notes for your class.',
  $HTML$
<p>If you've ever tried to teach the present perfect, you know it's the grammar point that breaks more lessons than any other. Students "understand" it in class and then immediately produce <em>"I have seen him yesterday"</em> on the speaking activity. This guide on <em>how to teach present perfect ESL</em> is built around the one truth most coursebooks dance around: present perfect is not really about time — it's about <strong>relevance</strong>.</p>

<h2>Step 1: Ditch the timeline-first approach</h2>
<p>Most textbooks open with a timeline showing past actions stretching to "now." That diagram is useful later, but if you lead with it, students fixate on the time arrow and start using present perfect for any past event. Lead instead with a <strong>contrast pair</strong>:</p>
<ul>
  <li><em>I lost my keys</em> (now I have them again — story over)</li>
  <li><em>I've lost my keys</em> (still lost — affecting me right now)</li>
</ul>
<p>This is the meaning that actually matters. Time comes second.</p>

<h2>Step 2: Use four bulletproof CCQs</h2>
<p>Concept-checking questions for present perfect are the difference between a class that nods and a class that produces it correctly. Use these every time:</p>
<ol>
  <li>Is this finished or is it still happening / still relevant?</li>
  <li>Do we know exactly when?</li>
  <li>Is the time period finished?</li>
  <li>Is the result still important now?</li>
</ol>

<h2>Step 3: Teach the four uses one at a time</h2>
<p>Trying to cover unfinished time, life experience, recent past, and present result in a single lesson is a recipe for confusion. Spread them across a week:</p>
<ul>
  <li><strong>Monday:</strong> life experience (<em>Have you ever…?</em>) — easiest entry point</li>
  <li><strong>Tuesday:</strong> recent past with <em>just / already / yet</em></li>
  <li><strong>Wednesday:</strong> unfinished time (<em>this week, today, since 2020</em>)</li>
  <li><strong>Thursday:</strong> present result (<em>I've broken my arm — that's why I can't write</em>)</li>
</ul>

<h2>Step 4: L1-specific traps to watch for</h2>
<p>Spanish, French, Italian and German speakers have a near-equivalent perfect tense and overuse present perfect for completed past actions. Mandarin and Vietnamese speakers under-use it because they mark completion with particles, not auxiliaries. Tyoutor Pro automatically scaffolds your lesson around the L1 of your class — so the warmer for your Spanish group is different from the warmer for your Korean group.</p>

<h2>Step 5: Controlled → freer practice</h2>
<p>Move from gap-fills (controlled) to a "find someone who has…" mingle (freer). End with an exit ticket: students write three true sentences about themselves using present perfect with <em>just</em>, <em>never</em>, and <em>yet</em>.</p>

<p>Ready to skip the prep? <a href="/auth/signup">Generate a complete present-perfect lesson with Tyoutor Pro</a> in under 60 seconds — full plan, CCQs, and L1-aware notes included.</p>
$HTML$,
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
  'Teaching Tips',
  array['present-perfect', 'grammar', 'lesson-planning', 'ccq', 'methodology'],
  'Jordan',
  6,
  false,
  null
),
(
  'esl-error-correction-techniques',
  'ESL Error Correction: 7 Techniques That Actually Work',
  'Seven evidence-based ESL error correction techniques — when to correct, when to ignore, and how to build a feedback loop that actually changes student output.',
  $HTML$
<p>Error correction is one of the most-debated areas of ESL teaching. Over-correct and you crush fluency; under-correct and fossilised mistakes harden in for life. The teachers who get the best results don't have a single magic formula — they have a small repertoire of <em>ESL error correction techniques</em> they deploy at the right moments. Here are the seven worth knowing.</p>

<h2>1. The recast (during fluency work)</h2>
<p>The student says "Yesterday I go to the cinema." You reply, "Oh nice, you <em>went</em> to the cinema? What did you see?" You've corrected without interrupting. Recasts work best in 1:1 or small groups; in big classes, students often miss the correction entirely.</p>

<h2>2. Finger correction (during accuracy work)</h2>
<p>Hold up one finger per word. Wiggle the finger that holds the error. Students figure out which word is wrong and self-correct. It's silent, fast, and gives them ownership of the fix.</p>

<h2>3. Echoing with rising intonation</h2>
<p>Repeat the error back with rising intonation: "He <em>go</em>?" — the student hears the spotlight on <em>go</em> and corrects to <em>goes</em>. Effective for slips rather than knowledge gaps.</p>

<h2>4. Peer correction</h2>
<p>"Anyone help us?" turns the correction into a class learning event. Reduces teacher talk, increases engagement, and signals that errors are normal — not embarrassing.</p>

<h2>5. Delayed board correction</h2>
<p>Take notes during a fluency activity. At the end, write 4–6 sentences on the board (anonymised). Students work in pairs to spot and fix the errors. This is the single best technique for advanced classes — fluency stays uninterrupted, accuracy gets attention.</p>

<h2>6. Error categorisation</h2>
<p>For longer pieces of writing, don't mark every mistake. Pick three categories (e.g., articles, prepositions, verb tense) and mark only those. Students can absorb three corrections; they can't absorb thirty.</p>

<h2>7. The error log</h2>
<p>Have students keep a running list of their own recurring mistakes — pulled from your feedback. Review the log every two weeks. This single habit shifts errors from <em>caught and forgotten</em> to <em>caught and changed</em>.</p>

<h2>Letting AI do the categorisation</h2>
<p>The bottleneck for most teachers isn't knowing the techniques — it's having the time to mark, categorise, and write personalised feedback. The Tyoutor Pro <a href="/#features">Error Correction Coach</a> takes a piece of student writing (typed or photographed) and returns it categorised by error type, with explanations students can actually understand. You decide what to do with the data; the heavy lifting is done.</p>

<p><a href="/auth/signup"><strong>Try the Error Correction Coach free →</strong></a> 3 corrections included on the free plan.</p>
$HTML$,
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Teaching Tips',
  array['error-correction', 'feedback', 'methodology', 'classroom-management'],
  'Jordan',
  5,
  false,
  null
),
(
  'how-to-create-engaging-esl-worksheets',
  'How to Create Engaging ESL Worksheets (Without Spending Hours)',
  'How to make ESL worksheets that students actually engage with — design principles, ESL worksheet ideas, and a workflow that gets you from blank page to printable in 10 minutes.',
  $HTML$
<p>Bad worksheets are everywhere on the internet — dense, ugly, monolingual, and stripped of context. Good worksheets reinforce the lesson, give students agency, and are reusable. If you're searching for <em>ESL worksheet ideas</em> or trying to figure out <em>how to make ESL worksheets</em> without sinking your evening into Word, here are the design rules and the shortcuts.</p>

<h2>Rule 1: One target structure per worksheet</h2>
<p>The most common mistake is cramming three grammar points and a vocabulary review onto one A4 sheet. Pick <strong>one</strong> target structure or lexical set. Anything else dilutes practice and confuses scoring.</p>

<h2>Rule 2: Mix three task types</h2>
<p>A great worksheet usually contains three of these, in this order:</p>
<ul>
  <li><strong>Receptive</strong> — gap fill, multiple choice, matching (low-stress entry)</li>
  <li><strong>Recognition</strong> — error spotting, sentence transformation</li>
  <li><strong>Productive</strong> — short answer, sentence writing, dialogue completion</li>
</ul>
<p>The arc moves students from understanding → noticing → producing.</p>

<h2>Rule 3: Always include an answer key</h2>
<p>Students need feedback now, not next week. An answer key on the back means worksheets become self-correcting homework — and your marking pile shrinks dramatically.</p>

<h2>Rule 4: Visual hierarchy matters</h2>
<p>A worksheet that looks like a wall of 10pt Arial gets ignored. Keep these in mind:</p>
<ul>
  <li>Generous white space</li>
  <li>Numbered tasks with bold headings</li>
  <li>Maximum two fonts</li>
  <li>One image or icon per section as a visual anchor</li>
</ul>

<h2>Rule 5: Make it level-appropriate, not level-flattering</h2>
<p>A B1 worksheet should challenge B1 students — about 15% unknown vocab is the sweet spot. Anything easier and they switch off; anything harder and they shut down. If you're not sure where the line sits for your class, lean on a tool that scales by CEFR level automatically.</p>

<h2>Rule 6: Build in a "freer" final question</h2>
<p>End with one question that has no single right answer. <em>"Write three sentences about your weekend using the past simple."</em> That one question doubles the value of the worksheet — and gives you something to discuss in the next lesson.</p>

<h2>Skipping the build phase</h2>
<p>Following all six rules takes about 45 minutes per worksheet from scratch. The Tyoutor Pro <a href="/#features">Worksheet Builder</a> bakes them in by default — you pick a level, target structure, and number of tasks, and you get a complete, printable worksheet (with answer key) in about 30 seconds. The design rules don't change; the time cost does.</p>

<p><a href="/auth/signup"><strong>Generate your first worksheet free →</strong></a> 5 worksheets included on the free plan.</p>
$HTML$,
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80',
  'Lesson Ideas',
  array['worksheets', 'design', 'productivity', 'lesson-materials'],
  'Jordan',
  5,
  false,
  null
),
(
  'teaching-business-english-guide',
  'Teaching Business English: A Complete Guide for New TEFL Teachers',
  'Teaching business English tips for new TEFL teachers — needs analysis, the four lesson archetypes, common BE pitfalls, and how to charge what you''re worth.',
  $HTML$
<p>Teaching business English is one of the highest-paid niches in TEFL — and one of the most intimidating to step into. Adult professionals are demanding, time-pressured, and often more knowledgeable about their industry than you'll ever be. The good news: the skills they need are narrower than general English, and once you have a framework, the prep gets faster, not slower. This guide collects the <em>teaching business English tips</em> I wish I'd had when I started.</p>

<h2>Start with a needs analysis, not a textbook</h2>
<p>Before lesson one, send a short questionnaire: <em>What do you do in English at work? What's the hardest situation you face? What would success look like in three months?</em> Their answers ARE your syllabus. Skipping this step is the single biggest mistake new BE teachers make — you end up teaching coursebook chapters that have nothing to do with their actual job.</p>

<h2>The four lesson archetypes</h2>
<p>Most BE lessons fall into one of four shapes. Master these and you can plan any class:</p>
<ol>
  <li><strong>Functional</strong> — language for a specific situation (negotiating, presenting, small talk, leading meetings)</li>
  <li><strong>Vocabulary deep-dive</strong> — focused lexis (finance, marketing, HR, supply chain)</li>
  <li><strong>Skills</strong> — emails, reports, presentations (productive output the student delivers)</li>
  <li><strong>Discussion</strong> — current affairs, case studies, industry news (fluency + range)</li>
</ol>
<p>A balanced 12-week course usually mixes all four.</p>

<h2>Common pitfalls</h2>
<p>Three traps catch almost every new BE teacher:</p>
<ul>
  <li><strong>Over-correcting in meetings practice</strong> — adults need fluency confidence more than perfect grammar</li>
  <li><strong>Using outdated coursebook scenarios</strong> — "fax the report" lands badly in 2026</li>
  <li><strong>Talking too much yourself</strong> — your job is to engineer their talking time, not display your own English</li>
</ul>

<h2>Materials that work</h2>
<p>The best BE materials are real: HBR articles, Bloomberg headlines, the company's own emails (anonymised), TED talks. Coursebooks are great for the underlying language scaffolding but should be the supporting cast, not the lead.</p>

<h2>Charging what you're worth</h2>
<p>BE teaching pays anywhere from $30/hour (online groups) to $200+/hour (in-person C-suite). The biggest predictor of rate isn't credentials — it's specialisation. A teacher who says "I do business English" charges less than one who says "I prepare French finance directors for English-language board meetings." Niche down, then niche down again.</p>

<h2>Where AI fits</h2>
<p>Building 12 weeks of bespoke BE materials by hand is brutal. Tyoutor Pro lets you spin up a tailored business-English lesson in 60 seconds — pick the function, the level, the industry — and you get a full plan with realistic dialogues, role-play prompts, and language focus.</p>

<p><a href="/auth/signup"><strong>Plan your first business-English lesson free →</strong></a> 5 lessons included, no credit card.</p>
$HTML$,
  'https://images.unsplash.com/photo-1664575602807-e002fc77961d?auto=format&fit=crop&w=1200&q=80',
  'Career',
  array['business-english', 'tefl', 'career', 'specialisation'],
  'Jordan',
  6,
  false,
  null
),
(
  'what-is-l1-interference-esl-guide',
  'What is L1 Interference? A Guide for ESL Teachers',
  'L1 interference for ESL teachers — what mother tongue interference is, why it matters, and how to predict the errors your class will make before they happen.',
  $HTML$
<p>If you've ever wondered why your Spanish students all say "<em>I have 25 years</em>" or your Japanese students all say "<em>I went to Mexico last year, isn't it?</em>", you've already met <strong>L1 interference</strong>. This guide explains what it is, why it matters more than any single grammar point you can teach, and how to use it to make every lesson sharper. If you're a working ESL teacher, understanding <em>L1 interference ESL</em> is the single highest-leverage piece of theory you can carry into the classroom.</p>

<h2>What is L1 interference?</h2>
<p>L1 interference (also called <em>language transfer</em> or <em>mother tongue interference teaching</em>) is the phenomenon where features of a learner's first language carry over into their second. It happens at every level of the language: pronunciation, grammar, vocabulary, even discourse and pragmatics. It's not a sign of weak students — it's a universal feature of how the brain learns a second language.</p>

<h2>Three quick examples</h2>
<ul>
  <li><strong>Spanish → English:</strong> Spanish uses <em>tener</em> ("to have") for age. Result: "I have 25 years."</li>
  <li><strong>Japanese → English:</strong> Japanese uses sentence-final particles for confirmation. Result: every question ends with "<em>isn't it?</em>"</li>
  <li><strong>Mandarin → English:</strong> Mandarin marks verbs for aspect, not tense. Result: "Yesterday I go to market."</li>
</ul>

<h2>Why it matters more than grammar drilling</h2>
<p>Generic grammar drills assume every student makes the same mistakes. They don't. A Spanish-speaking class will struggle with the present perfect (because Spanish has a near-equivalent and over-applies it). A Korean-speaking class will struggle because Korean has no perfect aspect at all. The "right" lesson for these two groups looks completely different — same target structure, completely different scaffolding.</p>

<h2>How to use L1 awareness in planning</h2>
<p>The practical workflow is:</p>
<ol>
  <li>Before the lesson, identify the L1 (or L1s) of your class</li>
  <li>Look up the predictable interference points for the target structure</li>
  <li>Build your warmer + controlled practice around those specific patterns</li>
  <li>Anticipate errors out loud during the lesson — students respond well to hearing "this is the bit Spanish speakers usually find tricky"</li>
</ol>

<h2>The shortcut</h2>
<p>Looking up L1-specific interference for every lesson is a part-time job in itself. The Tyoutor Pro <a href="/#features">L1-aware lesson generator</a> bakes it in automatically — set your class's L1 once, and every lesson, worksheet, and demo plan flags the interference patterns you need to address. If you'd like a deep dive on why this matters, read our launch piece on <a href="/blog/l1-aware-ai-lesson-plan-generator">L1-aware lesson planning</a>.</p>

<p><a href="/auth/signup"><strong>Try L1-aware lesson generation free →</strong></a> 5 lesson plans included.</p>
$HTML$,
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80',
  'Teaching Tips',
  array['l1-interference', 'pedagogy', 'methodology', 'class-profiles'],
  'Jordan',
  6,
  false,
  null
)
on conflict (slug) do update
  set title             = excluded.title,
      excerpt           = excluded.excerpt,
      content           = excluded.content,
      cover_image_url   = excluded.cover_image_url,
      category          = excluded.category,
      tags              = excluded.tags,
      read_time_minutes = excluded.read_time_minutes;
