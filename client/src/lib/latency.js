/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Helpers for rendering Dgraph's per-phase latency breakdown
// (response.extensions.server_latency).

const KNOWN_PHASES = [
  ['parsing_ns', 'Parsing'],
  ['processing_ns', 'Processing'],
  ['encoding_ns', 'Encoding'],
  ['assign_timestamp_ns', 'Assign timestamp'],
]

export function timeToText(ns) {
  if (ns === null || ns === undefined) {
    return ''
  }
  if (ns < 1e4) {
    return ns.toFixed(0) + 'ns'
  }
  const ms = ns / 1e6
  if (ms < 1000) {
    return ms.toFixed(0) + 'ms'
  }
  const s = ms / 1000
  if (s <= 60) {
    return s.toFixed(1) + 's'
  }
  const secondsOnly = Math.round(s) % 60

  return `${Math.floor(s / 60)}m${secondsOnly.toLocaleString('en', {
    minimumIntegerDigits: 2,
  })}s`
}

const labelFor = (key) =>
  key
    .replace(/_ns$/, '')
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase())

/**
 * Turns extensions.server_latency into ordered display segments.
 * Known phases come first in pipeline order; any other *_ns fields the
 * server adds in the future follow with a prettified label. total_ns is
 * excluded (it duplicates the sum).
 */
export function serverLatencySegments(serverLatency) {
  if (!serverLatency) {
    return []
  }

  const segments = []
  const seen = new Set()

  KNOWN_PHASES.forEach(([key, label]) => {
    seen.add(key)
    const ns = serverLatency[key]
    if (typeof ns === 'number' && ns > 0) {
      segments.push({ key, label, ns })
    }
  })

  Object.keys(serverLatency)
    .sort()
    .forEach((key) => {
      if (seen.has(key) || key === 'total_ns' || !key.endsWith('_ns')) {
        return
      }
      const ns = serverLatency[key]
      if (typeof ns === 'number' && ns > 0) {
        segments.push({ key, label: labelFor(key), ns })
      }
    })

  return segments
}

/**
 * Full set of bar segments for a frame: server phases plus network time,
 * each with its share of the total. Returns [] when there is nothing to
 * show.
 */
export function latencyBarSegments(serverLatency, networkNs) {
  const segments = serverLatencySegments(serverLatency)
  if (typeof networkNs === 'number' && networkNs > 0) {
    segments.push({ key: 'network', label: 'Network', ns: networkNs })
  }

  const totalNs = segments.reduce((sum, s) => sum + s.ns, 0)
  if (totalNs <= 0) {
    return []
  }

  return segments.map((s) => ({
    ...s,
    ratio: s.ns / totalNs,
    text: timeToText(s.ns),
  }))
}

export function latencyTooltip(segments) {
  if (!segments.length) {
    return ''
  }
  const totalNs = segments.reduce((sum, s) => sum + s.ns, 0)
  const lines = segments.map(
    (s) => `${s.label}: ${timeToText(s.ns)} (${(s.ratio * 100).toFixed(0)}%)`,
  )
  lines.push(`Total: ${timeToText(totalNs)}`)
  return lines.join('\n')
}
