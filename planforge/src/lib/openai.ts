// OpenAI singleton client
import OpenAI from 'openai'

let _client: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    // 55s timeout — well under Vercel Pro's 60s default so the request fails
    // client-side before Vercel kills the whole function. Long generation
    // routes that need longer set their own `maxDuration` and pass a per-
    // request timeout on the create() call if needed.
    _client = new OpenAI({ apiKey, timeout: 55_000 })
  }
  return _client
}
