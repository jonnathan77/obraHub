require('dotenv').config()
const fetch = global.fetch || require('node-fetch')

async function callOpenAIChat(prompt, options = {}) {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY não configurada')

  const body = {
    model: options.model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: options.maxTokens || 800
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const t = await res.text()
    throw new Error(`OpenAI error: ${res.status} ${t}`)
  }
  const json = await res.json()
  return json.choices && json.choices[0] && json.choices[0].message ? json.choices[0].message.content : JSON.stringify(json)
}

async function callGenericProvider(prompt, options = {}) {
  // If user uses a Gemini-compatible endpoint, set GEMINI_API_URL and GEMINI_API_KEY
  const url = process.env.GEMINI_API_URL
  const key = process.env.GEMINI_API_KEY
  if (!url || !key) throw new Error('GEMINI_API_URL ou GEMINI_API_KEY não configurados')

  const body = { prompt, ...options }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Provider error: ${res.status} ${t}`)
  }
  return await res.text()
}

async function generate(prompt, options = {}) {
  // Prefer explicit provider env vars. If OPENAI_API_KEY exists, use OpenAI path.
  if (process.env.OPENAI_API_KEY) return await callOpenAIChat(prompt, options)
  if (process.env.GEMINI_API_URL && process.env.GEMINI_API_KEY) return await callGenericProvider(prompt, options)
  throw new Error('Nenhum provedor de IA configurado. Defina OPENAI_API_KEY ou GEMINI_API_URL + GEMINI_API_KEY')
}

module.exports = { generate }
