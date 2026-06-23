/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { MultiDirectedGraph } from 'graphology'

import {
  COMMUNITY_PALETTE,
  annotateMetrics,
  communityColor,
  metricNodeSize,
} from './graphMetrics'

const makeGraph = (nodes, edges = []) => {
  const g = new MultiDirectedGraph()
  nodes.forEach((n) => g.addNode(n))
  edges.forEach(([s, t], i) => g.addEdgeWithKey(`e${i}`, s, t))
  return g
}

describe('communityColor', () => {
  it('maps indices to palette colors and cycles', () => {
    expect(communityColor(0)).toBe(COMMUNITY_PALETTE[0])
    expect(communityColor(1)).toBe(COMMUNITY_PALETTE[1])
    expect(communityColor(COMMUNITY_PALETTE.length)).toBe(COMMUNITY_PALETTE[0])
  })

  it('falls back to the first color for null/negative ids', () => {
    expect(communityColor(null)).toBe(COMMUNITY_PALETTE[0])
    expect(communityColor(-1)).toBe(COMMUNITY_PALETTE[0])
  })
})

describe('annotateMetrics', () => {
  it('returns 0 for an empty graph', () => {
    expect(annotateMetrics(new MultiDirectedGraph())).toBe(0)
    expect(annotateMetrics(null)).toBe(0)
  })

  it('assigns a community and betweenness attribute to every node', () => {
    const g = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b'],
        ['b', 'c'],
      ],
    )
    annotateMetrics(g)
    g.forEachNode((_uid, attrs) => {
      expect(typeof attrs.community).toBe('number')
      expect(typeof attrs._betweenness).toBe('number')
    })
    // The middle node of a path carries all the betweenness.
    expect(g.getNodeAttribute('b', '_betweenness')).toBeGreaterThan(0)
    expect(g.getNodeAttribute('a', '_betweenness')).toBe(0)
  })

  it('finds two communities in a barbell graph', () => {
    // Two triangles joined by a single bridge edge.
    const g = makeGraph(
      ['a', 'b', 'c', 'd', 'e', 'f'],
      [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'a'],
        ['d', 'e'],
        ['e', 'f'],
        ['f', 'd'],
        ['c', 'd'],
      ],
    )
    expect(annotateMetrics(g)).toBe(2)
  })

  it('handles edgeless graphs without crashing', () => {
    const g = makeGraph(['a', 'b'])
    expect(annotateMetrics(g)).toBe(1)
    expect(g.getNodeAttribute('a', '_betweenness')).toBe(0)
  })
})

describe('metricNodeSize', () => {
  const attrs = { size: 11, _betweenness: 0.5 }

  it('uniform mode returns the base node size', () => {
    expect(metricNodeSize('uniform', attrs, 7, 14)).toBe(7)
  })

  it('degree mode reuses the precomputed size', () => {
    expect(metricNodeSize('degree', attrs, 7, 14)).toBe(11)
  })

  it('betweenness mode interpolates between base and max', () => {
    expect(metricNodeSize('betweenness', attrs, 7, 14)).toBe(10.5)
    expect(metricNodeSize('betweenness', { _betweenness: 0 }, 7, 14)).toBe(7)
    expect(metricNodeSize('betweenness', { _betweenness: 1 }, 7, 14)).toBe(14)
  })
})
