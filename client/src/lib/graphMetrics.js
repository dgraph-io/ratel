/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import louvain from 'graphology-communities-louvain'
import betweennessCentrality from 'graphology-metrics/centrality/betweenness'

// Distinct hues for community coloring. Reused cyclically when a graph has
// more communities than colors.
export const COMMUNITY_PALETTE = [
  '#4e79a7',
  '#f28e2b',
  '#59a14f',
  '#e15759',
  '#b07aa1',
  '#edc948',
  '#76b7b2',
  '#ff9da7',
  '#9c755f',
  '#bab0ac',
  '#1b9e77',
  '#d95f02',
  '#7570b3',
  '#e7298a',
  '#66a61e',
  '#e6ab02',
  '#a6761d',
  '#666666',
]

export function communityColor(index) {
  if (index == null || index < 0) {
    return COMMUNITY_PALETTE[0]
  }
  return COMMUNITY_PALETTE[index % COMMUNITY_PALETTE.length]
}

// Betweenness is O(V*E); skip the computation on very large graphs so an
// expansion never freezes the UI. Such nodes keep a betweenness of 0.
export const BETWEENNESS_NODE_LIMIT = 1500

/**
 * Annotates a graphology graph in place with metric attributes used by the
 * "color by community" and "size by centrality" rendering modes:
 *   - community: integer community id from the Louvain algorithm
 *   - _betweenness: normalized betweenness centrality in [0, 1]
 *
 * Degree-based sizing is left to buildGraph; this only adds the attributes the
 * optional rendering modes read. Returns the number of distinct communities.
 */
export function annotateMetrics(graph) {
  if (!graph || graph.order === 0) {
    return 0
  }

  let communities = {}
  if (graph.size > 0) {
    communities = louvain(graph)
  }
  const distinct = new Set()
  graph.forEachNode((uid) => {
    const community = communities[uid] != null ? communities[uid] : 0
    distinct.add(community)
    graph.setNodeAttribute(uid, 'community', community)
  })

  let betweenness = {}
  if (graph.size > 0 && graph.order <= BETWEENNESS_NODE_LIMIT) {
    betweenness = betweennessCentrality(graph, { normalized: true })
  }
  graph.forEachNode((uid) => {
    graph.setNodeAttribute(uid, '_betweenness', betweenness[uid] || 0)
  })

  return distinct.size
}

/**
 * Resolves the rendered size of a node for the active "size by" mode. Degree
 * mode reuses the size buildGraph already stored (from connectivity), so
 * default rendering is unchanged. nodeSize/nodeMaxSize are passed in to keep
 * this module free of a circular dependency on buildGraph.
 */
export function metricNodeSize(sizeBy, attrs, nodeSize, nodeMaxSize) {
  if (sizeBy === 'uniform') {
    return nodeSize
  }
  if (sizeBy === 'betweenness') {
    const bc = attrs._betweenness || 0
    return nodeSize + bc * (nodeMaxSize - nodeSize)
  }
  // 'degree' (default): the size buildGraph computed from connectivity.
  return attrs.size
}
