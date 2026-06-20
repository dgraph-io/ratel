/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { MultiDirectedGraph } from 'graphology'

import {
  safeConnectedComponents,
  safeDegreeHistogram,
  safeDegreeStats,
  safeDensity,
  safeOrderSize,
  safeReciprocity,
  summarizeGraph,
  topByAttribute,
} from './graphStats'

const makeGraph = (nodes, edges = [], nodeAttrs = {}) => {
  const g = new MultiDirectedGraph()
  nodes.forEach((n) => g.addNode(n, nodeAttrs[n] || {}))
  edges.forEach(([s, t], i) => g.addEdgeWithKey(`e${i}`, s, t))
  return g
}

describe('safeOrderSize', () => {
  it('reports zero for an empty graph', () => {
    expect(safeOrderSize(new MultiDirectedGraph())).toEqual({
      nodes: 0,
      edges: 0,
    })
  })

  it('counts nodes and edges', () => {
    const g = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b'],
        ['b', 'c'],
      ],
    )
    expect(safeOrderSize(g)).toEqual({ nodes: 3, edges: 2 })
  })
})

describe('safeDegreeStats', () => {
  it('returns zeros for an empty graph', () => {
    expect(safeDegreeStats(new MultiDirectedGraph())).toEqual({
      min: 0,
      max: 0,
      avg: 0,
      median: 0,
    })
  })

  it('computes min, max, avg, and median over a known shape', () => {
    // Star: a is connected to b, c, d (degree 3); b, c, d are degree 1.
    const g = makeGraph(
      ['a', 'b', 'c', 'd'],
      [
        ['a', 'b'],
        ['a', 'c'],
        ['a', 'd'],
      ],
    )
    expect(safeDegreeStats(g)).toEqual({
      min: 1,
      max: 3,
      avg: 1.5,
      median: 1,
    })
  })

  it('averages correctly with an even degree count', () => {
    // Path a-b-c-d gives degrees [1, 2, 2, 1] -> median 1.5, avg 1.5
    const g = makeGraph(
      ['a', 'b', 'c', 'd'],
      [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'd'],
      ],
    )
    expect(safeDegreeStats(g)).toEqual({
      min: 1,
      max: 2,
      avg: 1.5,
      median: 1.5,
    })
  })
})

describe('safeConnectedComponents', () => {
  it('counts a single connected graph as one component', () => {
    const g = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b'],
        ['b', 'c'],
      ],
    )
    const result = safeConnectedComponents(g)
    expect(result.count).toBe(1)
    expect(result.largest).toBe(3)
    expect(result.sizes).toEqual([3])
  })

  it('counts disconnected nodes as their own components', () => {
    const g = makeGraph(['a', 'b', 'c'], [['a', 'b']])
    const result = safeConnectedComponents(g)
    expect(result.count).toBe(2)
    expect(result.largest).toBe(2)
    expect(result.sizes.sort()).toEqual([1, 2])
  })

  it('treats reverse edges as connectivity (undirected)', () => {
    const g = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b'],
        ['c', 'b'],
      ],
    )
    const result = safeConnectedComponents(g)
    expect(result.count).toBe(1)
    expect(result.largest).toBe(3)
  })

  it('returns zeros for an empty graph', () => {
    expect(safeConnectedComponents(new MultiDirectedGraph())).toEqual({
      count: 0,
      largest: 0,
      sizes: [],
    })
  })
})

describe('safeDensity', () => {
  it('returns 0 for graphs with fewer than 2 nodes', () => {
    const g = makeGraph(['a'])
    expect(safeDensity(g)).toBe(0)
  })

  it('returns 0 for an empty graph', () => {
    expect(safeDensity(new MultiDirectedGraph())).toBe(0)
  })

  it('reports a non-zero density for a connected graph', () => {
    const g = makeGraph(
      ['a', 'b', 'c', 'd'],
      [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'd'],
      ],
    )
    // 3 edges / (4 * 3) = 0.25 for a directed multigraph
    expect(safeDensity(g)).toBeCloseTo(0.25, 5)
  })
})

describe('safeReciprocity', () => {
  it('returns 0 for an empty graph', () => {
    expect(safeReciprocity(new MultiDirectedGraph())).toBe(0)
  })

  it('returns 0 when no edges are mirrored', () => {
    const g = makeGraph(['a', 'b'], [['a', 'b']])
    expect(safeReciprocity(g)).toBe(0)
  })

  it('returns 1 when every edge has a reverse', () => {
    const g = makeGraph(
      ['a', 'b'],
      [
        ['a', 'b'],
        ['b', 'a'],
      ],
    )
    expect(safeReciprocity(g)).toBe(1)
  })

  it('averages partial reciprocity', () => {
    // 3 edges, 2 mirrored (a->b and b->a both have a reverse) -> 2/3
    const g = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b'],
        ['b', 'a'],
        ['a', 'c'],
      ],
    )
    expect(safeReciprocity(g)).toBeCloseTo(2 / 3, 5)
  })
})

describe('safeDegreeHistogram', () => {
  it('returns an empty array for an empty graph', () => {
    expect(safeDegreeHistogram(new MultiDirectedGraph())).toEqual([])
  })

  it('groups nodes by degree centrality bins', () => {
    // Star of 4 leaves around 1 hub: hub degree 4, leaves degree 1.
    // Degree centrality = degree / (order - 1) so hub=1, leaves=1/3.
    const g = makeGraph(
      ['a', 'b', 'c', 'd', 'e'],
      [
        ['a', 'b'],
        ['a', 'c'],
        ['a', 'd'],
        ['a', 'e'],
      ],
    )
    const hist = safeDegreeHistogram(g, 4)
    expect(hist).toHaveLength(4)
    // All bins sum to the number of nodes
    const total = hist.reduce((acc, b) => acc + b.count, 0)
    expect(total).toBe(5)
  })

  it('handles a graph where every node has degree 0', () => {
    const g = makeGraph(['a', 'b', 'c'], [])
    const hist = safeDegreeHistogram(g, 3)
    expect(hist).toEqual([{ range: [0, 0], count: 3 }])
  })
})

describe('topByAttribute', () => {
  it('returns the n largest entries by attribute value', () => {
    const g = makeGraph(['a', 'b', 'c'], [], {
      a: { score: 5 },
      b: { score: 10 },
      c: { score: 3 },
    })
    expect(topByAttribute(g, 'score', 2)).toEqual([
      { uid: 'b', label: 'b', value: 10 },
      { uid: 'a', label: 'a', value: 5 },
    ])
  })

  it('skips nodes missing the attribute or with non-numeric values', () => {
    const g = makeGraph(['a', 'b', 'c'], [], {
      a: { score: 5 },
      b: {},
      c: { score: 'oops' },
    })
    expect(topByAttribute(g, 'score', 5)).toEqual([
      { uid: 'a', label: 'a', value: 5 },
    ])
  })

  it('uses the label attribute when present', () => {
    const g = makeGraph(['uid-1', 'uid-2'], [], {
      'uid-1': { label: 'Alice', score: 9 },
      'uid-2': { label: 'Bob', score: 2 },
    })
    expect(topByAttribute(g, 'score', 1)).toEqual([
      { uid: 'uid-1', label: 'Alice', value: 9 },
    ])
  })

  it('returns empty for an empty graph', () => {
    expect(topByAttribute(new MultiDirectedGraph(), 'score', 5)).toEqual([])
  })
})

describe('summarizeGraph', () => {
  it('returns the full snapshot in a single call', () => {
    const g = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b'],
        ['b', 'a'],
        ['b', 'c'],
      ],
      { a: { label: 'a' }, b: { label: 'b' }, c: { label: 'c' } },
    )
    const summary = summarizeGraph(g, { bins: 4 })
    expect(summary.nodes).toBe(3)
    expect(summary.edges).toBe(3)
    expect(summary.degree.max).toBe(3)
    expect(summary.components.count).toBe(1)
    expect(summary.components.largest).toBe(3)
    expect(summary.reciprocity).toBeCloseTo(2 / 3, 5)
    expect(summary.degreeHistogram).toHaveLength(4)
    expect(summary.density).toBeGreaterThan(0)
  })

  it('handles an empty graph', () => {
    const summary = summarizeGraph(new MultiDirectedGraph())
    expect(summary.nodes).toBe(0)
    expect(summary.edges).toBe(0)
    expect(summary.degree).toEqual({ min: 0, max: 0, avg: 0, median: 0 })
    expect(summary.components.count).toBe(0)
    expect(summary.density).toBe(0)
    expect(summary.reciprocity).toBe(0)
    expect(summary.degreeHistogram).toEqual([])
  })
})
