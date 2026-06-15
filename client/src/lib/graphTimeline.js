/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Matches Dgraph datetime / date strings: an ISO-8601 date with an optional
// time and zone. Deliberately strict so bare numbers or arbitrary strings are
// never mistaken for timestamps.
const ISO_DATETIME =
  /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/

/**
 * The representative time of a node, in epoch milliseconds, or null when the
 * node has no datetime attribute. When several datetime attributes exist the
 * earliest is used, so a node "appears" as soon as its first event occurs.
 */
export function extractNodeTime(node) {
  const attrs = node && node.properties && node.properties.attrs
  if (!attrs) {
    return null
  }

  let earliest = null
  for (const key of Object.keys(attrs)) {
    const raw = attrs[key]
    const values = Array.isArray(raw) ? raw : [raw]
    for (const value of values) {
      if (typeof value !== 'string' || !ISO_DATETIME.test(value.trim())) {
        continue
      }
      const ms = Date.parse(value)
      if (!Number.isNaN(ms) && (earliest === null || ms < earliest)) {
        earliest = ms
      }
    }
  }
  return earliest
}

/**
 * The min/max time span across the dataset and how many nodes carry a time.
 * `available` is true only when there is a non-degenerate range to scrub.
 */
export function timelineRange(nodesDataset) {
  let min = null
  let max = null
  let count = 0

  nodesDataset.forEach((node) => {
    const t = extractNodeTime(node)
    if (t != null) {
      count++
      if (min === null || t < min) {
        min = t
      }
      if (max === null || t > max) {
        max = t
      }
    }
  })

  return { min, max, count, available: count >= 2 && min !== max }
}
