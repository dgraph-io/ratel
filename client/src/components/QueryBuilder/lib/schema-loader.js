/**
 * Converts Dgraph schema JSON — the result of running `schema { }` — into the
 * builder's entity format:
 *   { TypeName: { color, fields: [{ name, type, kind, ofType? }] } }
 *
 * Expected shape (keys are case-insensitive; PascalCase shown):
 * {
 *   "Schema": [
 *     { "Predicate": "name", "Type": "string", "Index": true, "Tokenizer": ["term"] },
 *     { "Predicate": "posts", "Type": "uid", "List": true }
 *   ],
 *   "Types": [
 *     {
 *       "Name": "User",
 *       "Fields": [ { "Name": "name" }, { "Name": "posts" } ]
 *     }
 *   ]
 * }
 *
 * A `"data"` / `"Data"` wrapper is also accepted.
 */
window.DQLSchemaLoader = (() => {
  const COLORS = [
    '#1f8a5a',
    '#d97706',
    '#2563eb',
    '#0f766e',
    '#b91c1c',
    '#7c3aed',
    '#be185d',
    '#4d7c0f',
    '#0e7490',
    '#a16207',
    '#6d28d9',
    '#374151',
  ]

  // Dgraph schema queries are not wrapped in outer `{ … }` like normal DQL queries.
  const SCHEMA_QUERY = 'schema { }'

  function assignColors(out) {
    Object.values(out).forEach((def, i) => {
      def.color = COLORS[i % COLORS.length]
    })
    return out
  }

  function stripName(raw) {
    const t = String(raw || '').trim()
    if (t.startsWith('<') && t.endsWith('>')) return t.slice(1, -1).trim()
    return t
  }

  function normalizeScalar(typeName) {
    const t = String(typeName || 'string').toLowerCase()
    if (t === 'default' || t === 'password') return 'string'
    if (t === 'datetime' || t === 'dateTime'.toLowerCase()) return 'datetime'
    if (t === 'float32vector' || t === 'bigfloat') return 'float'
    if (
      ['int', 'float', 'string', 'bool', 'datetime', 'geo', 'uid'].includes(t)
    ) {
      return t
    }
    return 'string'
  }

  function guessOfType(predName, typeNames, selfType) {
    let base = String(predName || '')
    if (base.includes('.')) base = base.split('.').pop()

    const ALIASES = {
      author: ['Author', 'User', 'Person'],
      owner: ['Owner', 'User', 'Person'],
      creator: ['Creator', 'User', 'Person'],
      user: ['User', 'Person'],
      writer: ['Writer', 'User', 'Person'],
    }

    if (/ies$/i.test(base)) base = `${base.slice(0, -3)}y`
    else if (/ses$/i.test(base)) base = base.slice(0, -2)
    else if (/s$/i.test(base) && !/ss$/i.test(base)) base = base.slice(0, -1)

    const candidates = [
      base,
      base.charAt(0).toUpperCase() + base.slice(1),
      ...(ALIASES[base.toLowerCase()] || []),
      predName,
    ]
    for (const c of candidates) {
      if (typeNames.has(c) && c !== selfType) return c
    }
    for (const t of typeNames) {
      if (t !== selfType && t.toLowerCase() === base.toLowerCase()) return t
    }
    return null
  }

  function ensureUidField(fields) {
    if (!fields.some((f) => f.name === 'uid')) {
      fields.unshift({ name: 'uid', type: 'uid', kind: 'scalar' })
    }
    return fields
  }

  /** Read obj[key] case-insensitively (first match wins). */
  function getCI(obj, key) {
    if (!obj || typeof obj !== 'object') return undefined
    if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key]
    const want = String(key).toLowerCase()
    for (const k of Object.keys(obj)) {
      if (k.toLowerCase() === want) return obj[k]
    }
    return undefined
  }

  function pickCI(obj, ...keys) {
    for (const key of keys) {
      const value = getCI(obj, key)
      if (value !== undefined && value !== null) return value
    }
    return undefined
  }

  function schemaRoot(payload) {
    if (!payload || typeof payload !== 'object') return null
    const nested = getCI(payload, 'data')
    if (nested && typeof nested === 'object') {
      if (
        Array.isArray(getCI(nested, 'schema')) ||
        Array.isArray(getCI(nested, 'types'))
      ) {
        return nested
      }
    }
    if (
      Array.isArray(getCI(payload, 'schema')) ||
      Array.isArray(getCI(payload, 'types'))
    ) {
      return payload
    }
    return null
  }

  function isSchemaPayload(obj) {
    return schemaRoot(obj) != null
  }

  /**
   * @param {object} payload schema query JSON
   */
  function fromSchemaJson(payload) {
    const data = schemaRoot(payload)
    if (!data) {
      throw new Error(
        'Not a Dgraph schema JSON. Expected { "Schema": [...], "Types": [...] } (keys are case-insensitive).',
      )
    }

    const predicates = new Map()
    ;(getCI(data, 'schema') || []).forEach((row) => {
      if (!row || typeof row !== 'object') return
      const name = stripName(pickCI(row, 'predicate', 'name'))
      if (!name || name.toLowerCase().startsWith('dgraph.')) return

      let type = String(pickCI(row, 'type') || 'string')
      let list = !!pickCI(row, 'list')
      // Some exports use type: "[uid]" / "[string]" instead of list: true
      const listMatch = type.match(/^\[(.+)\]$/)
      if (listMatch) {
        list = true
        type = listMatch[1]
      }
      type = type.toLowerCase()

      predicates.set(name, { type, list })
    })

    const types = new Map()
    ;(getCI(data, 'types') || []).forEach((row) => {
      if (!row || typeof row !== 'object') return
      const typeName = stripName(pickCI(row, 'name'))
      if (!typeName || typeName.toLowerCase().startsWith('dgraph.')) return

      const fields = (getCI(row, 'fields') || [])
        .map((f) => stripName(typeof f === 'string' ? f : pickCI(f, 'name')))
        .filter((n) => n && !n.toLowerCase().startsWith('dgraph.'))
      if (fields.length) types.set(typeName, fields)
    })

    if (!types.size) {
      throw new Error(
        'Schema JSON has no usable "types". The builder needs type definitions to list entities.',
      )
    }

    // Predicates missing from schema[] (types-only paste): default to string.
    types.forEach((fields) => {
      fields.forEach((f) => {
        if (!predicates.has(f))
          predicates.set(f, { type: 'string', list: false })
      })
    })

    const typeNames = new Set(types.keys())
    const out = {}

    types.forEach((fieldNames, typeName) => {
      const fields = []
      fieldNames.forEach((pred) => {
        if (!pred || pred === 'uid') return
        const meta = predicates.get(pred) || { type: 'string', list: false }
        const isUid = meta.type === 'uid'

        if (isUid) {
          const ofType = guessOfType(pred, typeNames, typeName)
          if (ofType) {
            fields.push({
              name: pred,
              type: meta.list ? '[uid]' : 'uid',
              kind: 'object',
              ofType,
            })
          } else {
            fields.push({
              name: pred,
              type: meta.list ? '[uid]' : 'uid',
              kind: 'scalar',
            })
          }
        } else {
          fields.push({
            name: pred,
            type: normalizeScalar(meta.type),
            kind: 'scalar',
          })
        }
      })
      out[typeName] = { color: '', fields: ensureUidField(fields) }
    })

    return assignColors(out)
  }

  function fromText(raw) {
    const text = String(raw || '')
      .replace(/^\uFEFF/, '')
      .trim()
    if (!text) throw new Error('Nothing to parse')
    let json
    try {
      json = JSON.parse(text)
    } catch (err) {
      throw new Error(
        `Expected JSON from a Dgraph \`schema { }\` query. ${err.message}`,
      )
    }
    return fromSchemaJson(json)
  }

  function queryEndpoints(url) {
    const base = String(url || '')
      .trim()
      .replace(/\/$/, '')
    if (!base) return []
    const endpoints = [base]
    if (!/\/query$/i.test(base)) endpoints.push(`${base}/query`)
    return [...new Set(endpoints)]
  }

  async function tryQuerySchema(endpoint) {
    const attempts = [
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ query: SCHEMA_QUERY }),
      },
      {
        headers: {
          'Content-Type': 'application/dql',
          Accept: 'application/json',
        },
        body: SCHEMA_QUERY,
      },
      {
        headers: { 'Content-Type': 'text/plain', Accept: 'application/json' },
        body: SCHEMA_QUERY,
      },
    ]

    const errors = []
    for (const attempt of attempts) {
      try {
        const res = await fetch(endpoint, { method: 'POST', ...attempt })
        if (!res.ok) {
          errors.push(`POST ${endpoint} → HTTP ${res.status}`)
          continue
        }
        const json = await res.json()
        if (json?.errors?.length) {
          errors.push(json.errors.map((e) => e.message || String(e)).join('; '))
          continue
        }
        if (isSchemaPayload(json)) return fromSchemaJson(json)
        errors.push(`POST ${endpoint} returned JSON without schema/types`)
      } catch (err) {
        errors.push(`POST ${endpoint} failed: ${err.message}`)
      }
    }
    throw new Error(errors.join(' · '))
  }

  async function fetchSchema(url) {
    const errors = []
    const endpoints = queryEndpoints(url)
    if (!endpoints.length) throw new Error('Enter a Dgraph Alpha URL first.')

    for (const endpoint of endpoints) {
      try {
        return await tryQuerySchema(endpoint)
      } catch (err) {
        errors.push(err.message)
      }
    }

    // Allow fetching a hosted schema JSON file.
    try {
      const res = await fetch(url)
      if (res.ok) return fromSchemaJson(await res.json())
      errors.push(`GET ${url} → HTTP ${res.status}`)
    } catch (err) {
      errors.push(`GET failed: ${err.message}`)
    }

    throw new Error(errors.join(' · '))
  }

  return { fromSchemaJson, fromText, fetchSchema }
})()
