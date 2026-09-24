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
})
