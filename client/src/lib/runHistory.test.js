/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { TAB_JSON, TAB_VISUAL } from 'actions/frames'

import {
  SNIPPET_MAX_LENGTH,
  filterFrames,
  formatLatencyMs,
  summarizeFrame,
} from './runHistory'

const FRAME_ID = 'frame-1'
const makeFrame = (overrides = {}) => ({
  id: FRAME_ID,
  action: 'query',
  query: '{ q(func: has(name)) { name } }',
  ...overrides,
})

describe('summarizeFrame', () => {
  describe('status', () => {
    it('is unknown when there are no results for the frame', () => {
      const { status } = summarizeFrame(makeFrame(), {})
      expect(status).toBe('unknown')
    })

    it('is unknown when frameResults is undefined', () => {
      const { status } = summarizeFrame(makeFrame(), undefined)
      expect(status).toBe('unknown')
    })

    it('is unknown when no tab has completed yet', () => {
      const frameResults = {
        [FRAME_ID]: {
          [TAB_JSON]: { canExecute: true },
          [TAB_VISUAL]: { canExecute: false, executionStart: 123 },
        },
      }
      expect(summarizeFrame(makeFrame(), frameResults).status).toBe('unknown')
    })

    it('is ok when the JSON tab completed without error', () => {
      const frameResults = {
        [FRAME_ID]: {
          [TAB_JSON]: { completed: true, response: { data: {} } },
        },
      }
      expect(summarizeFrame(makeFrame(), frameResults).status).toBe('ok')
    })

    it('is error when the JSON tab completed with an error', () => {
      const frameResults = {
        [FRAME_ID]: {
          [TAB_JSON]: { completed: true, error: new Error('boom') },
        },
      }
      expect(summarizeFrame(makeFrame(), frameResults).status).toBe('error')
    })

    it('falls back to another completed tab when JSON tab never ran', () => {
      const frameResults = {
        [FRAME_ID]: {
          [TAB_JSON]: { canExecute: true },
          [TAB_VISUAL]: { completed: true, response: { data: {} } },
        },
      }
      expect(summarizeFrame(makeFrame(), frameResults).status).toBe('ok')
    })

    it('reports an error from a fallback tab', () => {
      const frameResults = {
        [FRAME_ID]: {
          [TAB_JSON]: { canExecute: true },
          [TAB_VISUAL]: { completed: true, error: { message: 'bad' } },
        },
      }
      expect(summarizeFrame(makeFrame(), frameResults).status).toBe('error')
    })

    it('prefers the JSON tab result over other completed tabs', () => {
      const frameResults = {
        [FRAME_ID]: {
          [TAB_JSON]: { completed: true, error: { message: 'bad json' } },
          [TAB_VISUAL]: { completed: true, response: { data: {} } },
        },
      }
      expect(summarizeFrame(makeFrame(), frameResults).status).toBe('error')
    })

    it('ignores results belonging to other frames', () => {
      const frameResults = {
        'other-frame': {
          [TAB_JSON]: { completed: true, response: { data: {} } },
        },
      }
      expect(summarizeFrame(makeFrame(), frameResults).status).toBe('unknown')
    })
  })

  describe('latencyText', () => {
    it('formats server latency from the completed tab as milliseconds', () => {
      const frameResults = {
        [FRAME_ID]: {
          [TAB_JSON]: { completed: true, serverLatencyNs: 42e6 },
        },
      }
      expect(summarizeFrame(makeFrame(), frameResults).latencyText).toBe('42ms')
    })

    it('is empty when the frame never executed', () => {
      expect(summarizeFrame(makeFrame(), {}).latencyText).toBe('')
    })

    it('is empty when server latency is missing on a completed tab', () => {
      const frameResults = {
        [FRAME_ID]: { [TAB_JSON]: { completed: true } },
      }
      expect(summarizeFrame(makeFrame(), frameResults).latencyText).toBe('')
    })

    it('is empty when server latency is zero (unknown)', () => {
      const frameResults = {
        [FRAME_ID]: {
          [TAB_JSON]: { completed: true, serverLatencyNs: 0 },
        },
      }
      expect(summarizeFrame(makeFrame(), frameResults).latencyText).toBe('')
    })
  })

  describe('snippet', () => {
    it('returns short queries unchanged', () => {
      const frame = makeFrame({ query: '{ me { name } }' })
      expect(summarizeFrame(frame, {}).snippet).toBe('{ me { name } }')
    })

    it('collapses newlines and extra whitespace into single spaces', () => {
      const frame = makeFrame({ query: '{\n  me {\n    name\t }\n}' })
      expect(summarizeFrame(frame, {}).snippet).toBe('{ me { name } }')
    })

    it('trims leading and trailing whitespace', () => {
      const frame = makeFrame({ query: '   { me { name } }  \n' })
      expect(summarizeFrame(frame, {}).snippet).toBe('{ me { name } }')
    })

    it('truncates long queries to the limit with an ellipsis', () => {
      const frame = makeFrame({ query: 'x'.repeat(200) })
      const { snippet } = summarizeFrame(frame, {})
      expect(snippet).toBe(`${'x'.repeat(SNIPPET_MAX_LENGTH)}…`)
      expect(snippet.length).toBe(SNIPPET_MAX_LENGTH + 1)
    })

    it('does not truncate a query exactly at the limit', () => {
      const frame = makeFrame({ query: 'y'.repeat(SNIPPET_MAX_LENGTH) })
      expect(summarizeFrame(frame, {}).snippet).toBe(
        'y'.repeat(SNIPPET_MAX_LENGTH),
      )
    })

    it('handles frames without a query', () => {
      const frame = makeFrame({ query: undefined })
      expect(summarizeFrame(frame, {}).snippet).toBe('')
    })
  })
})

describe('formatLatencyMs', () => {
  it('formats sub-millisecond latencies with two decimals', () => {
    expect(formatLatencyMs(450000)).toBe('0.45ms')
  })

  it('formats single-digit milliseconds with one decimal', () => {
    expect(formatLatencyMs(1234567)).toBe('1.2ms')
  })

  it('rounds latencies of 10ms and above to whole milliseconds', () => {
    expect(formatLatencyMs(15.6e6)).toBe('16ms')
    expect(formatLatencyMs(1234e6)).toBe('1234ms')
  })

  it('returns empty string for missing or invalid values', () => {
    expect(formatLatencyMs(undefined)).toBe('')
    expect(formatLatencyMs(null)).toBe('')
    expect(formatLatencyMs(0)).toBe('')
    expect(formatLatencyMs(-5)).toBe('')
    expect(formatLatencyMs(NaN)).toBe('')
    expect(formatLatencyMs('100')).toBe('')
  })
})

describe('filterFrames', () => {
  const items = [
    makeFrame({ id: 'a', query: '{ people(func: has(Name)) { name } }' }),
    makeFrame({ id: 'b', query: 'schema {}' }),
    makeFrame({
      id: 'c',
      action: 'mutate',
      query: '{ set { _:x <name> "Alice" . } }',
    }),
  ]

  it('returns all items for an empty search', () => {
    expect(filterFrames(items, '')).toEqual(items)
  })

  it('returns all items for a whitespace-only search', () => {
    expect(filterFrames(items, '   ')).toEqual(items)
  })

  it('returns all items when search is undefined', () => {
    expect(filterFrames(items, undefined)).toEqual(items)
  })

  it('matches by case-insensitive substring', () => {
    expect(filterFrames(items, 'NAME').map((f) => f.id)).toEqual(['a', 'c'])
    expect(filterFrames(items, 'alice').map((f) => f.id)).toEqual(['c'])
    expect(filterFrames(items, 'SCHEMA').map((f) => f.id)).toEqual(['b'])
  })

  it('trims the search string before matching', () => {
    expect(filterFrames(items, '  alice  ').map((f) => f.id)).toEqual(['c'])
  })

  it('returns no items when nothing matches', () => {
    expect(filterFrames(items, 'does-not-exist')).toEqual([])
  })

  it('skips frames without a query string', () => {
    const withBroken = [...items, { id: 'd' }, { id: 'e', query: 42 }]
    expect(filterFrames(withBroken, 'name').map((f) => f.id)).toEqual([
      'a',
      'c',
    ])
  })

  it('handles a missing items list', () => {
    expect(filterFrames(undefined, 'name')).toEqual([])
    expect(filterFrames(null, '')).toEqual([])
  })
})
