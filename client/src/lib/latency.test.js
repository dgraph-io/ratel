/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  latencyBarSegments,
  latencyTooltip,
  serverLatencySegments,
  timeToText,
} from './latency'

describe('timeToText', () => {
  it('formats across magnitudes', () => {
    expect(timeToText(null)).toBe('')
    expect(timeToText(undefined)).toBe('')
    expect(timeToText(500)).toBe('500ns')
    expect(timeToText(2.5e6)).toBe('3ms')
    expect(timeToText(1.5e9)).toBe('1.5s')
    expect(timeToText(90e9)).toBe('1m30s')
  })
})

describe('serverLatencySegments', () => {
  it('returns empty for missing input', () => {
    expect(serverLatencySegments(null)).toEqual([])
    expect(serverLatencySegments(undefined)).toEqual([])
    expect(serverLatencySegments({})).toEqual([])
  })

  it('orders known phases by pipeline order and skips zeros', () => {
    const segments = serverLatencySegments({
      encoding_ns: 100,
      parsing_ns: 50,
      processing_ns: 0,
      total_ns: 150,
    })
    expect(segments.map((s) => s.key)).toEqual(['parsing_ns', 'encoding_ns'])
    expect(segments[0].label).toBe('Parsing')
  })

  it('includes unknown *_ns fields with prettified labels, excludes total', () => {
    const segments = serverLatencySegments({
      parsing_ns: 10,
      some_new_phase_ns: 20,
      total_ns: 30,
      not_a_latency: 99,
    })
    expect(segments.map((s) => s.key)).toEqual([
      'parsing_ns',
      'some_new_phase_ns',
    ])
    expect(segments[1].label).toBe('Some new phase')
  })
})

describe('latencyBarSegments', () => {
  it('appends network time and computes ratios', () => {
    const segments = latencyBarSegments(
      { parsing_ns: 25, processing_ns: 50 },
      25,
    )
    expect(segments.map((s) => s.key)).toEqual([
      'parsing_ns',
      'processing_ns',
      'network',
    ])
    expect(segments.map((s) => s.ratio)).toEqual([0.25, 0.5, 0.25])
    expect(segments[2].label).toBe('Network')
  })

  it('returns empty when there is nothing to show', () => {
    expect(latencyBarSegments(null, 0)).toEqual([])
    expect(latencyBarSegments({}, undefined)).toEqual([])
  })

  it('works with server latency only', () => {
    const segments = latencyBarSegments({ processing_ns: 10 }, undefined)
    expect(segments).toHaveLength(1)
    expect(segments[0].ratio).toBe(1)
  })
})

describe('latencyTooltip', () => {
  it('lists each phase with percentage and a total', () => {
    const tooltip = latencyTooltip(
      latencyBarSegments({ parsing_ns: 25, processing_ns: 50 }, 25),
    )
    expect(tooltip).toContain('Parsing: ')
    expect(tooltip).toContain('(25%)')
    expect(tooltip).toContain('Processing: ')
    expect(tooltip).toContain('(50%)')
    expect(tooltip).toContain('Network: ')
    expect(tooltip.split('\n').pop()).toMatch(/^Total: /)
  })

  it('is empty for no segments', () => {
    expect(latencyTooltip([])).toBe('')
  })
})
