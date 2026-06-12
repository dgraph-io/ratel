/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * A conservative whitespace-normalizing pretty-printer for Dgraph DQL
 * (GraphQL+- syntax).
 *
 * It only normalizes whitespace and indentation -- it never reorders or
 * rewrites tokens, never touches string literal contents, and preserves
 * comments (either on their own line or trailing the line they follow).
 * If the input cannot be tokenized (e.g. an unterminated string literal)
 * the input is returned unchanged.
 */

const PUNCT = '{}():,'

function isWhitespace(c) {
  return c === ' ' || c === '\t' || c === '\r'
}

function isWordChar(c) {
  return (
    !isWhitespace(c) &&
    c !== '\n' &&
    c !== '#' &&
    c !== '"' &&
    PUNCT.indexOf(c) === -1
  )
}

// Tokenizes input into words, punctuation, strings, comments and newlines.
// Returns null if the input cannot be tokenized (unterminated string).
function tokenize(input) {
  const tokens = []
  const n = input.length
  let i = 0
  while (i < n) {
    const c = input[i]
    if (c === '\n') {
      tokens.push({ type: 'newline', start: i, end: i + 1 })
      i++
      continue
    }
    if (isWhitespace(c)) {
      i++
      continue
    }
    if (c === '#') {
      let j = i
      while (j < n && input[j] !== '\n') {
        j++
      }
      tokens.push({
        type: 'comment',
        value: input.slice(i, j).replace(/\s+$/, ''),
        start: i,
        end: j,
      })
      i = j
      continue
    }
    if (c === '"') {
      let j = i + 1
      let closed = false
      while (j < n) {
        if (input[j] === '\\') {
          j += 2
          continue
        }
        if (input[j] === '"') {
          closed = true
          j++
          break
        }
        j++
      }
      if (!closed) {
        return null
      }
      tokens.push({
        type: 'string',
        value: input.slice(i, j),
        start: i,
        end: j,
      })
      i = j
      continue
    }
    if (PUNCT.indexOf(c) !== -1) {
      tokens.push({ type: 'punct', value: c, start: i, end: i + 1 })
      i++
      continue
    }
    // Word token. A ':' is kept inside the word for language tags such as
    // name@en:fr (only once the word already contains an '@').
    let j = i
    let hasAt = false
    while (j < n) {
      const d = input[j]
      if (d === '@') {
        hasAt = true
      } else if (d === ':' && hasAt) {
        // keep going -- language tag list
      } else if (!isWordChar(d)) {
        break
      }
      j++
    }
    tokens.push({ type: 'word', value: input.slice(i, j), start: i, end: j })
    i = j
  }
  return tokens
}

// Finds the token index of the '}' matching the '{' at openIdx, or -1.
function findMatchingBrace(tokens, openIdx) {
  let depth = 0
  for (let i = openIdx; i < tokens.length; i++) {
    const t = tokens[i]
    if (t.type !== 'punct') {
      continue
    }
    if (t.value === '{') {
      depth++
    } else if (t.value === '}') {
      depth--
      if (depth === 0) {
        return i
      }
    }
  }
  return -1
}

function isWordCharEnd(c) {
  return c !== undefined && c !== ')' && c !== ',' && c !== ':' && c !== '('
}

export function formatDql(query) {
  if (typeof query !== 'string') {
    return query
  }
  if (query.trim() === '') {
    return ''
  }
  const tokens = tokenize(query)
  if (tokens === null) {
    return query
  }

  const lines = []
  let cur = ''
  let depth = 0
  let parenDepth = 0
  let pendingBlank = false
  let sinceNewline = 0 // non-newline tokens since the last source newline
  let consecNewlines = 0
  let contIndent = 0 // extra indent for paren continuation lines
  let lastVal = null // value of previous word/punct/string token

  const indentStr = (extra) => '  '.repeat(Math.max(0, depth + extra))

  const pushLine = (text, extra = 0) => {
    if (pendingBlank && lines.length > 0) {
      lines.push('')
    }
    pendingBlank = false
    lines.push(indentStr(extra) + text)
  }

  const flush = () => {
    if (cur !== '') {
      pushLine(cur, contIndent)
      cur = ''
    }
    contIndent = 0
  }

  // Appends a token's text to the current line with normalized spacing.
  const appendInline = (val) => {
    if (cur === '') {
      cur = val
      return
    }
    const last = cur[cur.length - 1]
    if (val === ')' || val === ',' || val === ':') {
      cur += val
    } else if (val === '(') {
      // q(func: ...) / @filter(...) attach directly to the word before
      // them; a group after ')' or ',' gets a separating space.
      cur += isWordCharEnd(last) && last !== '(' ? val : ' ' + val
    } else {
      cur += last === '(' ? val : ' ' + val
    }
  }

  // Decides whether a word continues the current line (at paren depth 0).
  const continuesLine = (val) => {
    if (cur === '') {
      return true
    }
    if (val[0] === '@') {
      // directives stay attached to their field: friend @filter(...)
      return true
    }
    if (val === 'as' || lastVal === 'as') {
      // var blocks: me as var(func: ...)
      return true
    }
    if (lastVal === ':') {
      // aliases: total: count(uid)
      return true
    }
    if (
      depth === 0 &&
      (lastVal === 'query' || lastVal === 'mutation' || lastVal === 'fragment')
    ) {
      // named operation headers: query test($a: string)
      return true
    }
    return false
  }

  // Emits the raw contents of a mutation RDF block (set { ... } or
  // delete { ... }): lines are re-indented but otherwise left untouched.
  const emitRawBlock = (raw) => {
    const rawLines = raw.split('\n')
    let blankRun = 0
    let emittedAny = false
    for (const rawLine of rawLines) {
      const trimmed = rawLine.trim()
      if (trimmed === '') {
        blankRun++
        continue
      }
      if (emittedAny && blankRun > 0) {
        lines.push('')
      }
      blankRun = 0
      emittedAny = true
      lines.push(indentStr(0) + trimmed)
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    if (token.type === 'newline') {
      consecNewlines++
      sinceNewline = 0
      if (parenDepth === 0 && consecNewlines >= 2) {
        flush()
        pendingBlank = true
      }
      continue
    }
    consecNewlines = 0
    sinceNewline++

    if (token.type === 'comment') {
      if (cur !== '') {
        // trailing comment on the line being built
        cur += ' ' + token.value
        flush()
        if (parenDepth > 0) {
          contIndent = 1
        }
      } else if (sinceNewline > 1 && lines.length > 0) {
        // trailing comment after something already flushed, e.g. "{ # c"
        lines[lines.length - 1] += ' ' + token.value
      } else {
        pushLine(token.value)
      }
      continue
    }

    if (token.type === 'punct') {
      const val = token.value
      if (val === '(') {
        appendInline(val)
        parenDepth++
      } else if (val === ')') {
        appendInline(val)
        parenDepth = Math.max(0, parenDepth - 1)
      } else if (val === '{') {
        if (parenDepth > 0) {
          appendInline(val)
        } else {
          cur = cur === '' ? '{' : cur + ' {'
          flush()
          depth++
        }
      } else if (val === '}') {
        if (parenDepth > 0) {
          appendInline(val)
        } else {
          flush()
          depth = Math.max(0, depth - 1)
          pushLine('}')
        }
      } else {
        // ':' or ','
        appendInline(val)
      }
      lastVal = val
      continue
    }

    // word or string
    const val = token.value
    if (
      parenDepth === 0 &&
      token.type === 'word' &&
      (val === 'set' || val === 'delete')
    ) {
      // Possible mutation RDF block: set { ... } / delete { ... }
      let j = i + 1
      while (j < tokens.length && tokens[j].type === 'newline') {
        j++
      }
      if (
        j < tokens.length &&
        tokens[j].type === 'punct' &&
        tokens[j].value === '{'
      ) {
        const closeIdx = findMatchingBrace(tokens, j)
        if (closeIdx !== -1) {
          if (!continuesLine(val)) {
            flush()
          }
          appendInline(val)
          cur += ' {'
          flush()
          depth++
          emitRawBlock(query.slice(tokens[j].end, tokens[closeIdx].start))
          depth = Math.max(0, depth - 1)
          pushLine('}')
          lastVal = '}'
          i = closeIdx
          continue
        }
      }
    }

    if (parenDepth === 0 && !continuesLine(val)) {
      flush()
    }
    appendInline(val)
    lastVal = val
  }

  flush()
  return lines.join('\n')
}

export default formatDql
