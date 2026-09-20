/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Natural language -> DQL generation. Bring-your-own-key: keys are
// stored in localStorage only and requests go directly from the browser
// to the chosen model API; nothing passes through the Ratel server.

const SETTINGS_KEY = 'ratel-ai-settings'

export const PROVIDERS = {
  anthropic: {
    label: 'Anthropic (Claude)',
    keyPlaceholder: 'sk-ant-...',
    defaultModel: 'claude-haiku-4-5-20251001',
    models: [
      ['claude-haiku-4-5-20251001', 'Claude Haiku 4.5 (fast)'],
      ['claude-sonnet-4-6', 'Claude Sonnet 4.6 (capable)'],
    ],
    buildRequest({ apiKey, model, system, user }) {
      return {
        url: 'https://api.anthropic.com/v1/messages',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          // Explicit opt-in to browser-side calls; the key is the user's own.
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: {
          model,
          max_tokens: 1024,
          system,
          messages: [{ role: 'user', content: user }],
        },
      }
    },
    parseResponse(body) {
      return (body.content || [])
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n')
    },
    parseError(body) {
      return body?.error?.message
    },
  },

  openai: {
    label: 'OpenAI (ChatGPT)',
    keyPlaceholder: 'sk-...',
    defaultModel: 'gpt-5-mini',
    models: [
      ['gpt-5-mini', 'GPT-5 mini (fast)'],
      ['gpt-5.1', 'GPT-5.1 (capable)'],
    ],
    buildRequest({ apiKey, model, system, user }) {
      return {
        url: 'https://api.openai.com/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: {
          model,
          max_completion_tokens: 1024,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        },
      }
    },
    parseResponse(body) {
      return body.choices?.[0]?.message?.content || ''
    },
    parseError(body) {
      return body?.error?.message
    },
  },

  gemini: {
    label: 'Google (Gemini)',
    keyPlaceholder: 'AIza...',
    defaultModel: 'gemini-2.5-flash',
    models: [
      ['gemini-2.5-flash', 'Gemini 2.5 Flash (fast)'],
      ['gemini-2.5-pro', 'Gemini 2.5 Pro (capable)'],
    ],
    buildRequest({ apiKey, model, system, user }) {
      return {
        // The key goes in a header, not the query string, so it never
        // lands in proxy logs or browser history.
        url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: {
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { maxOutputTokens: 1024 },
        },
      }
    },
    parseResponse(body) {
      return (body.candidates?.[0]?.content?.parts || [])
        .map((part) => part.text || '')
        .join('\n')
    },
    parseError(body) {
      return body?.error?.message
    },
  },
}

export const PROVIDER_IDS = Object.keys(PROVIDERS)
export const DEFAULT_PROVIDER = 'anthropic'

const isValidModel = (provider, model) =>
  PROVIDERS[provider].models.some(([m]) => m === model)

const emptyProviderSettings = (provider) => ({
  apiKey: '',
  model: PROVIDERS[provider].defaultModel,
})

function sanitizeProviderSettings(provider, raw) {
  const out = emptyProviderSettings(provider)
  if (raw && typeof raw === 'object') {
    if (typeof raw.apiKey === 'string') {
      out.apiKey = raw.apiKey
    }
    if (isValidModel(provider, raw.model)) {
      out.model = raw.model
    }
  }
  return out
}

/**
 * Settings shape: { provider, anthropic: {apiKey, model}, openai: {...},
 * gemini: {...} }. The pre-multi-provider shape ({apiKey, model}) is
 * migrated into the anthropic slot.
 */
export function loadAiSettings(storage = window.localStorage) {
  let parsed = {}
  try {
    parsed = JSON.parse(storage.getItem(SETTINGS_KEY)) || {}
  } catch {
    parsed = {}
  }

  // Legacy single-provider settings.
  if (typeof parsed.apiKey === 'string' && !parsed.provider) {
    parsed = { provider: 'anthropic', anthropic: parsed }
  }

  const settings = {
    provider: PROVIDER_IDS.includes(parsed.provider)
      ? parsed.provider
      : DEFAULT_PROVIDER,
  }
  PROVIDER_IDS.forEach((provider) => {
    settings[provider] = sanitizeProviderSettings(provider, parsed[provider])
  })
  return settings
}

export function saveAiSettings(settings, storage = window.localStorage) {
  try {
    const out = {
      provider: PROVIDER_IDS.includes(settings.provider)
        ? settings.provider
        : DEFAULT_PROVIDER,
    }
    PROVIDER_IDS.forEach((provider) => {
      out[provider] = sanitizeProviderSettings(provider, settings[provider])
    })
    storage.setItem(SETTINGS_KEY, JSON.stringify(out))
  } catch {
    // Ignore - the user just re-enters the key next time.
  }
}

// Compact, prompt-friendly rendering of a `schema {}` response.
export function schemaSummary(schemaResponse) {
  const data = (schemaResponse && schemaResponse.data) || schemaResponse || {}
  const lines = []
  ;(data.schema || []).forEach((p) => {
    if (p.predicate && p.predicate.startsWith('dgraph.')) {
      return
    }
    const parts = [`${p.predicate}: ${p.type}`]
    if (p.list) {
      parts.push('@list')
    }
    if (p.index && p.tokenizer) {
      parts.push(`@index(${p.tokenizer.join(', ')})`)
    }
    if (p.reverse) {
      parts.push('@reverse')
    }
    lines.push(parts.join(' '))
  })
  ;(data.types || []).forEach((t) => {
    if (t.name && t.name.startsWith('dgraph.')) {
      return
    }
    const fields = (t.fields || []).map((f) => f.name).join(', ')
    lines.push(`type ${t.name} { ${fields} }`)
  })

  return lines.join('\n')
}

export function buildPrompt(schemaText, request) {
  const system = [
    'You translate natural language into Dgraph DQL (GraphQL+-) queries.',
    'Reply with a single DQL query in a ```dql code block and nothing else.',
    'Rules:',
    '- Use only predicates and types that exist in the provided schema.',
    '- Prefer func: type(...) or indexed predicates for the root function.',
    '- Include uid and a human-readable name predicate in results when available.',
    '- Use pagination (first: 100) unless the user asks otherwise.',
  ].join('\n')

  const user = [
    'Schema:',
    '```',
    schemaText || '(schema unavailable)',
    '```',
    '',
    'Request: ' + request,
  ].join('\n')

  return { system, user }
}

// Pulls the DQL out of a model response: prefers fenced code blocks,
// falls back to the raw text.
export function extractDql(text) {
  if (!text) {
    return ''
  }
  const fence = text.match(/```(?:dql|graphql)?\s*\n([\s\S]*?)```/)
  if (fence) {
    return fence[1].trim()
  }
  return text.trim()
}

export async function generateDql({
  provider = DEFAULT_PROVIDER,
  apiKey,
  model,
  schemaText,
  request,
  fetchFn = fetch,
}) {
  const providerDef = PROVIDERS[provider]
  if (!providerDef) {
    throw new Error(`Unknown provider: ${provider}`)
  }
  if (!apiKey) {
    throw new Error('API key is required')
  }

  const { system, user } = buildPrompt(schemaText, request)
  const { url, headers, body } = providerDef.buildRequest({
    apiKey,
    model: model || providerDef.defaultModel,
    system,
    user,
  })

  const res = await fetchFn(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    let detail = `${res.status}`
    try {
      detail = providerDef.parseError(await res.json()) || detail
    } catch {
      // Keep the status code.
    }
    throw new Error(`Model request failed: ${detail}`)
  }

  const text = providerDef.parseResponse(await res.json())
  const dql = extractDql(text)
  if (!dql) {
    throw new Error('The model returned no query')
  }
  return dql
}
