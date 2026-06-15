/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EMPTY_FILTER,
  attrValues,
  collectAttributeKeys,
  filterActive,
  nodeMatchesFilter,
} from './graphFilter'

const node = (attrs) => ({ properties: { attrs, facets: {} } })
const spec = (overrides) => ({ ...EMPTY_FILTER, ...overrides })

describe('filterActive', () => {
  it('is false for the empty filter', () => {
    expect(filterActive(EMPTY_FILTER)).toBe(false)
    expect(filterActive(null)).toBe(false)
  })

  it('is true once a degree bound is set', () => {
    expect(filterActive(spec({ degreeMin: '2' }))).toBe(true)
    expect(filterActive(spec({ degreeMax: '5' }))).toBe(true)
  })

  it('requires a value for value-based operators', () => {
    expect(filterActive(spec({ attr: 'age', op: 'gt', value: '' }))).toBe(false)
    expect(filterActive(spec({ attr: 'age', op: 'gt', value: '3' }))).toBe(true)
  })

  it('is active for "exists" with no value', () => {
    expect(filterActive(spec({ attr: 'age', op: 'exists' }))).toBe(true)
  })
})

describe('attrValues', () => {
  it('wraps scalars and passes through arrays', () => {
    expect(attrValues(node({ a: 5 }), 'a')).toEqual([5])
    expect(attrValues(node({ a: [1, 2] }), 'a')).toEqual([1, 2])
  })

  it('returns empty for missing or null attributes', () => {
    expect(attrValues(node({ a: 1 }), 'b')).toEqual([])
    expect(attrValues(node({ a: null }), 'a')).toEqual([])
  })
})

describe('nodeMatchesFilter', () => {
  it('keeps everything when the filter is inactive', () => {
    expect(nodeMatchesFilter(node({ name: 'x' }), 0, EMPTY_FILTER)).toBe(true)
  })

  it('applies degree bounds', () => {
    const f = spec({ degreeMin: '2', degreeMax: '4' })
    expect(nodeMatchesFilter(node({}), 1, f)).toBe(false)
    expect(nodeMatchesFilter(node({}), 3, f)).toBe(true)
    expect(nodeMatchesFilter(node({}), 5, f)).toBe(false)
  })

  it('matches contains case-insensitively', () => {
    const f = spec({ attr: 'name', op: 'contains', value: 'ALI' })
    expect(nodeMatchesFilter(node({ name: 'Alice' }), 0, f)).toBe(true)
    expect(nodeMatchesFilter(node({ name: 'Bob' }), 0, f)).toBe(false)
  })

  it('supports eq and ne', () => {
    expect(
      nodeMatchesFilter(
        node({ k: 'v' }),
        0,
        spec({ attr: 'k', op: 'eq', value: 'v' }),
      ),
    ).toBe(true)
    expect(
      nodeMatchesFilter(
        node({ k: 'v' }),
        0,
        spec({ attr: 'k', op: 'ne', value: 'v' }),
      ),
    ).toBe(false)
  })

  it('supports numeric gt and lt', () => {
    expect(
      nodeMatchesFilter(
        node({ age: 30 }),
        0,
        spec({ attr: 'age', op: 'gt', value: '18' }),
      ),
    ).toBe(true)
    expect(
      nodeMatchesFilter(
        node({ age: 10 }),
        0,
        spec({ attr: 'age', op: 'gt', value: '18' }),
      ),
    ).toBe(false)
    expect(
      nodeMatchesFilter(
        node({ age: 10 }),
        0,
        spec({ attr: 'age', op: 'lt', value: '18' }),
      ),
    ).toBe(true)
  })

  it('supports exists', () => {
    const f = spec({ attr: 'email', op: 'exists' })
    expect(nodeMatchesFilter(node({ email: 'a@b.c' }), 0, f)).toBe(true)
    expect(nodeMatchesFilter(node({ name: 'x' }), 0, f)).toBe(false)
  })

  it('matches if any value in a list satisfies the predicate', () => {
    const f = spec({ attr: 'tags', op: 'eq', value: 'red' })
    expect(nodeMatchesFilter(node({ tags: ['blue', 'red'] }), 0, f)).toBe(true)
    expect(nodeMatchesFilter(node({ tags: ['blue', 'green'] }), 0, f)).toBe(
      false,
    )
  })

  it('combines degree and attribute constraints (AND)', () => {
    const f = spec({ degreeMin: '2', attr: 'name', op: 'contains', value: 'a' })
    expect(nodeMatchesFilter(node({ name: 'alice' }), 3, f)).toBe(true)
    expect(nodeMatchesFilter(node({ name: 'alice' }), 1, f)).toBe(false)
    expect(nodeMatchesFilter(node({ name: 'bob' }), 3, f)).toBe(false)
  })
})

describe('collectAttributeKeys', () => {
  it('returns sorted unique keys across nodes', () => {
    const nodes = new Map([
      ['1', node({ name: 'a', age: 1 })],
      ['2', node({ name: 'b', city: 'x' })],
    ])
    expect(collectAttributeKeys(nodes)).toEqual(['age', 'city', 'name'])
  })
})
