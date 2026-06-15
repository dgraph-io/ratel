/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Returns the first edge key joining a and b in either direction, or null.
function edgeBetween(graph, a, b) {
  const keys = [...graph.edges(a, b), ...graph.edges(b, a)]
  return keys.length ? keys[0] : null
}

/**
 * Breadth-first shortest path between two nodes of a graphology graph,
 * treating edges as undirected (the natural expectation when exploring a
 * graph visually). Operates on the currently rendered subgraph, so it finds
 * connections among the nodes the user can actually see.
 *
 * @returns {{nodes: Set<string>, edges: Set<string>, hops: number} | null}
 *          null when either endpoint is missing or no path exists.
 */
export function findPath(graph, source, target) {
  if (!graph || !graph.hasNode(source) || !graph.hasNode(target)) {
    return null
  }
  if (source === target) {
    return { nodes: new Set([source]), edges: new Set(), hops: 0 }
  }

  const prev = new Map([[source, null]])
  const queue = [source]
  let head = 0
  let reached = false

  while (head < queue.length && !reached) {
    const current = queue[head++]
    graph.forEachNeighbor(current, (neighbor) => {
      if (!prev.has(neighbor)) {
        prev.set(neighbor, current)
        queue.push(neighbor)
        if (neighbor === target) {
          reached = true
        }
      }
    })
  }

  if (!prev.has(target)) {
    return null
  }

  const path = []
  for (let node = target; node != null; node = prev.get(node)) {
    path.push(node)
  }
  path.reverse()

  const nodes = new Set(path)
  const edges = new Set()
  for (let i = 0; i < path.length - 1; i++) {
    const key = edgeBetween(graph, path[i], path[i + 1])
    if (key) {
      edges.add(key)
    }
  }

  return { nodes, edges, hops: path.length - 1 }
}
