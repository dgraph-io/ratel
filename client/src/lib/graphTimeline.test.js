/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { extractNodeTime, timelineRange } from './graphTimeline'

const node = (attrs) => ({ properties: { attrs, facets: {} } })

describe('extractNodeTime', () => {
  it('parses an ISO datetime attribute', () => {
    const t = extractNodeTime(node({ created: '2021-03-15T12:00:00Z' }))
    expect(t).toBe(Date.parse('2021-03-15T12:00:00Z'))
  })

  it('parses a bare ISO date', () => {
    expect(extractNodeTime(node({ born: '1990-01-01' }))).toBe(
      Date.parse('1990-01-01'),
    )
  })

  it('uses the earliest of several datetimes', () => {
    const t = extractNodeTime(
      node({ created: '2021-03-15', updated: '2019-01-01' }),
    )
    expect(t).toBe(Date.parse('2019-01-01'))
  })

  it('ignores non-datetime values', () => {
    expect(extractNodeTime(node({ name: 'Alice', age: 30 }))).toBeNull()
    expect(extractNodeTime(node({ code: '12345' }))).toBeNull()
    expect(extractNodeTime(node({}))).toBeNull()
    expect(extractNodeTime(null)).toBeNull()
  })

  it('reads datetimes out of list-valued attributes', () => {
    const t = extractNodeTime(node({ dates: ['2022-05-05', '2020-05-05'] }))
    expect(t).toBe(Date.parse('2020-05-05'))
  })
})

describe('timelineRange', () => {
  it('reports an unavailable range when fewer than two nodes are timed', () => {
    const nodes = new Map([
      ['1', node({ created: '2021-01-01' })],
      ['2', node({ name: 'x' })],
    ])
    expect(timelineRange(nodes)).toMatchObject({ count: 1, available: false })
  })

  it('reports min, max and count for a timed dataset', () => {
    const nodes = new Map([
      ['1', node({ created: '2021-01-01' })],
      ['2', node({ created: '2021-06-01' })],
      ['3', node({ created: '2021-03-01' })],
    ])
    const range = timelineRange(nodes)
    expect(range.count).toBe(3)
    expect(range.available).toBe(true)
    expect(range.min).toBe(Date.parse('2021-01-01'))
    expect(range.max).toBe(Date.parse('2021-06-01'))
  })

  it('is unavailable when all timestamps are identical', () => {
    const nodes = new Map([
      ['1', node({ created: '2021-01-01' })],
      ['2', node({ created: '2021-01-01' })],
    ])
    expect(timelineRange(nodes).available).toBe(false)
  })
})
