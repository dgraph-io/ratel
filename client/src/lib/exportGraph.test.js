/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  compositeCanvases,
  exportFileName,
  graphToJSON,
} from './exportGraph'

describe('graphToJSON', () => {
  const node = (uid, extra = {}) => ({
    id: uid,
    uid,
    label: `short-${uid}`,
    name: `full-${uid}`,
    group: 'friend',
    properties: { attrs: { name: `full-${uid}` }, facets: { since: 2020 } },
    expansionParents: new Set(['root']),
    ...extra,
  })

  it('handles empty/missing datasets', () => {
    expect(graphToJSON(null, null)).toEqual({ nodes: [], edges: [] })
    expect(graphToJSON(new Map(), new Map())).toEqual({ nodes: [], edges: [] })
  })

  it('exports node fields without circular references', () => {
    const result = graphToJSON(new Map([['0x1', node('0x1')]]), new Map())

    expect(result.nodes).toEqual([
      {
        uid: '0x1',
        label: 'full-0x1',
        group: 'friend',
        attrs: { name: 'full-0x1' },
        facets: { since: 2020 },
      },
    ])
    // The whole point: must be serializable.
    expect(() => JSON.stringify(result)).not.toThrow()
  })

  it('exports edges with uid endpoints when endpoints are strings', () => {
    const edges = new Map([
      [
        'e1',
        { source: '0x1', target: '0x2', predicate: 'friend', facets: {} },
      ],
    ])
    const result = graphToJSON(new Map(), edges)
    expect(result.edges).toEqual([
      { source: '0x1', target: '0x2', predicate: 'friend', facets: {} },
    ])
  })

  it('exports edges with uid endpoints when endpoints are node objects', () => {
    // After rendering, the graph renderer resolves edge endpoints to node
    // objects in place — export must not produce circular JSON.
    const a = node('0x1')
    const b = node('0x2')
    const edges = new Map([
      ['e1', { source: a, target: b, predicate: 'friend', facets: {} }],
    ])

    const result = graphToJSON(
      new Map([
        ['0x1', a],
        ['0x2', b],
      ]),
      edges,
    )

    expect(result.edges[0].source).toBe('0x1')
    expect(result.edges[0].target).toBe('0x2')
    expect(() => JSON.stringify(result)).not.toThrow()
  })
})

describe('exportFileName', () => {
  it('builds a timestamped name', () => {
    const fixed = new Date(2026, 5, 12, 9, 5)
    expect(exportFileName('png', fixed)).toBe('ratel-graph-2026-06-12-0905.png')
    expect(exportFileName('json', fixed)).toBe(
      'ratel-graph-2026-06-12-0905.json',
    )
  })
})

describe('compositeCanvases', () => {
  it('returns null when the container has no canvases', () => {
    const div = document.createElement('div')
    expect(compositeCanvases(div)).toBe(null)
  })

  it('returns null for zero-sized canvases', () => {
    const div = document.createElement('div')
    const canvas = document.createElement('canvas')
    canvas.width = 0
    canvas.height = 0
    div.appendChild(canvas)
    expect(compositeCanvases(div)).toBe(null)
  })

  it('composites canvases onto a single canvas of the max dimensions', () => {
    const div = document.createElement('div')
    const sizes = [
      [100, 50],
      [200, 40],
    ]
    const drawn = []
    sizes.forEach(([w, h]) => {
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      div.appendChild(c)
    })

    // jsdom has no real canvas; provide a minimal 2d context.
    const ctx = {
      fillRect: jest.fn(),
      drawImage: jest.fn((img) => drawn.push(img)),
    }
    jest
      .spyOn(window.HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(ctx)

    const out = compositeCanvases(div)

    expect(out.width).toBe(200)
    expect(out.height).toBe(50)
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 200, 50)
    expect(drawn.length).toBe(2)

    window.HTMLCanvasElement.prototype.getContext.mockRestore()
  })
})
