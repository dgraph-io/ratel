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

/**
 * Tallies how many values each predicate contributes across the whole
 * response tree: scalars count once, child-node lists count their length
 * (and recurse). Block aliases at the top level and facet maps (keys with a
 * "|") are excluded. This is a rough proxy for how much data the query
 * returned, which helps explain processing/encoding/network time.
 */
export function countPredicates(data) {
  const counts = {}
  const bump = (key, n) => {
    counts[key] = (counts[key] || 0) + n
  }

  const visit = (node) => {
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    if (!node || typeof node !== 'object') {
      return
    }
    for (const [key, val] of Object.entries(node)) {
      if (key.includes('|')) {
        // Facet map (e.g. "friend|since"), not a predicate of its own.
        continue
      }
      if (Array.isArray(val)) {
        bump(key, val.length)
        val.forEach(visit)
      } else if (val && typeof val === 'object') {
        bump(key, 1)
        visit(val)
      } else {
        bump(key, 1)
      }
    }
  }

  // Top-level keys are query block aliases, not predicates: descend past them.
  Object.values(data || {}).forEach(visit)
  return counts
}

/**
 * Per-predicate value counts as display segments, widest bar first. `ratio`
 * is relative to the largest count so the busiest predicate fills the track.
 */
export function numUidSegments(data) {
  const counts = countPredicates(data)
  const entries = Object.entries(counts)
  const total = entries.reduce((sum, [, n]) => sum + n, 0)
  if (total <= 0) {
    return { segments: [], total: 0 }
  }
  const max = Math.max(...entries.map(([, n]) => n))
  const segments = entries
    .map(([key, count]) => ({ key, count, ratio: max ? count / max : 0 }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
  return { segments, total }
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
