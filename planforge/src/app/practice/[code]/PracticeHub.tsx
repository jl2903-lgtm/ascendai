'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { PracticeSession } from '@/types'

interface Props {
  session: PracticeSession
}

type Tab = 'flashcards' | 'practice' | 'chat'

export function PracticeHub({ session }: Props) {
  const [tab, setTab] = useState<Tab>('flashcards')

  return (
    <div className="min-h-screen bg-[#F7F6F2]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header className="bg-white border-b border-[#E8E4DE] px-4 py-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#2D6A4F' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </div>
            <div>
              <div className="text-xs font-bold text-[#2D2D2D] leading-none">Tyoutor Pro</div>
              <div className="text-xs text-[#8C8880] leading-none mt-0.5">Practice Session</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-[#2D2D2D] truncate max-w-[160px]">{session.lesson_topic}</div>
            <div className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5" style={{ background: '#E8F5E9', color: '#2D6A4F' }}>{session.lesson_level}</div>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-[#E8E4DE] sticky top-[57px] z-10">
        <div className="max-w-lg mx-auto flex">
          {([
            { key: 'flashcards', label: 'Flashcards 🃏' },
            { key: 'practice', label: 'Practice ✏️' },
            { key: 'chat', label: 'Chat 💬' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 py-3.5 text-sm font-semibold transition-all"
              style={{
                color: tab === t.key ? '#2D6A4F' : '#9CA3AF',
                borderBottom: tab === t.key ? '2.5px solid #2D6A4F' : '2.5px solid transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {tab === 'flashcards' && <FlashcardsTab session={session} />}
        {tab === 'practice' && <PracticeTab session={session} />}
        {tab === 'chat' && <ChatTab session={session} />}
      </main>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-[#8C8880]">
        Powered by Tyoutor Pro ·{' '}
        <Link href="/auth/signup" className="font-semibold" style={{ color: '#2D6A4F' }}>
          Sign up free →
        </Link>
      </div>
    </div>
  )
}

/* ─── Flashcards Tab ─── */
function FlashcardsTab({ session }: Props) {
  const vocab = session.vocabulary
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const current = vocab[index]
  if (!current) return <EmptyState text="No vocabulary words for this lesson." />

  const go = (dir: -1 | 1) => {
    setFlipped(false)
    setTimeout(() => setIndex(i => Math.max(0, Math.min(vocab.length - 1, i + dir))), 150)
  }

  return (
    <div className="space-y-6">
      <div className="text-center text-sm font-medium text-[#8C8880]">
        {index + 1} of {vocab.length} words
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#E8E4DE] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${((index + 1) / vocab.length) * 100}%`, background: '#2D6A4F' }}
        />
      </div>

      {/* Card */}
      <div
        className="cursor-pointer select-none"
        style={{ perspective: '1000px', minHeight: 220 }}
        onClick={() => setFlipped(f => !f)}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: 220,
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6 shadow-lg"
            style={{ backfaceVisibility: 'hidden', background: '#2D6A4F' }}
          >
            <div className="text-3xl font-bold text-white text-center">{current.word}</div>
            <div className="mt-4 text-sm text-white/60">Tap to reveal definition</div>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6 shadow-lg bg-white border border-[#E8E4DE]"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="text-lg font-semibold text-[#2D2D2D] text-center mb-3">{current.definition}</div>
            <div className="text-sm text-[#6B6860] text-center italic leading-relaxed">&ldquo;{current.example}&rdquo;</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          className="flex-1 py-3.5 rounded-2xl text-sm font-bold border-2 border-[#E8E4DE] text-[#6B6860] disabled:opacity-30 active:scale-95 transition-transform"
        >
          ← Previous
        </button>
        <button
          onClick={() => go(1)}
          disabled={index === vocab.length - 1}
          className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white active:scale-95 transition-transform"
          style={{ background: '#2D6A4F' }}
        >
          Next →
        </button>
      </div>

      <div className="text-center text-xs text-[#8C8880] bg-white rounded-xl px-4 py-2.5 border border-[#E8E4DE]">
        Lesson: {session.lesson_topic} · {session.lesson_level}
      </div>
    </div>
  )
}

/* ─── Practice Tab ─── */
function PracticeTab({ session }: Props) {
  const sentences = session.practice_sentences
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const current = sentences[index]
  if (!current || sentences.length === 0) return <EmptyState text="No practice sentences for this lesson." />

  const displaySentence = current.sentence.replace('________', '________')

  const checkAnswer = () => {
    const correct = answer.trim().toLowerCase() === current.blank_word.toLowerCase()
    setResult(correct ? 'correct' : 'wrong')
    if (correct) setScore(s => s + 1)
  }

  const next = () => {
    if (index + 1 >= sentences.length) {
      setDone(true)
    } else {
      setIndex(i => i + 1)
      setAnswer('')
      setResult(null)
      setShowHint(false)
    }
  }

  const reset = () => {
    setIndex(0)
    setAnswer('')
    setResult(null)
    setShowHint(false)
    setScore(0)
    setDone(false)
  }

  if (done) {
    const pct = Math.round((score / sentences.length) * 100)
    return (
      <div className="text-center space-y-6 py-8">
        <div className="text-6xl">{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪'}</div>
        <div>
          <div className="text-3xl font-bold text-[#2D2D2D]">{score}/{sentences.length}</div>
          <div className="text-lg text-[#6B6860] mt-1">
            {pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good effort!' : 'Keep practising!'}
          </div>
        </div>
        <div className="h-3 bg-[#E8E4DE] rounded-full overflow-hidden mx-4">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#2D6A4F' }} />
        </div>
        <button
          onClick={reset}
          className="px-8 py-3.5 rounded-2xl text-white font-bold text-sm active:scale-95 transition-transform"
          style={{ background: '#2D6A4F' }}
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#8C8880] font-medium">{index + 1} of {sentences.length}</span>
        <span className="font-bold" style={{ color: '#2D6A4F' }}>Score: {score}</span>
      </div>

      <div className="h-1.5 bg-[#E8E4DE] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${(index / sentences.length) * 100}%`, background: '#2D6A4F' }} />
      </div>

      <div className="bg-white rounded-2xl p-5 border border-[#E8E4DE] shadow-sm">
        <div className="text-base font-semibold text-[#2D2D2D] leading-relaxed mb-1">Fill in the blank:</div>
        <div className="text-lg text-[#4A473E] leading-relaxed mt-2">{displaySentence}</div>
      </div>

      {showHint && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-700">
          Hint: {current.hint}
        </div>
      )}

      <input
        type="text"
        value={answer}
        onChange={e => { setAnswer(e.target.value); setResult(null) }}
        onKeyDown={e => { if (e.key === 'Enter' && !result) checkAnswer() }}
        placeholder="Type your answer..."
        disabled={!!result}
        className="w-full border-2 rounded-2xl px-4 py-3.5 text-base outline-none transition-colors"
        style={{
          borderColor: result === 'correct' ? '#22C55E' : result === 'wrong' ? '#EF4444' : '#E5E7EB',
          background: result === 'correct' ? '#F0FFF4' : result === 'wrong' ? '#FFF5F5' : 'white',
        }}
      />

      {result && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${result === 'correct' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {result === 'correct' ? '✓ Correct!' : `✗ The answer is: ${current.blank_word}`}
        </div>
      )}

      <div className="flex gap-3">
        {!result && (
          <button
            onClick={() => setShowHint(h => !h)}
            className="px-4 py-3 rounded-2xl text-sm font-semibold border-2 border-[#E8E4DE] text-[#6B6860] active:scale-95 transition-transform"
          >
            💡 Hint
          </button>
        )}
        {!result ? (
          <button
            onClick={checkAnswer}
            disabled={!answer.trim()}
            className="flex-1 py-3 rounded-2xl text-white text-sm font-bold disabled:opacity-40 active:scale-95 transition-transform"
            style={{ background: '#2D6A4F' }}
          >
            Check Answer
          </button>
        ) : (
          <button
            onClick={next}
            className="flex-1 py-3 rounded-2xl text-white text-sm font-bold active:scale-95 transition-transform"
            style={{ background: '#2D6A4F' }}
          >
            {index + 1 >= sentences.length ? 'See Results →' : 'Next →'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Chat Tab ─── */
interface Message { role: 'user' | 'assistant'; content: string }

function ChatTab({ session }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const res = await fetch('/api/practice/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareCode: session.share_code,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (res.ok && data.reply) {
        setMessages(m => [...m, { role: 'assistant', content: data.reply }])
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: "Sorry, I couldn't connect. Please try again!" }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 200px)', minHeight: 400 }}>
      {/* System intro */}
      <div className="bg-white rounded-2xl p-4 border border-[#E8E4DE] mb-4 text-sm text-[#4A473E] leading-relaxed">
        Hi! I&apos;m your English practice partner. We just studied <strong>{session.lesson_topic}</strong>. Let&apos;s practice together! 💬
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
              style={m.role === 'user'
                ? { background: '#2D6A4F', color: 'white', borderBottomRightRadius: 4 }
                : { background: 'white', color: '#374151', border: '1px solid #E5E7EB', borderBottomLeftRadius: 4 }
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#E8E4DE] rounded-2xl px-4 py-3" style={{ borderBottomLeftRadius: 4 }}>
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#C4C0BA]" style={{ animation: `bounce 1s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-2 border-t border-[#E8E4DE]">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send() }}
          placeholder="Type a message..."
          className="flex-1 border-2 border-[#E8E4DE] rounded-2xl px-4 py-3 text-sm outline-none focus:border-green-500 transition-colors"
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="px-5 py-3 rounded-2xl text-white text-sm font-bold disabled:opacity-40 active:scale-95 transition-transform flex-shrink-0"
          style={{ background: '#2D6A4F' }}
        >
          Send
        </button>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-16 text-[#8C8880]">
      <div className="text-4xl mb-3">📚</div>
      <div className="text-sm">{text}</div>
    </div>
  )
}
