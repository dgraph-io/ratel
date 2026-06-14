/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MAX_NODE_SIZE,
  MIN_NODE_SIZE,
  loadStyleRules,
  sanitizeRule,
  sanitizeRules,
  saveStyleRules,
  updateRule,
} from './graphStyles'

const memoryStorage = () => {
  const data = {}
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => (data[k] = String(v)),
  }
}

describe('sanitizeRule', () => {
  it('accepts valid color and size', () => {
    expect(sanitizeRule({ color: '#A1B2C3', size: 10 })).toEqual({
      color: '#a1b2c3',
      size: 10,
    })
  })

  it('rejects malformed colors', () => {
    expect(sanitizeRule({ color: 'red' })).toBe(null)
    expect(sanitizeRule({ color: '#fff' })).toBe(null)
    expect(sanitizeRule({ color: 'javascript:x' })).toBe(null)
  })

  it('clamps size to bounds', () => {
    expect(sanitizeRule({ size: 1 }).size).toBe(MIN_NODE_SIZE)
    expect(sanitizeRule({ size: 999 }).size).toBe(MAX_NODE_SIZE)
  })

  it('returns null for empty/invalid input', () => {
    expect(sanitizeRule(null)).toBe(null)
    expect(sanitizeRule({})).toBe(null)
    expect(sanitizeRule({ size: 'abc' })).toBe(null)
  })
})

describe('sanitizeRules', () => {
  it('drops invalid groups and keeps valid ones', () => {
    expect(
      sanitizeRules({
        friend: { color: '#112233' },
        bad: { color: 'nope' },
      }),
    ).toEqual({ friend: { color: '#112233' } })
  })

  it('handles garbage input', () => {
    expect(sanitizeRules(null)).toEqual({})
    expect(sanitizeRules('x')).toEqual({})
  })
})

describe('load/save round trip', () => {
  it('persists and restores rules', () => {
    const storage = memoryStorage()
    saveStyleRules({ friend: { color: '#112233', size: 8 } }, storage)
    expect(loadStyleRules(storage)).toEqual({
      friend: { color: '#112233', size: 8 },
    })
  })

  it('returns empty object for corrupt storage', () => {
    const storage = memoryStorage()
    storage.setItem('ratel-graph-style-rules', '{not json')
    expect(loadStyleRules(storage)).toEqual({})
  })
})

describe('updateRule', () => {
  it('merges changes per group', () => {
    let rules = updateRule({}, 'friend', { color: '#112233' })
    rules = updateRule(rules, 'friend', { size: 12 })
    expect(rules.friend).toEqual({ color: '#112233', size: 12 })
  })

  it('removes a group when the rule becomes empty', () => {
    const rules = updateRule({ friend: { color: '#112233' } }, 'friend', {
      color: 'invalid',
    })
    expect(rules).toEqual({})
  })

  it('does not mutate the input', () => {
    const input = { friend: { color: '#112233' } }
    updateRule(input, 'friend', { size: 9 })
    expect(input).toEqual({ friend: { color: '#112233' } })
  })
})
