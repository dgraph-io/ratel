/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { MultiDirectedGraph } from 'graphology'

import { findPath } from './graphPath'

const makeGraph = (nodes, edges) => {
  const g = new MultiDirectedGraph()
  nodes.forEach((n) => g.addNode(n))
  edges.forEach(([s, t], i) => g.addEdgeWithKey(`${s}-${t}-${i}`, s, t))
  return g
}

describe('findPath', () => {
  it('returns null when an endpoint is missing', () => {
    const g = makeGraph(['a'], [])
    expect(findPath(g, 'a', 'z')).toBeNull()
    expect(findPath(g, 'z', 'a')).toBeNull()
    expect(findPath(null, 'a', 'b')).toBeNull()
  })

  it('returns a zero-hop path for identical endpoints', () => {
    const g = makeGraph(['a'], [])
    const path = findPath(g, 'a', 'a')
    expect(path.hops).toBe(0)
    expect([...path.nodes]).toEqual(['a'])
    expect(path.edges.size).toBe(0)
  })

  it('finds the shortest path and collects its edges', () => {
    // a-b-c-d chain plus a long detour a-e-f-d.
    const g = makeGraph(
      ['a', 'b', 'c', 'd', 'e', 'f'],
      [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'd'],
        ['a', 'e'],
        ['e', 'f'],
        ['f', 'd'],
      ],
    )
    const path = findPath(g, 'a', 'd')
    expect(path.hops).toBe(3)
    expect(path.nodes.has('a')).toBe(true)
    expect(path.nodes.has('d')).toBe(true)
    expect(path.edges.size).toBe(3)
  })

  it('traverses edges regardless of direction', () => {
    // Edges all point toward 'a', but an undirected path still exists.
    const g = makeGraph(
      ['a', 'b', 'c'],
      [
        ['b', 'a'],
        ['c', 'b'],
      ],
    )
    const path = findPath(g, 'a', 'c')
    expect(path.hops).toBe(2)
    expect(path.edges.size).toBe(2)
  })

  it('returns null for disconnected nodes', () => {
    const g = makeGraph(
      ['a', 'b', 'c', 'd'],
      [
        ['a', 'b'],
        ['c', 'd'],
      ],
    )
    expect(findPath(g, 'a', 'd')).toBeNull()
  })

  it('picks the shorter of two routes', () => {
    // a directly connects to d, and also via b-c.
    const g = makeGraph(
      ['a', 'b', 'c', 'd'],
      [
        ['a', 'd'],
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'd'],
      ],
    )
    const path = findPath(g, 'a', 'd')
    expect(path.hops).toBe(1)
  })
})
