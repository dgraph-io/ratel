/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildDeleteMutation,
  buildSetMutation,
  coerceValue,
  escapeRdfString,
  isSafePredicate,
  valueToRdfLiteral,
} from './mutations'

describe('escapeRdfString', () => {
  it('escapes quotes, backslashes and control characters', () => {
    expect(escapeRdfString('say "hi"\\n')).toBe('say \\"hi\\"\\\\n')
    expect(escapeRdfString('line1\nline2\ttab')).toBe('line1\\nline2\\ttab')
  })
})

describe('isSafePredicate', () => {
  it('accepts normal predicates', () => {
    expect(isSafePredicate('name')).toBe(true)
    expect(isSafePredicate('person.name')).toBe(true)
    expect(isSafePredicate('my_pred-2')).toBe(true)
  })

  it('rejects injection attempts and whitespace', () => {
    expect(isSafePredicate('a> <0x1> <b')).toBe(false)
    expect(isSafePredicate('has space')).toBe(false)
    expect(isSafePredicate('')).toBe(false)
    expect(isSafePredicate(null)).toBe(false)
  })
})

describe('valueToRdfLiteral', () => {
  it('types booleans, ints and floats', () => {
    expect(valueToRdfLiteral(true)).toBe('"true"^^<xs:boolean>')
    expect(valueToRdfLiteral(5)).toBe('"5"^^<xs:int>')
    expect(valueToRdfLiteral(2.5)).toBe('"2.5"^^<xs:float>')
  })

  it('escapes strings', () => {
    expect(valueToRdfLiteral('a "b"')).toBe('"a \\"b\\""')
  })
})

describe('buildSetMutation', () => {
  it('builds a single-triple set', () => {
    const m = buildSetMutation('0x12af', 'name', 'Alice')
    expect(m).toContain('set {')
    expect(m).toContain('<0x12af> <name> "Alice" .')
  })

  it('rejects bad uids and predicates', () => {
    expect(() => buildSetMutation('not-a-uid', 'name', 'x')).toThrow(
      'Invalid uid',
    )
    expect(() => buildSetMutation('0x1', 'a> <b', 'x')).toThrow(
      'Invalid predicate',
    )
  })
})

describe('buildDeleteMutation', () => {
  it('deletes a specific value', () => {
    expect(buildDeleteMutation('0x1', 'name', 'Alice')).toContain(
      '<0x1> <name> "Alice" .',
    )
  })

  it('deletes all values with *', () => {
    expect(buildDeleteMutation('0x1', 'name')).toContain('<0x1> <name> * .')
  })
})

describe('coerceValue', () => {
  it('keeps the original type', () => {
    expect(coerceValue('42', 7)).toBe(42)
    expect(coerceValue('2.5', 1.0)).toBe(2.5)
    expect(coerceValue('true', false)).toBe(true)
    expect(coerceValue('false', true)).toBe(false)
    expect(coerceValue('hello', 'old')).toBe('hello')
  })

  it('throws on non-numeric input for numeric fields', () => {
    expect(() => coerceValue('abc', 5)).toThrow('not a number')
  })
})
