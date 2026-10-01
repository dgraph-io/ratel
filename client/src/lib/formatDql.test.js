/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { formatDql } from './formatDql'

describe('formatDql', () => {
  it('expands a minified one-liner', () => {
    const input = '{q(func: has(name)){name age friend{name}}}'
    expect(formatDql(input)).toEqual(
      [
        '{',
        '  q(func: has(name)) {',
        '    name',
        '    age',
        '    friend {',
        '      name',
        '    }',
        '  }',
        '}',
      ].join('\n'),
    )
  })

  it('is idempotent: format(format(x)) === format(x)', () => {
    const inputs = [
      '{q(func: has(name)){name age}}',
      '{ me as var(func: eq(name, "x")) { uid } }',
      '# top\n{\n  q(func: has(name)) { # trailing\n    name@en\n  }\n}',
      '{ set { <_:a> <name> "x" . } }',
      'query test($a: string) { q(func: eq(name, $a)) { name } }',
    ]
    for (const input of inputs) {
      const once = formatDql(input)
      expect(formatDql(once)).toEqual(once)
    }
  })

  it('never alters content inside string literals (braces, #, parens)', () => {
    const input = '{q(func: eq(name, "a{b}#c(d) \\" e")){name}}'
    const output = formatDql(input)
    expect(output).toContain('"a{b}#c(d) \\" e"')
    expect(output).toEqual(
      [
        '{',
        '  q(func: eq(name, "a{b}#c(d) \\" e")) {',
        '    name',
        '  }',
        '}',
      ].join('\n'),
    )
  })

  it('preserves own-line and trailing comments', () => {
    const input =
      '# top comment\n{\nq(func: has(name)) { # after brace\nname # trailing\n# own line\nage\n}\n}'
    expect(formatDql(input)).toEqual(
      [
        '# top comment',
        '{',
        '  q(func: has(name)) { # after brace',
        '    name # trailing',
        '    # own line',
        '    age',
        '  }',
        '}',
      ].join('\n'),
    )
  })

  it('keeps @filter and pagination args attached to their field', () => {
    const input =
      '{ q(func: has(name)) { friend @filter(eq(name, "x")) (first: 10, orderasc: name) { name@en } } }'
    expect(formatDql(input)).toEqual(
      [
        '{',
        '  q(func: has(name)) {',
        '    friend @filter(eq(name, "x")) (first: 10, orderasc: name) {',
        '      name@en',
        '    }',
        '  }',
        '}',
      ].join('\n'),
    )
  })

  it('keeps function blocks with args on one line', () => {
    const input = '{q(func: has(name),\n   first: 10,\n   offset: 2){name}}'
    expect(formatDql(input)).toEqual(
      [
        '{',
        '  q(func: has(name), first: 10, offset: 2) {',
        '    name',
        '  }',
        '}',
      ].join('\n'),
    )
  })

  it('formats var blocks: me as var(func: ...)', () => {
    const input =
      '{ me as var(func: eq(name, "Alice")) { f as friend } q(func: uid(me)) { name score: val(f) } }'
    expect(formatDql(input)).toEqual(
      [
        '{',
        '  me as var(func: eq(name, "Alice")) {',
        '    f as friend',
        '  }',
        '  q(func: uid(me)) {',
        '    name',
        '    score: val(f)',
        '  }',
        '}',
      ].join('\n'),
    )
  })

  it('indents N-Quads in mutation set blocks without rewriting them', () => {
    const input =
      '{ set { <_:a> <name> "x" .\n  <_:a> <age> "21"^^<xs:int> . } }'
    expect(formatDql(input)).toEqual(
      [
        '{',
        '  set {',
        '    <_:a> <name> "x" .',
        '    <_:a> <age> "21"^^<xs:int> .',
        '  }',
        '}',
      ].join('\n'),
    )
  })

  it('indents N-Quads in delete blocks inside an upsert', () => {
    const input =
      'upsert { query { v as var(func: eq(name, "x")) } mutation { delete { uid(v) <name> * . } } }'
    expect(formatDql(input)).toEqual(
      [
        'upsert {',
        '  query {',
        '    v as var(func: eq(name, "x"))',
        '  }',
        '  mutation {',
        '    delete {',
        '      uid(v) <name> * .',
        '    }',
        '  }',
        '}',
      ].join('\n'),
    )
  })

  it('returns input unchanged when a string is unterminated', () => {
    const input = '{ q(func: eq(name, "oops) { name } }'
    expect(formatDql(input)).toBe(input)
  })

  it('returns empty string for empty and whitespace-only input', () => {
    expect(formatDql('')).toEqual('')
    expect(formatDql('   \n\t  \n')).toEqual('')
  })

  it('collapses runs of blank lines to at most one', () => {
    const input = '{\n  q(func: has(name)) {\n    name\n\n\n\n    age\n  }\n}'
    expect(formatDql(input)).toEqual(
      [
        '{',
        '  q(func: has(name)) {',
        '    name',
        '',
        '    age',
        '  }',
        '}',
      ].join('\n'),
    )
  })

  it('formats named query headers with variables on one line', () => {
    const input = 'query test($a: string, $b: int){q(func: eq(name, $a)){name}}'
    expect(formatDql(input)).toEqual(
      [
        'query test($a: string, $b: int) {',
        '  q(func: eq(name, $a)) {',
        '    name',
        '  }',
        '}',
      ].join('\n'),
    )
  })

  it('puts one field per line and trims trailing whitespace', () => {
    const input = '{ q(func: has(name)) { name age   \nfriend { name }  } }'
    const output = formatDql(input)
    expect(output).toEqual(
      [
        '{',
        '  q(func: has(name)) {',
        '    name',
        '    age',
        '    friend {',
        '      name',
        '    }',
        '  }',
        '}',
      ].join('\n'),
    )
    for (const line of output.split('\n')) {
      expect(line).toEqual(line.replace(/\s+$/, ''))
    }
  })

  // Angle-bracket identifiers. The ':' of a scheme and the '#' of a fragment
  // are structural characters everywhere else in the language, so an IRI has
  // to be one token or the predicate comes out rewritten.
  describe('angle-bracket identifiers', () => {
    it('keeps an IRI with a scheme and a fragment intact in a query', () => {
      const input = '{ q(func: has(<https://myschema.org#name>)) { uid } }'
      expect(formatDql(input)).toEqual(
        [
          '{',
          '  q(func: has(<https://myschema.org#name>)) {',
          '    uid',
          '  }',
          '}',
        ].join('\n'),
      )
    })

    it('keeps an IRI intact in a mutation', () => {
      const input = '{ set { _:a <https://myschema.org#name> "A" . } }'
      expect(formatDql(input)).toEqual(
        [
          '{',
          '  set {',
          '    _:a <https://myschema.org#name> "A" .',
          '  }',
          '}',
        ].join('\n'),
      )
    })

    it('keeps a plain angle-bracket predicate intact', () => {
      expect(formatDql('{ q(func: has(<name>)) { <name> } }')).toEqual(
        ['{', '  q(func: has(<name>)) {', '    <name>', '  }', '}'].join('\n'),
      )
    })

    it('leaves a half-typed IRI alone rather than swallowing the rest', () => {
      const input = '{ q(func: has(<https://x.org'
      expect(formatDql(input).replace(/\s+/g, '')).toEqual(
        input.replace(/\s+/g, ''),
      )
    })
  })

  // Regex literals. A quantifier's braces must not be read as block
  // punctuation: unlike the IRI case this fails silently, returning no matches
  // rather than an error, so it is the more dangerous of the two.
  describe('regular expression literals', () => {
    const unchanged = (regex) => {
      const input = `{ q(func: regexp(name, ${regex})) { uid } }`
      expect(formatDql(input)).toEqual(
        [
          '{',
          `  q(func: regexp(name, ${regex})) {`,
          '    uid',
          '  }',
          '}',
        ].join('\n'),
      )
    }

    it('keeps a bounded quantifier intact', () => unchanged('/^a{2,3}$/'))
    it('keeps an exact quantifier intact', () => unchanged('/Alic{1}e/'))
    it('keeps a character class intact', () => unchanged('/^[A-Z]+/'))
    it('keeps a class with a quantifier intact', () => unchanged('/^[A-Z]{2}/'))
    it('keeps trailing flags intact', () => unchanged('/^[A-Z]{2}/i'))
    it('keeps an escaped slash intact', () => unchanged('/a\\/b/'))
    it('keeps a simple regex intact', () => unchanged('/^Al/'))

    it('does not mistake division for a regex', () => {
      const input = '{ q(func: has(name)) { a: math(1/2) b: math(3/4) } }'
      expect(formatDql(input).replace(/\s+/g, '')).toEqual(
        input.replace(/\s+/g, ''),
      )
    })

    it('leaves a half-typed regex alone', () => {
      const input = '{ q(func: regexp(name, /^a'
      expect(formatDql(input).replace(/\s+/g, '')).toEqual(
        input.replace(/\s+/g, ''),
      )
    })
  })

  // A '/' and a '<' both mean different things depending on what precedes
  // them, so the scans for a regex literal and an IRI have to look back.
  //
  // These compare the output flattened to single spaces rather than with all
  // whitespace stripped. Stripping was how the first version of these tests
  // missed the bug: the corruption *is* inserted whitespace, so removing it
  // deleted the evidence and the assertion passed on a mangled query.
  describe('operators that look like literals', () => {
    const unchanged = (input) => {
      const flat = formatDql(input)
        .replace(/\n\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      expect(flat).toEqual(input.replace(/\s+/g, ' ').trim())
    }

    it('does not start a regex at a spaced division', () =>
      unchanged('{ q(func: has(name)) { a: math(1 / 2) b: math(3 / 4) } }'))

    // The division's '/' used to begin a scan that ran to the slash opening
    // the real regex, consuming it, after which /^a{2}/ was tokenized as code
    // and came out as "/ ^a { 2 } /".
    it('does not let a spaced division consume a later regex', () =>
      unchanged(
        '{ q(func: uid(1)) { x as age y: math(x / 2) } r(func: regexp(name, /^a{2}/)) { uid } }',
      ))

    it('still formats a regex that follows a comma', () =>
      unchanged('{ q(func: regexp(name, /^a{2,3}$/)) { uid } }'))

    it('does not start an IRI at a less-than', () =>
      unchanged('{ q(func: has(n)) { a: math(x < 2) b: math(y > 3) } }'))

    // A '<' scan would otherwise run to the next '>', which can sit inside a
    // string literal; a token ending mid-string shifts every quote after it.
    it('does not let a less-than reach a > inside a string', () =>
      unchanged(
        '{ a(func: has(n)) { v: math(x < 2) } b(func: eq(n, "p > q")) { n } }',
      ))

    it('still treats a real IRI as one token', () =>
      unchanged('{ q(func: has(<https://myschema.org#name>)) { uid } }'))
  })
})
