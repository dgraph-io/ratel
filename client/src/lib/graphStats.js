/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { degreeCentrality } from 'graphology-metrics/centrality/degree'
import { density } from 'graphology-metrics/graph/density'

// Internal type notes: inputs are a graphology graph. `MultiDirectedGraph`
// (the type SigmaGraph builds) is the expected shape, but any graphology
// graph with `forEachNode`, `forEachEdge`, `degree`, `hasEdge`, `neighbors`
// will work for these stat helpers.

function safeOrderSize(graph) {
  return { nodes: graph.order, edges: graph.size }
}

function safeDegreeStats(graph) {
  if (graph.order === 0) {
    return { min: 0, max: 0, avg: 0, median: 0 }
  }
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  let sum = 0
  const degrees = []
  graph.forEachNode((uid) => {
    const d = graph.degree(uid)
    if (d < min) min = d
    if (d > max) max = d
    sum += d
    degrees.push(d)
  })
  degrees.sort((a, b) => a - b)
  const mid = Math.floor(degrees.length / 2)
  const median =
    degrees.length % 2 === 0
      ? (degrees[mid - 1] + degrees[mid]) / 2
      : degrees[mid]
  return {
    min,
    max,
    avg: sum / degrees.length,
    median,
  }
}

// Connected components as undirected — "how many separate islands is the
// graph split into?" is the intuitive question for someone exploring a
// result set, even though Dgraph edges are directed.
function safeConnectedComponents(graph) {
  if (graph.order === 0) {
    return { count: 0, largest: 0, sizes: [] }
  }
  const visited = new Set()
  const sizes = []
  graph.forEachNode((start) => {
    if (visited.has(start)) {
      return
    }
    const stack = [start]
    let size = 0
    while (stack.length > 0) {
      const uid = stack.pop()
      if (visited.has(uid)) {
        continue
      }
      visited.add(uid)
      size += 1
      graph.forEachNeighbor(uid, (nbr) => {
        if (!visited.has(nbr)) {
          stack.push(nbr)
        }
      })
    }
    sizes.push(size)
  })
  sizes.sort((a, b) => b - a)
  return {
    count: sizes.length,
    largest: sizes.length > 0 ? sizes[0] : 0,
    sizes,
  }
}

function safeDensity(graph) {
  if (graph.order < 2) {
    return 0
  }
  try {
    // `density` is directed-aware. For a MultiDirectedGraph with both
    // forward and reverse edges the value can exceed 1, so clamp.
    const value = density(graph)
    return Math.max(0, Math.min(1, value))
  } catch (_e) {
    return 0
  }
}

// Fraction of edges that have a matching reverse edge between the same
// pair of nodes. For a graph that only ever records the forward edge,
// reciprocity is 0; for a fully mirrored one it is 1.
function safeReciprocity(graph) {
  if (graph.size === 0) {
    return 0
  }
  let mirrored = 0
  graph.forEachEdge((_key, _attrs, source, target) => {
    if (graph.hasEdge(target, source)) {
      mirrored += 1
    }
  })
  return mirrored / graph.size
}

function safeDegreeHistogram(graph, bins = 10) {
  if (graph.order === 0) {
    return []
  }
  const centrality = degreeCentrality(graph)
  const values = Object.values(centrality)
  let max = 0
  for (const v of values) {
    if (v > max) max = v
  }
  if (max === 0) {
    return [{ range: [0, 0], count: values.length }]
  }
  const step = max / bins
  const counts = new Array(bins).fill(0)
  for (const v of values) {
    const idx = Math.min(bins - 1, Math.floor(v * bins))
    counts[idx] += 1
  }
  const result = []
  for (let i = 0; i < bins; i += 1) {
    const lo = Math.floor(i * step)
    const hi = i === bins - 1 ? Math.ceil(max) : Math.floor((i + 1) * step) - 1
    result.push({ range: [lo, Math.max(hi, lo)], count: counts[i] })
  }
  return result
}

function nodeLabel(graph, uid) {
  const attrs = graph.getNodeAttributes(uid)
  if (attrs && typeof attrs.label === 'string' && attrs.label.length) {
    return attrs.label
  }
  return String(uid)
}

// Top-N nodes by a numeric attribute. Used to highlight hubs and
// betweenness leaders in the stats panel.
export function topByAttribute(graph, attr, n = 5) {
  if (graph.order === 0) {
    return []
  }
  const entries = []
  graph.forEachNode((uid, attrs) => {
    const value = attrs ? attrs[attr] : undefined
    if (typeof value === 'number' && Number.isFinite(value)) {
      entries.push({ uid, label: nodeLabel(graph, uid), value })
    }
  })
  entries.sort((a, b) => b.value - a.value)
  return entries.slice(0, n)
}

export function summarizeGraph(graph, options = {}) {
  const bins = options.bins || 10
  return {
    ...safeOrderSize(graph),
    degree: safeDegreeStats(graph),
    components: safeConnectedComponents(graph),
    density: safeDensity(graph),
    reciprocity: safeReciprocity(graph),
    degreeHistogram: safeDegreeHistogram(graph, bins),
  }
}

export {
  safeConnectedComponents,
  safeDegreeHistogram,
  safeDegreeStats,
  safeDensity,
  safeOrderSize,
  safeReciprocity,
}
