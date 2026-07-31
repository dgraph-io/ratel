/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { downloadCSV, flattenRows, toCSV } from './csvExport'

describe('flattenRows', () => {
  it('flattens simple flat rows from a single block', () => {
    const data = {
      q: [
        { uid: '0x1', name: 'Alice' },
        { uid: '0x2', name: 'Bob' },
      ],
    }
    expect(flattenRows(data)).toEqual([
      { uid: '0x1', name: 'Alice' },
      { uid: '0x2', name: 'Bob' },
    ])
  })

  it('flattens nested objects with dot-notation keys', () => {
    const data = {
      q: [{ uid: '0x1', address: { city: 'Pune', geo: { lat: 18.5 } } }],
    }
    expect(flattenRows(data)).toEqual([
      { uid: '0x1', 'address.city': 'Pune', 'address.geo.lat': 18.5 },
    ])
  })

  it('joins arrays of scalars with "; "', () => {
    const data = {
      q: [{ uid: '0x1', tags: ['a', 'b', 'c'], scores: [1, 2] }],
    }
    expect(flattenRows(data)).toEqual([
      { uid: '0x1', tags: 'a; b; c', scores: '1; 2' },
    ])
  })

  it('JSON-stringifies arrays of objects without exploding rows', () => {
    const friends = [
      { uid: '0x2', name: 'Bob' },
      { uid: '0x3', name: 'Carol' },
    ]
    const data = { q: [{ uid: '0x1', name: 'Alice', friend: friends }] }
    expect(flattenRows(data)).toEqual([
      { uid: '0x1', name: 'Alice', friend: JSON.stringify(friends) },
    ])
  })

  it('adds a __block column when there is more than one top-level block', () => {
    const data = {
      people: [{ name: 'Alice' }],
      cities: [{ name: 'Pune' }],
    }
    expect(flattenRows(data)).toEqual([
      { __block: 'people', name: 'Alice' },
      { __block: 'cities', name: 'Pune' },
    ])
  })

  it('omits the __block column for a single block', () => {
    const data = { q: [{ name: 'Alice' }] }
    expect(flattenRows(data)[0].__block).toBeUndefined()
  })

  it('converts null and empty-array values to empty strings', () => {
    const data = { q: [{ name: null, tags: [] }] }
    expect(flattenRows(data)).toEqual([{ name: '', tags: '' }])
  })

  it('returns an empty array for empty or missing data', () => {
    expect(flattenRows(undefined)).toEqual([])
    expect(flattenRows(null)).toEqual([])
    expect(flattenRows({})).toEqual([])
    expect(flattenRows({ q: [] })).toEqual([])
  })
})

describe('toCSV', () => {
  it('uses the union of keys in first-seen order as the header', () => {
    const rows = [
      { a: 1, b: 2 },
      { b: 3, c: 4 },
    ]
    expect(toCSV(rows)).toBe('a,b,c\r\n1,2,\r\n,3,4')
  })

  it('quotes fields containing commas', () => {
    expect(toCSV([{ name: 'Doe, Jane' }])).toBe('name\r\n"Doe, Jane"')
  })

  it('quotes and doubles embedded quotes', () => {
    expect(toCSV([{ name: 'say "hi"' }])).toBe('name\r\n"say ""hi"""')
  })

  it('quotes fields containing newlines', () => {
    expect(toCSV([{ note: 'line1\nline2' }])).toBe('note\r\n"line1\nline2"')
  })

  it('quotes header names that need escaping', () => {
    expect(toCSV([{ 'a,b': 1 }])).toBe('"a,b"\r\n1')
  })

  it('returns an empty string for empty or missing rows', () => {
    expect(toCSV([])).toBe('')
    expect(toCSV(undefined)).toBe('')
  })
})

describe('downloadCSV', () => {
  let createObjectURL
  let revokeObjectURL

  beforeEach(() => {
    createObjectURL = jest.fn(() => 'blob:fake-url')
    revokeObjectURL = jest.fn()
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL
  })

  it('creates, clicks and cleans up a download link', () => {
    const click = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    downloadCSV({ q: [{ name: 'Alice' }] }, 'ratel-results-test.csv')

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url')
    expect(document.querySelector('a[download]')).toBeNull()

    click.mockRestore()
  })

  it('is a no-op for empty or missing data', () => {
    downloadCSV(undefined, 'x.csv')
    downloadCSV({}, 'x.csv')
    downloadCSV({ q: [] }, 'x.csv')
    expect(createObjectURL).not.toHaveBeenCalled()
  })
})
