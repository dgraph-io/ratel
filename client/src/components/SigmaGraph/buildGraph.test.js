/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EDGE_SIZE,
  NODE_MAX_SIZE,
  NODE_SIZE,
  buildGraph,
  edgeCurvature,
} from './buildGraph'

const makeNode = (uid, overrides = {}) => ({
  id: uid,
  uid,
  label: `label-${uid}`,
  color: '#123456',
  properties: { attrs: {}, facets: {} },
  ...overrides,
})

const makeEdge = (source, target, overrides = {}) => ({
  source,
  target,
  label: 'friend',
  predicate: 'friend',
  color: '#654321',
  facets: {},
  ...overrides,
})

const mapOf = (entries) => new Map(entries)

describe('buildGraph', () => {
  it('returns an empty graph for missing datasets', () => {
    expect(buildGraph(null, null).order).toBe(0)
    expect(buildGraph(new Map(), new Map()).order).toBe(0)
  })

  it('adds nodes with label, color and original node reference', () => {
    const node = makeNode('0x1')
    const graph = buildGraph(mapOf([['0x1', node]]), new Map())

    expect(graph.order).toBe(1)
    const attrs = graph.getNodeAttributes('0x1')
    expect(attrs.label).toBe('label-0x1')
    expect(attrs.color).toBe('#123456')
    expect(attrs.size).toBe(NODE_SIZE)
    expect(attrs.originalNode).toBe(node)
    expect(typeof attrs.x).toBe('number')
    expect(typeof attrs.y).toBe('number')
  })

  it('falls back to name, then uid, for unlabeled nodes', () => {
    const noLabel = makeNode('0x1', { label: '', name: 'full name' })
    const nothing = makeNode('0x2', { label: '', name: '' })
    const graph = buildGraph(
      mapOf([
        ['0x1', noLabel],
        ['0x2', nothing],
      ]),
      new Map(),
    )

    expect(graph.getNodeAttribute('0x1', 'label')).toBe('full name')
    expect(graph.getNodeAttribute('0x2', 'label')).toBe('0x2')
  })

  it('resolves edge source/target uids to node objects', () => {
    // GraphParser.collapseNode and EdgeProperties depend on edges holding
    // node objects, a mutation d3-force used to perform.
    const a = makeNode('0x1')
    const b = makeNode('0x2')
    const edge = makeEdge('0x1', '0x2')
    const nodes = mapOf([
      ['0x1', a],
      ['0x2', b],
    ])
    const graph = buildGraph(nodes, mapOf([['e1', edge]]))

    expect(graph.size).toBe(1)
    expect(edge.source).toBe(a)
    expect(edge.target).toBe(b)
    expect(graph.getEdgeAttribute('e1', 'originalEdge')).toBe(edge)
    expect(graph.getEdgeAttribute('e1', 'label')).toBe('friend')
    expect(graph.getEdgeAttribute('e1', 'size')).toBe(EDGE_SIZE)
  })

  it('is stable when edges already hold node objects', () => {
    const a = makeNode('0x1')
    const b = makeNode('0x2')
    const edge = makeEdge(a, b)
    const nodes = mapOf([
      ['0x1', a],
      ['0x2', b],
    ])
    const graph = buildGraph(nodes, mapOf([['e1', edge]]))

    expect(graph.size).toBe(1)
    expect(edge.source).toBe(a)
    expect(edge.target).toBe(b)
  })

  it('skips edges whose endpoints are not in the node map', () => {
    const graph = buildGraph(
      mapOf([['0x1', makeNode('0x1')]]),
      mapOf([['e1', makeEdge('0x1', '0xmissing')]]),
    )
    expect(graph.size).toBe(0)
  })

  it('renders parallel edges as distinct curves', () => {
    const a = makeNode('0x1')
    const b = makeNode('0x2')
    const edges = mapOf([
      ['e1', makeEdge('0x1', '0x2', { siblingIndex: 0, siblingCount: 3 })],
      ['e2', makeEdge('0x1', '0x2', { siblingIndex: 1, siblingCount: 3 })],
      ['e3', makeEdge('0x1', '0x2', { siblingIndex: 2, siblingCount: 3 })],
    ])
    const graph = buildGraph(
      mapOf([
        ['0x1', a],
        ['0x2', b],
      ]),
      edges,
    )

    expect(graph.size).toBe(3)
    expect(graph.getEdgeAttribute('e1', 'type')).toBe('arrow')
    expect(graph.getEdgeAttribute('e2', 'type')).toBe('curvedArrow')
    expect(graph.getEdgeAttribute('e3', 'type')).toBe('curvedArrow')

    const curvatures = ['e1', 'e2', 'e3'].map((k) =>
      graph.getEdgeAttribute(k, 'curvature'),
    )
    expect(new Set(curvatures).size).toBe(3)
  })

  it('sizes nodes by degree, capped at NODE_MAX_SIZE', () => {
    const hub = makeNode('0xhub')
    const nodes = [['0xhub', hub]]
    const edges = []
    for (let i = 0; i < 30; i++) {
      nodes.push([`0x${i}`, makeNode(`0x${i}`)])
      edges.push([`e${i}`, makeEdge('0xhub', `0x${i}`)])
    }
    const graph = buildGraph(mapOf(nodes), mapOf(edges))

    expect(graph.getNodeAttribute('0xhub', 'size')).toBe(NODE_MAX_SIZE)
    expect(graph.getNodeAttribute('0x0', 'size')).toBe(NODE_SIZE + 0.5)
  })

  it('reuses previous positions for already-placed nodes', () => {
    const graph = buildGraph(
      mapOf([
        ['0x1', makeNode('0x1')],
        ['0x2', makeNode('0x2')],
      ]),
      new Map(),
      new Map([['0x1', { x: 42, y: -7 }]]),
    )

    expect(graph.getNodeAttribute('0x1', 'x')).toBe(42)
    expect(graph.getNodeAttribute('0x1', 'y')).toBe(-7)
    expect(graph.getNodeAttribute('0x2', 'x')).not.toBe(42)
  })
})

describe('edgeCurvature', () => {
  it('keeps single edges straight', () => {
    expect(edgeCurvature(0, 1)).toBe(0)
    expect(edgeCurvature(undefined, undefined)).toBe(0)
  })

  it('keeps the first of an odd sibling group straight', () => {
    expect(edgeCurvature(0, 3)).toBe(0)
  })

  it('fans siblings out on alternating sides', () => {
    const three = [0, 1, 2].map((i) => edgeCurvature(i, 3))
    expect(three[1]).toBeGreaterThan(0)
    expect(three[2]).toBeLessThan(0)

    const four = [0, 1, 2, 3].map((i) => edgeCurvature(i, 4))
    expect(new Set(four).size).toBe(4)
    expect(four.filter((c) => c > 0).length).toBe(2)
    expect(four.filter((c) => c < 0).length).toBe(2)
  })
})
