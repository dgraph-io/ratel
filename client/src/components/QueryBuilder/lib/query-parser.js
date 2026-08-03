/**
 * Parse DQL query text into canvas-ready blocks.
 * Supports the subset the builder emits (and common hand-written variants):
 *   query Name($p: string = "x") {
 *     Result(func: type("Type")) @filter(...) @cascade @normalize {
 *       alias: predicate
 *       edge @filter(...) { ... }
 *     }
 *   }
 *
 * Line (#, //) and block (/* *\/) comments are preserved on operations and
 * fields so canvas regeneration can round-trip them back into the editor.
 */
window.DQLQueryParser = (() => {
  const PARAM_TYPES = ['string', 'int', 'float', 'bool']

  /**
   * Read a # / // / /* *\/ comment at `i`, or null.
   * Line comments exclude the terminating newline; block comments keep interior newlines.
   */
  function tryReadComment(src, i) {
    if (i >= src.length) return null
    const ch = src[i]
    const next = src[i + 1]
    if (ch === '/' && next === '*') {
      let j = i + 2
      while (j < src.length && !(src[j] === '*' && src[j + 1] === '/')) j += 1
      if (j < src.length) j += 2
      return { text: src.slice(i, j), end: j }
    }
    if ((ch === '/' && next === '/') || ch === '#') {
      let j = i
      while (j < src.length && src[j] !== '\n') j += 1
      return { text: src.slice(i, j).replace(/\s+$/, ''), end: j }
    }
    return null
  }

  function skipWs(src, i) {
    while (i < src.length && /\s/.test(src[i])) i += 1
    return i
  }

  /** Skip whitespace and comments; optionally collect comment texts. */
  function skipTrivia(src, i, { collect = true } = {}) {
    const comments = []
    while (i < src.length) {
      if (/\s/.test(src[i])) {
        i += 1
        continue
      }
      const comment = tryReadComment(src, i)
      if (!comment) break
      if (collect) comments.push(comment.text)
      i = comment.end
    }
    return { end: i, comments }
  }

  /** Same-line trailing comment after a field (spaces/tabs only, not newlines). */
  function readTrailingComment(src, i) {
    let j = i
    while (j < src.length && (src[j] === ' ' || src[j] === '\t')) j += 1
    const comment = tryReadComment(src, j)
    if (!comment) return { end: i, comment: null }
    return { end: comment.end, comment: comment.text }
  }

  function extractBalanced(src, openIdx, openCh = '{', closeCh = '}') {
    if (src[openIdx] !== openCh) throw new Error(`Expected '${openCh}'`)
    let depth = 0
    for (let i = openIdx; i < src.length; i += 1) {
      const ch = src[i]
      const next = src[i + 1]

      if (ch === '"' || ch === "'") {
        const q = ch
        i += 1
        while (i < src.length && src[i] !== q) {
          if (src[i] === '\\') i += 1
          i += 1
        }
        continue
      }

      // Do not count braces / parens inside comments.
      if (ch === '/' && next === '*') {
        i += 2
        while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i += 1
        if (i < src.length) i += 1 // land on '/'
        continue
      }
      if ((ch === '/' && next === '/') || ch === '#') {
        while (i < src.length && src[i] !== '\n') i += 1
        continue
      }

      if (ch === openCh) depth += 1
      else if (ch === closeCh) {
        depth -= 1
        if (depth === 0) return { inner: src.slice(openIdx + 1, i), end: i + 1 }
      }
    }
    throw new Error(`Unbalanced '${openCh}${closeCh}'`)
  }

  function readIdent(src, i) {
    i = skipWs(src, i)
    const m = src.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/)
    if (!m) return null
    return { value: m[0], end: i + m[0].length }
  }

  /** Dotted predicate: User.email / Post.title */
  function readPredicate(src, i) {
    i = skipWs(src, i)
    const m = src
      .slice(i)
      .match(/^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*/)
    if (!m) return null
    return { value: m[0], end: i + m[0].length }
  }

  function parseStringLiteral(raw) {
    const t = String(raw || '').trim()
    if (
      (t.startsWith('"') && t.endsWith('"')) ||
      (t.startsWith("'") && t.endsWith("'"))
    ) {
      try {
        // Prefer JSON for double-quoted; fall back for single-quoted.
        if (t[0] === '"') return JSON.parse(t)
        return t.slice(1, -1).replace(/\\'/g, "'")
      } catch {
        return t.slice(1, -1)
      }
    }
    return t
  }

  function inferTypeFromLiteral(raw) {
    const t = String(raw ?? '').trim()
    if (/^(true|false)$/i.test(t)) return 'bool'
    if (/^-?\d+$/.test(t)) return 'int'
    if (/^-?\d+\.\d+$/.test(t)) return 'float'
    return 'string'
  }

  /** Parse `$name: type` / `$name: type = <literal>` with string-aware defaults. */
  function parseSignature(sig) {
    if (!sig) return []
    const params = []
    let i = 0
    const src = String(sig).replace(/^\(/, '').replace(/\)$/, '')

    while (i < src.length) {
      i = skipWs(src, i)
      if (i >= src.length) break
      if (src[i] === ',') {
        i += 1
        continue
      }
      if (src[i] !== '$') break
      i += 1
      const name = readIdent(src, i)
      if (!name) break
      i = name.end
      i = skipWs(src, i)
      if (src[i] !== ':') break
      i += 1
      const typeTok = readIdent(src, i)
      if (!typeTok) break
      i = typeTok.end
      i = skipWs(src, i)

      let mode = 'var'
      let value = ''
      if (src[i] === '=') {
        i += 1
        i = skipWs(src, i)
        const start = i
        if (src[i] === '"' || src[i] === "'") {
          const q = src[i]
          i += 1
          while (i < src.length && src[i] !== q) {
            if (src[i] === '\\') i += 1
            i += 1
          }
          if (i < src.length) i += 1
          mode = 'default'
          value = String(parseStringLiteral(src.slice(start, i)))
        } else {
          while (i < src.length && src[i] !== ',') i += 1
          mode = 'default'
          value = String(parseStringLiteral(src.slice(start, i).trim()))
        }
      }

      params.push({
        name: name.value,
        type: PARAM_TYPES.includes(typeTok.value) ? typeTok.value : 'string',
        mode,
        value,
      })
    }
    return params
  }

  /** Split filter body on top-level AND / OR. */
  function splitFilterConnectors(filterInner) {
    const parts = []
    let depth = 0
    let start = 0
    let sawOr = false
    const s = String(filterInner || '')
    for (let i = 0; i < s.length; i += 1) {
      const ch = s[i]
      if (ch === '(') depth += 1
      else if (ch === ')') depth -= 1
      else if (ch === '"' || ch === "'") {
        const q = ch
        i += 1
        while (i < s.length && s[i] !== q) {
          if (s[i] === '\\') i += 1
          i += 1
        }
      } else if (depth === 0) {
        const andMatch = s.slice(i).match(/^\s+AND\s+/i)
        const orMatch = s.slice(i).match(/^\s+OR\s+/i)
        const match = andMatch || orMatch
        if (match) {
          if (orMatch) sawOr = true
          parts.push(s.slice(start, i).trim())
          i += match[0].length - 1
          start = i + 1
        }
      }
    }
    parts.push(s.slice(start).trim())
    return { parts: parts.filter(Boolean), sawOr }
  }

  /**
   * Parse one filter condition: `eq(pred, val)`, `has(pred)`, `not eq(...)`.
   * Returns { func, predicate, valueRaw, isVar, varName, literal, unary } | null
   */
  function parseOneFilterCondition(part) {
    const s = String(part || '').trim()
    if (!s) return null

    const notMatch = s.match(/^(not)\s+/i)
    let rest = s
    let notPrefix = ''
    if (notMatch) {
      notPrefix = 'not '
      rest = s.slice(notMatch[0].length).trim()
    }

    const nameMatch = rest.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\(/)
    if (!nameMatch) return null
    const funcName = nameMatch[1]
    const openIdx = rest.indexOf('(')
    let bal
    try {
      bal = extractBalanced(rest, openIdx, '(', ')')
    } catch {
      return null
    }
    // Reject trailing junk after the closing paren.
    if (rest.slice(bal.end).trim()) return null

    const argsInner = bal.inner.trim()
    if (!argsInner) return null

    // Split args on top-level comma.
    const args = []
    let depth = 0
    let start = 0
    for (let i = 0; i < argsInner.length; i += 1) {
      const ch = argsInner[i]
      if (ch === '(') depth += 1
      else if (ch === ')') depth -= 1
      else if (ch === '"' || ch === "'") {
        const q = ch
        i += 1
        while (i < argsInner.length && argsInner[i] !== q) {
          if (argsInner[i] === '\\') i += 1
          i += 1
        }
      } else if (ch === ',' && depth === 0) {
        args.push(argsInner.slice(start, i).trim())
        start = i + 1
      }
    }
    args.push(argsInner.slice(start).trim())

    const predicate = args[0]
    if (!predicate || !/^[A-Za-z_][A-Za-z0-9_.]*$/.test(predicate)) return null

    const unary = args.length === 1
    const valueRaw = unary ? '' : args.slice(1).join(', ').trim()
    const isVar = !unary && /^\$[A-Za-z_][A-Za-z0-9_]*$/.test(valueRaw)

    return {
      func: `${notPrefix}${funcName}`,
      predicate,
      valueRaw,
      isVar,
      varName: isVar ? valueRaw.slice(1) : null,
      literal: unary || isVar ? null : String(parseStringLiteral(valueRaw)),
      unary,
    }
  }

  /**
   * Split `@filter(...)` conditions on top-level AND/OR.
   * Returns { op: "AND"|"OR", filters: [...] }.
   * Mixed AND/OR without parentheses is not modeled — OR wins if any OR appears.
   */
  function parseFilterArgs(filterInner) {
    const { parts, sawOr } = splitFilterConnectors(filterInner)
    const filters = parts.map(parseOneFilterCondition).filter(Boolean)
    return { op: sawOr ? 'OR' : 'AND', filters }
  }

  function parseDirectivesAndFilter(src, i) {
    const result = {
      cascade: false,
      normalize: false,
      filterGroup: null,
      end: i,
    }
    while (true) {
      const atStart = i
      // Only consume trivia when the next token is a directive; otherwise leave
      // comments/newlines for the selection parser (next field / trailing).
      const peek = skipTrivia(src, i, { collect: false })
      if (src[peek.end] !== '@') {
        result.end = atStart
        break
      }
      i = peek.end
      const name = readIdent(src, i + 1)
      if (!name) {
        result.end = atStart
        break
      }
      i = name.end
      if (name.value === 'cascade') result.cascade = true
      else if (name.value === 'normalize') result.normalize = true
      else if (name.value === 'filter') {
        i = skipWs(src, i)
        const bal = extractBalanced(src, i, '(', ')')
        const group = parseFilterArgs(bal.inner)
        // Multiple @filter directives on one block are AND-merged.
        if (!result.filterGroup) {
          result.filterGroup = group
        } else if (group.filters.length) {
          result.filterGroup.op = 'AND'
          result.filterGroup.filters = result.filterGroup.filters.concat(
            group.filters,
          )
        }
        i = bal.end
      } else {
        // Unknown directive with optional (...): skip args.
        i = skipWs(src, i)
        if (src[i] === '(') i = extractBalanced(src, i, '(', ')').end
      }
      result.end = i
    }
    return result
  }

  /** Skip spaces and tabs only (not newlines). */
  function skipSpacesTabs(src, i) {
    while (i < src.length && (src[i] === ' ' || src[i] === '\t')) i += 1
    return i
  }

  /**
   * Parse a selection set into fields with attached comments.
   * Returns { fields, trailingComments } where trailingComments are after the last field.
   */
  function parseSelection(body) {
    const fields = []
    let i = 0
    const src = String(body || '')
    const trailingComments = []

    while (i < src.length) {
      const lead = skipTrivia(src, i)
      i = lead.end
      if (i >= src.length) {
        trailingComments.push(...lead.comments)
        break
      }

      let alias = null
      let pred = readPredicate(src, i)
      if (!pred) {
        if (lead.comments.length) trailingComments.push(...lead.comments)
        i += 1
        continue
      }

      const leading = lead.comments
      i = pred.end
      i = skipSpacesTabs(src, i)

      if (src[i] === ':') {
        alias = pred.value
        i += 1
        pred = readPredicate(src, i)
        if (!pred) throw new Error(`Expected predicate after alias '${alias}:'`)
        i = pred.end
        i = skipSpacesTabs(src, i)
      }

      const dirs = parseDirectivesAndFilter(src, i)
      i = dirs.end

      let children = null
      let trailing = null

      // Prefer a same-line `{` / trailing comment so next-line comments stay
      // attached to the following field (not this one).
      const j = skipSpacesTabs(src, i)
      if (src[j] === '{') {
        const bal = extractBalanced(src, j)
        children = parseSelection(bal.inner)
        i = bal.end
        const trail = readTrailingComment(src, i)
        trailing = trail.comment
        i = trail.end
      } else {
        const trail = readTrailingComment(src, i)
        trailing = trail.comment
        i = trail.end

        // `{` may start on a later line; comments before it lead the nested body.
        const beforeBrace = skipTrivia(src, i)
        if (src[beforeBrace.end] === '{') {
          const bal = extractBalanced(src, beforeBrace.end)
          children = parseSelection(bal.inner)
          if (beforeBrace.comments.length) {
            if (children.fields.length) {
              children.fields[0].comments.leading = beforeBrace.comments.concat(
                children.fields[0].comments.leading || [],
              )
            } else {
              children.trailingComments = beforeBrace.comments.concat(
                children.trailingComments || [],
              )
            }
          }
          i = bal.end
          const trail2 = readTrailingComment(src, i)
          if (trail2.comment) trailing = trailing || trail2.comment
          i = trail2.end
        }
        // else: leave `i` before those comments so the next field claims them
      }

      fields.push({
        alias: alias || null,
        name: pred.value,
        filterGroup: dirs.filterGroup,
        cascade: dirs.cascade,
        normalize: dirs.normalize,
        children,
        comments: {
          leading,
          trailing,
        },
      })
    }
    return { fields, trailingComments }
  }

  function parseRootBlock(body) {
    const lead = skipTrivia(body, 0)
    let i = lead.end
    const resultName = readIdent(body, i)
    if (!resultName) throw new Error("Expected result key after query '{'")
    i = resultName.end
    i = skipWs(body, i)
    if (body[i] !== '(')
      throw new Error('Expected (func: type(...)) on root block')

    const argsBal = extractBalanced(body, i, '(', ')')
    const args = argsBal.inner
    i = argsBal.end

    const typeMatch =
      args.match(/func\s*:\s*type\s*\(\s*"([^"]+)"\s*\)/i) ||
      args.match(/func\s*:\s*type\s*\(\s*'([^']+)'\s*\)/i) ||
      args.match(/func\s*:\s*type\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/i)
    if (!typeMatch)
      throw new Error('Expected func: type("TypeName") on root block')
    const typeName = typeMatch[1]

    const dirs = parseDirectivesAndFilter(body, i)
    i = dirs.end
    i = skipWs(body, i)
    if (body[i] !== '{') throw new Error("Expected selection '{' on root block")
    const sel = extractBalanced(body, i)

    return {
      resultName: resultName.value,
      typeName,
      cascade: dirs.cascade,
      normalize: dirs.normalize,
      filterGroup: dirs.filterGroup,
      rootLeadingComments: lead.comments,
      selection: parseSelection(sel.inner),
    }
  }

  function parse(text) {
    const src = String(text || '')
    const operations = []
    let i = 0

    while (i < src.length) {
      const trivia = skipTrivia(src, i)
      i = trivia.end
      if (i >= src.length) break

      const kw = readIdent(src, i)
      if (!kw || kw.value.toLowerCase() !== 'query') {
        throw new Error('Expected one or more `query Name { ... }` operations')
      }
      i = kw.end

      const name = readIdent(src, i)
      if (!name) throw new Error('Expected query operation name')
      i = name.end
      i = skipWs(src, i)

      let signature = ''
      if (src[i] === '(') {
        const sigBal = extractBalanced(src, i, '(', ')')
        signature = src.slice(i, sigBal.end)
        i = sigBal.end
      }

      const beforeBrace = skipTrivia(src, i)
      i = beforeBrace.end
      if (src[i] !== '{') {
        throw new Error(`Expected '{' after query ${name.value}`)
      }

      const bal = extractBalanced(src, i)
      const root = parseRootBlock(bal.inner)
      i = bal.end

      const after = readTrailingComment(src, i)
      i = after.end

      operations.push({
        opName: name.value,
        params: parseSignature(signature),
        leadingComments: trivia.comments.concat(beforeBrace.comments),
        trailingComment: after.comment,
        ...root,
      })
    }

    if (!operations.length) {
      throw new Error('Could not find a parseable query operation')
    }
    return operations
  }

  /** Guess a nested type name from an edge when the schema has no binding. */
  function guessNestedType(edgeName, parentType, schema) {
    let base = String(edgeName || '')
    if (base.includes('.')) base = base.split('.').pop()
    if (/ies$/i.test(base)) base = `${base.slice(0, -3)}y`
    else if (/ses$/i.test(base)) base = base.slice(0, -2)
    else if (/s$/i.test(base) && !/ss$/i.test(base)) base = base.slice(0, -1)
    base = base.charAt(0).toUpperCase() + base.slice(1)
    if (schema[base] && base !== parentType) return base
    if (base === parentType) return `${parentType}_${edgeName}`
    // Prefer an unused name; if taken by something unrelated, rename.
    if (!schema[base]) return base
    return `${parentType}_${edgeName}`
  }

  /**
   * Resolve a field on a type. Prefer exact predicate names (including dots
   * like "User.name"). Short DQL names uniquely match a namespaced schema
   * field ("name" → "User.name") so we keep the schema's real predicate.
   */
  function findField(typeDef, predName) {
    if (!typeDef) return null
    const fields = typeDef.fields || []
    const exact = fields.find((f) => f.name === predName)
    if (exact) return exact

    // "name" → unique "User.name" (do not invent short aliases for dotted preds).
    if (predName && !String(predName).includes('.')) {
      const matches = fields.filter((f) => f.name.endsWith(`.${predName}`))
      if (matches.length === 1) return matches[0]
    }
    return null
  }

  /**
   * Split a dotted path into edge parts + leaf, matching longest schema field
   * names at each step so "User.posts.Post.title" stays intact.
   */
  function splitPredicatePath(schema, typeName, pathStr) {
    const raw = String(pathStr || '')
    if (!raw) return null

    const fieldsAt = (t) => schema[t]?.fields || []
    if (fieldsAt(typeName).some((f) => f.name === raw)) {
      return { edgeParts: [], leaf: raw, edgePath: '' }
    }

    const segments = raw.split('.')
    const edgeParts = []
    let currentType = typeName
    let i = 0

    while (i < segments.length) {
      const fields = fieldsAt(currentType)
      let matched = null
      let matchedEnd = -1
      for (let j = segments.length; j > i; j -= 1) {
        const candidate = segments.slice(i, j).join('.')
        const field = fields.find((f) => f.name === candidate)
        if (field) {
          matched = field
          matchedEnd = j
          break
        }
      }

      if (!matched) {
        const rest = segments.slice(i).join('.')
        const short = findField({ fields }, rest)
        return {
          edgeParts,
          leaf: short?.name || rest,
          edgePath: edgeParts.join('.'),
        }
      }

      const start = i
      i = matchedEnd

      if (i >= segments.length) {
        return { edgeParts, leaf: matched.name, edgePath: edgeParts.join('.') }
      }

      if (matched.kind === 'object' && matched.ofType) {
        edgeParts.push(matched.name)
        currentType = matched.ofType
        continue
      }

      return {
        edgeParts,
        leaf: segments.slice(start).join('.'),
        edgePath: edgeParts.join('.'),
      }
    }

    return null
  }

  /**
   * Ensure schema contains every type/field referenced by the parsed ops.
   * Mutates a shallow copy of schema; returns { schema, warnings }.
   */
  function ensureSchema(schema, operations) {
    const next = { ...schema }
    Object.keys(schema).forEach((k) => {
      next[k] = { ...schema[k], fields: [...(schema[k].fields || [])] }
    })
    const warnings = []
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
    ]

    function ensureType(name) {
      if (!next[name]) {
        next[name] = {
          color: COLORS[Object.keys(next).length % COLORS.length],
          fields: [{ name: 'uid', type: 'uid', kind: 'scalar' }],
        }
        warnings.push(`Inferred type "${name}" (not in schema)`)
      }
      return next[name]
    }

    function ensureField(typeName, fieldAst, pathPrefix) {
      const def = ensureType(typeName)
      const predName = fieldAst.name
      let field = findField(def, predName)
      const storedName = field ? field.name : predName

      if (fieldAst.children) {
        let ofType = field?.ofType
        if (!ofType) {
          ofType = guessNestedType(
            predName.includes('.') ? predName.split('.').pop() : predName,
            typeName,
            next,
          )
        }
        ensureType(ofType)
        if (!field) {
          def.fields.push({
            name: storedName,
            type: '[uid]',
            kind: 'object',
            ofType,
          })
          field = def.fields[def.fields.length - 1]
        } else if (field.kind !== 'object') {
          field.kind = 'object'
          field.type = '[uid]'
          field.ofType = ofType
        } else if (!field.ofType) {
          field.ofType = ofType
        }
        ofType = field.ofType
        const childPrefix = pathPrefix
          ? `${pathPrefix}.${storedName}`
          : storedName
        const childFields = Array.isArray(fieldAst.children)
          ? fieldAst.children
          : fieldAst.children?.fields || []
        childFields.forEach((child) => ensureField(ofType, child, childPrefix))
      } else if (!field) {
        def.fields.push({
          name: storedName,
          type: 'string',
          kind: 'scalar',
        })
      }

      // Rewrite AST name to the schema field name for later selection mapping.
      fieldAst.schemaName = storedName
    }

    operations.forEach((op) => {
      ensureType(op.typeName)
      const rootFields = Array.isArray(op.selection)
        ? op.selection
        : op.selection?.fields || []
      rootFields.forEach((f) => ensureField(op.typeName, f, ''))

      // Filter groups (AND/OR) are preserved on the canvas; nothing to warn about.
    })

    return { schema: next, warnings }
  }

  /**
   * Convert parsed operations + schema into canvas node objects
   * (without ids / positions — caller assigns those).
   */
  function toNodes(operations, schema) {
    function resolveFieldType(rootType, predicatePath) {
      const walk = splitPredicatePath(schema, rootType, predicatePath)
      if (!walk) return null
      let typeName = rootType
      for (const edge of walk.edgeParts) {
        const field = findField(schema[typeName], edge)
        if (!field?.ofType) return null
        typeName = field.ofType
      }
      const field = findField(schema[typeName], walk.leaf)
      if (!field) return null
      return PARAM_TYPES.includes(field.type) ? field.type : null
    }

    return operations.map((op) => {
      const aliases = {}
      const params = []
      const paramByName = new Map()
      const rootFilter = { op: 'AND', conditions: [] }
      const edgeFilters = {}
      ;(op.params || []).forEach((p) => {
        const entry = {
          name: p.name,
          type: PARAM_TYPES.includes(p.type) ? p.type : 'string',
          value: p.value ?? '',
          mode: p.mode === 'default' ? 'default' : 'var',
        }
        params.push(entry)
        paramByName.set(p.name, entry)
      })

      function ensureParam(name, type, value) {
        let entry = paramByName.get(name)
        if (!entry) {
          entry = {
            name,
            type: PARAM_TYPES.includes(type) ? type : 'string',
            value: value ?? '',
            mode: 'var',
          }
          params.push(entry)
          paramByName.set(name, entry)
        } else if (entry.type === 'string' && type && type !== 'string') {
          entry.type = type
        }
        return entry
      }

      function resolveEdgeType(edgePath) {
        let typeName = op.typeName
        if (!edgePath) return typeName
        const edgeWalk = splitPredicatePath(schema, op.typeName, edgePath)
        if (!edgeWalk) return typeName
        for (const edge of edgeWalk.edgeParts) {
          const f = findField(schema[typeName], edge)
          if (!f?.ofType) break
          typeName = f.ofType
        }
        const edgeField = findField(schema[typeName], edgeWalk.leaf)
        if (edgeField?.ofType) typeName = edgeField.ofType
        return typeName
      }

      function ingestFilterGroup(edgePath, group) {
        if (!group?.filters?.length) return
        const typeName = resolveEdgeType(edgePath)
        const target = edgePath
          ? edgeFilters[edgePath] ||
            (edgeFilters[edgePath] = { op: group.op || 'AND', conditions: [] })
          : rootFilter
        if (edgePath) target.op = group.op || target.op || 'AND'
        else rootFilter.op = group.op || rootFilter.op || 'AND'

        group.filters.forEach((filter) => {
          const leafField = findField(schema[typeName], filter.predicate)
          const leaf = leafField?.name || filter.predicate
          const schemaType = resolveFieldType(
            op.typeName,
            edgePath ? `${edgePath}.${leaf}` : leaf,
          )
          const literalType =
            filter.literal != null
              ? inferTypeFromLiteral(filter.valueRaw || filter.literal)
              : null
          const inferredType = schemaType || literalType || 'string'

          const cond = {
            func: filter.func,
            predicate: leaf,
            valueMode: 'literal',
            literal: '',
            paramName: '',
          }

          if (filter.unary) {
            cond.valueMode = 'literal'
            cond.literal = ''
          } else if (filter.isVar && filter.varName) {
            ensureParam(filter.varName, inferredType, '')
            cond.valueMode = 'param'
            cond.paramName = filter.varName
          } else {
            cond.valueMode = 'literal'
            cond.literal = filter.literal ?? ''
          }

          target.conditions.push(cond)
        })
      }

      ingestFilterGroup('', op.filterGroup)

      function selectionFields(sel) {
        if (!sel) return []
        if (Array.isArray(sel)) return sel
        return sel.fields || []
      }

      function selectionTrailing(sel) {
        if (!sel || Array.isArray(sel)) return []
        return sel.trailingComments || []
      }

      function buildSelection(typeName, sel, pathPrefix) {
        const selection = {}
        const fieldComments = {}
        const blockComments = {}

        selectionFields(sel).forEach((f) => {
          const name =
            f.schemaName || findField(schema[typeName], f.name)?.name || f.name
          const path = pathPrefix ? `${pathPrefix}.${name}` : name
          if (f.alias) aliases[path] = f.alias
          if (f.filterGroup) ingestFilterGroup(path, f.filterGroup)

          const leading = f.comments?.leading || []
          const trailing = f.comments?.trailing || null
          if (leading.length || trailing) {
            fieldComments[path] = {
              leading: [...leading],
              trailing,
            }
          }

          if (f.children) {
            const field = findField(schema[typeName], name)
            const ofType =
              field?.ofType || guessNestedType(name, typeName, schema)
            const nested = buildSelection(ofType, f.children, path)
            selection[name] = nested.selection
            Object.assign(fieldComments, nested.fieldComments)
            Object.assign(blockComments, nested.blockComments)
          } else {
            selection[name] = null
          }
        })

        const trailing = selectionTrailing(sel)
        if (trailing.length) {
          blockComments[pathPrefix || ''] = [...trailing]
        }

        return { selection, fieldComments, blockComments }
      }

      const built = buildSelection(op.typeName, op.selection, '')

      // Result key only stored when it differs from the default derived from op name.
      let resultName = op.resultName || ''
      const derived = /^get./i.test(op.opName) ? op.opName.slice(3) : op.opName
      if (resultName === derived || resultName === op.typeName) {
        if (resultName === derived) resultName = ''
      }

      return {
        type: op.typeName,
        name: op.opName,
        resultName,
        selection: built.selection,
        aliases,
        params,
        rootFilter,
        edgeFilters,
        directives: {
          cascade: !!op.cascade,
          normalize: !!op.normalize,
        },
        comments: {
          leading: [...(op.leadingComments || [])],
          trailing: op.trailingComment || null,
          rootLeading: [...(op.rootLeadingComments || [])],
          fields: built.fieldComments,
          blocks: built.blockComments,
        },
      }
    })
  }

  return { parse, ensureSchema, toNodes }
})()
