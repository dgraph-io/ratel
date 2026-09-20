/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DEFAULT_PROVIDER,
  PROVIDERS,
  PROVIDER_IDS,
  buildPrompt,
  extractDql,
  generateDql,
  loadAiSettings,
  saveAiSettings,
  schemaSummary,
} from './nl2dql'

const memoryStorage = () => {
  const data = {}
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => (data[k] = String(v)),
  }
}

describe('settings', () => {
  it('round-trips per-provider settings', () => {
    const storage = memoryStorage()
    saveAiSettings(
      {
        provider: 'gemini',
        gemini: { apiKey: 'AIza-test', model: 'gemini-2.5-pro' },
        openai: { apiKey: 'sk-oa' },
      },
      storage,
    )
    const loaded = loadAiSettings(storage)
    expect(loaded.provider).toBe('gemini')
    expect(loaded.gemini).toEqual({
      apiKey: 'AIza-test',
      model: 'gemini-2.5-pro',
    })
    expect(loaded.openai).toEqual({
      apiKey: 'sk-oa',
      model: PROVIDERS.openai.defaultModel,
    })
    expect(loaded.anthropic).toEqual({
      apiKey: '',
      model: PROVIDERS.anthropic.defaultModel,
    })
  })

  it('migrates legacy single-provider settings into the anthropic slot', () => {
    const storage = memoryStorage()
    storage.setItem(
      'ratel-ai-settings',
      JSON.stringify({ apiKey: 'sk-legacy', model: 'claude-sonnet-4-6' }),
    )
    const loaded = loadAiSettings(storage)
    expect(loaded.provider).toBe('anthropic')
    expect(loaded.anthropic).toEqual({
      apiKey: 'sk-legacy',
      model: 'claude-sonnet-4-6',
    })
  })

  it('rejects unknown providers/models and corrupt storage', () => {
    const storage = memoryStorage()
    storage.setItem(
      'ratel-ai-settings',
      JSON.stringify({
        provider: 'skynet',
        anthropic: { apiKey: 1, model: 'gpt-99' },
      }),
    )
    const loaded = loadAiSettings(storage)
    expect(loaded.provider).toBe(DEFAULT_PROVIDER)
    expect(loaded.anthropic).toEqual({
      apiKey: '',
      model: PROVIDERS.anthropic.defaultModel,
    })

    storage.setItem('ratel-ai-settings', 'not json')
    expect(loadAiSettings(storage).provider).toBe(DEFAULT_PROVIDER)
  })
})

describe('provider request shapes', () => {
  const args = {
    apiKey: 'test-key',
    model: 'some-model',
    system: 'SYS',
    user: 'USR',
  }

  it('anthropic: messages API with browser-access header', () => {
    const { url, headers, body } = PROVIDERS.anthropic.buildRequest(args)
    expect(url).toContain('api.anthropic.com/v1/messages')
    expect(headers['x-api-key']).toBe('test-key')
    expect(headers['anthropic-dangerous-direct-browser-access']).toBe('true')
    expect(body.system).toBe('SYS')
    expect(body.messages).toEqual([{ role: 'user', content: 'USR' }])
  })

  it('openai: chat completions with bearer auth and system message', () => {
    const { url, headers, body } = PROVIDERS.openai.buildRequest(args)
    expect(url).toContain('api.openai.com/v1/chat/completions')
    expect(headers.Authorization).toBe('Bearer test-key')
    expect(body.model).toBe('some-model')
    expect(body.max_completion_tokens).toBe(1024)
    expect(body.messages).toEqual([
      { role: 'system', content: 'SYS' },
      { role: 'user', content: 'USR' },
    ])
  })

  it('gemini: generateContent with key in header, not URL', () => {
    const { url, headers, body } = PROVIDERS.gemini.buildRequest(args)
    expect(url).toContain('models/some-model:generateContent')
    expect(url).not.toContain('test-key')
    expect(headers['x-goog-api-key']).toBe('test-key')
    expect(body.system_instruction.parts[0].text).toBe('SYS')
    expect(body.contents).toEqual([{ role: 'user', parts: [{ text: 'USR' }] }])
  })
})

describe('provider response parsing', () => {
  it('anthropic: joins text blocks', () => {
    expect(
      PROVIDERS.anthropic.parseResponse({
        content: [
          { type: 'text', text: 'a' },
          { type: 'tool_use' },
          { type: 'text', text: 'b' },
        ],
      }),
    ).toBe('a\nb')
  })

  it('openai: reads first choice message', () => {
    expect(
      PROVIDERS.openai.parseResponse({
        choices: [{ message: { content: 'hello' } }],
      }),
    ).toBe('hello')
    expect(PROVIDERS.openai.parseResponse({})).toBe('')
  })

  it('gemini: joins candidate parts', () => {
    expect(
      PROVIDERS.gemini.parseResponse({
        candidates: [{ content: { parts: [{ text: 'x' }, { text: 'y' }] } }],
      }),
    ).toBe('x\ny')
    expect(PROVIDERS.gemini.parseResponse({})).toBe('')
  })
})

describe('schemaSummary', () => {
  it('renders predicates with index/list/reverse and types', () => {
    const summary = schemaSummary({
      data: {
        schema: [
          {
            predicate: 'name',
            type: 'string',
            index: true,
            tokenizer: ['term', 'exact'],
          },
          { predicate: 'friend', type: 'uid', list: true, reverse: true },
          { predicate: 'dgraph.type', type: 'string' },
        ],
        types: [
          { name: 'Person', fields: [{ name: 'name' }, { name: 'friend' }] },
          { name: 'dgraph.graphql', fields: [] },
        ],
      },
    })
    expect(summary).toContain('name: string @index(term, exact)')
    expect(summary).toContain('friend: uid @list @reverse')
    expect(summary).toContain('type Person { name, friend }')
    expect(summary).not.toContain('dgraph.')
  })

  it('handles empty responses', () => {
    expect(schemaSummary(null)).toBe('')
    expect(schemaSummary({ data: {} })).toBe('')
  })
})

describe('buildPrompt', () => {
  it('includes schema and request', () => {
    const { system, user } = buildPrompt('name: string', 'find all people')
    expect(system).toContain('DQL')
    expect(user).toContain('name: string')
    expect(user).toContain('Request: find all people')
  })

  it('notes missing schema', () => {
    expect(buildPrompt('', 'x').user).toContain('(schema unavailable)')
  })
})

describe('extractDql', () => {
  it('prefers fenced blocks', () => {
    expect(
      extractDql('Here:\n```dql\n{ q(func: has(name)) { uid } }\n```'),
    ).toBe('{ q(func: has(name)) { uid } }')
    expect(extractDql('```\n{ x }\n```')).toBe('{ x }')
  })

  it('falls back to raw text', () => {
    expect(extractDql('  { q { uid } }  ')).toBe('{ q { uid } }')
    expect(extractDql('')).toBe('')
  })
})

describe('generateDql', () => {
  const anthropicResponse = (text) => ({
    ok: true,
    json: async () => ({ content: [{ type: 'text', text }] }),
  })

  it('uses the chosen provider end to end (openai)', async () => {
    const fetchFn = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: { content: '```dql\n{ q(func: type(P)) { uid } }\n```' },
          },
        ],
      }),
    }))
    const dql = await generateDql({
      provider: 'openai',
      apiKey: 'sk-test',
      model: 'gpt-5.1',
      schemaText: 'name: string',
      request: 'all people',
      fetchFn,
    })
    expect(dql).toBe('{ q(func: type(P)) { uid } }')
    const [url, opts] = fetchFn.mock.calls[0]
    expect(url).toContain('api.openai.com')
    expect(JSON.parse(opts.body).model).toBe('gpt-5.1')
  })

  it('uses the chosen provider end to end (gemini)', async () => {
    const fetchFn = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '{ q { uid } }' }] } }],
      }),
    }))
    const dql = await generateDql({
      provider: 'gemini',
      apiKey: 'AIza',
      request: 'x',
      fetchFn,
    })
    expect(dql).toBe('{ q { uid } }')
    expect(fetchFn.mock.calls[0][0]).toContain(
      `models/${PROVIDERS.gemini.defaultModel}:generateContent`,
    )
  })

  it('defaults to anthropic and falls back to the default model', async () => {
    const fetchFn = jest.fn(async () =>
      anthropicResponse('```dql\n{ q { uid } }\n```'),
    )
    await generateDql({ apiKey: 'sk', request: 'x', fetchFn })
    const [url, opts] = fetchFn.mock.calls[0]
    expect(url).toContain('api.anthropic.com')
    expect(JSON.parse(opts.body).model).toBe(PROVIDERS.anthropic.defaultModel)
  })

  it('rejects unknown providers and missing keys', async () => {
    await expect(
      generateDql({ provider: 'skynet', apiKey: 'x', request: 'x' }),
    ).rejects.toThrow('Unknown provider')
    await expect(generateDql({ apiKey: '', request: 'x' })).rejects.toThrow(
      'API key',
    )
  })

  it('surfaces provider error messages', async () => {
    const fetchFn = jest.fn(async () => ({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'invalid api key' } }),
    }))
    await expect(
      generateDql({ provider: 'openai', apiKey: 'bad', request: 'x', fetchFn }),
    ).rejects.toThrow('invalid api key')
  })

  it('throws when the model returns no query', async () => {
    const fetchFn = jest.fn(async () => anthropicResponse(''))
    await expect(
      generateDql({ apiKey: 'sk', request: 'x', fetchFn }),
    ).rejects.toThrow('no query')
  })

  it('every provider id has a complete definition', () => {
    PROVIDER_IDS.forEach((id) => {
      const def = PROVIDERS[id]
      expect(def.label).toBeTruthy()
      expect(def.defaultModel).toBeTruthy()
      expect(def.models.length).toBeGreaterThan(0)
      expect(typeof def.buildRequest).toBe('function')
      expect(typeof def.parseResponse).toBe('function')
    })
  })
})
