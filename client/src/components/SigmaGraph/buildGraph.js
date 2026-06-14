/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { MultiDirectedGraph } from 'graphology'

export const NODE_SIZE = 7
export const NODE_MAX_SIZE = 14
export const EDGE_SIZE = 1.5

// Spread parallel edges between the same pair of nodes so they don't
// overlap: with an odd count the first edge stays straight, the rest fan
// out on alternating sides with growing amplitude.
export function edgeCurvature(siblingIndex, siblingCount) {
  if (!siblingCount || siblingCount < 2) {
    return 0
  }
  const index = siblingIndex || 0
  const isOdd = siblingCount % 2 === 1
  if (isOdd && index === 0) {
    return 0
  }
  const step = isOdd ? Math.ceil(index / 2) : Math.floor(index / 2) + 1
  const sign = index % 2 === (isOdd ? 1 : 0) ? 1 : -1
  return sign * 0.18 * step
}

// Deterministic initial position on a circle, so the renderer never sees
// every node at the origin and the layout converges the same way for the
// same response.
function initialPosition(index, total) {
  const angle = (2 * Math.PI * index) / Math.max(total, 1)
  const radius = 10 + Math.sqrt(total)
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }
}

const endpointId = (endpoint) =>
  endpoint && typeof endpoint === 'object' ? endpoint.id : endpoint

/**
 * Builds a graphology graph out of the GraphParser datasets.
 *
 * As a side effect, resolves each edge's source/target from uid strings to
 * the node objects from nodesMap. The rest of the app depends on this
 * (EdgeProperties renders edge.source.label, GraphParser.collapseNode reads
 * edge.source.uid) — d3-force used to perform this mutation.
 *
 * @param nodesMap Map of uid -> node (GraphParser.nodesDataset)
 * @param edgesMap Map of key -> edge (GraphParser.edgesDataset)
 * @param prevPositions optional Map of uid -> {x, y} to keep already-placed
 *        nodes where the user left them across expansions/collapses.
 */
export function buildGraph(nodesMap, edgesMap, prevPositions = new Map()) {
  const graph = new MultiDirectedGraph()
  if (!nodesMap || !edgesMap) {
    return graph
  }

  let index = 0
  nodesMap.forEach((node, uid) => {
    const pos = prevPositions.get(uid) || initialPosition(index, nodesMap.size)
    index++
    graph.addNode(uid, {
      label: node.label || node.name || String(uid),
      color: node.color || '#cccccc',
      size: NODE_SIZE,
      x: pos.x,
      y: pos.y,
      // Used by the circlepack layout to cluster nodes by their group.
      group: node.group || '',
      originalNode: node,
    })
  })

  edgesMap.forEach((edge, key) => {
    const sourceId = endpointId(edge.source)
    const targetId = endpointId(edge.target)
    if (!graph.hasNode(sourceId) || !graph.hasNode(targetId)) {
      return
    }

    // See docstring: keep the d3-force contract of object endpoints.
    edge.source = nodesMap.get(sourceId)
    edge.target = nodesMap.get(targetId)

    const curvature = edgeCurvature(edge.siblingIndex, edge.siblingCount)
    graph.addEdgeWithKey(key, sourceId, targetId, {
      label: edge.label,
      color: edge.color || '#999999',
      size: EDGE_SIZE,
      type: curvature === 0 ? 'arrow' : 'curvedArrow',
      curvature,
      originalEdge: edge,
    })
  })

  // Size nodes by connectivity (like Neo4j Bloom), capped so hubs don't
  // swallow the viewport.
  graph.forEachNode((uid) => {
    graph.setNodeAttribute(
      uid,
      'size',
      Math.min(NODE_MAX_SIZE, NODE_SIZE + graph.degree(uid) * 0.5),
    )
  })

  return graph
}
