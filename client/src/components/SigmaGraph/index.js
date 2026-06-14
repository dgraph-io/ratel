/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import EdgeCurveProgram, { EdgeCurvedArrowProgram } from '@sigma/edge-curve'
import { circlepack, circular } from 'graphology-layout'
import FA2Layout from 'graphology-layout-forceatlas2/worker'
import React from 'react'
import Sigma from 'sigma'
import { EdgeArrowProgram } from 'sigma/rendering'

import { buildGraph } from './buildGraph'

import './SigmaGraph.scss'

const LAYOUT_MS = 4000
const DIM_COLOR = '#e4e4e4'

// WebGL renderer for query results, replacing the d3-force canvas renderer.
// Same contract as the old D3Graph component: nodes/edges are the live Maps
// from GraphParser, callbacks receive the original node/edge objects.
export default class SigmaGraph extends React.Component {
  containerRef = React.createRef()

  componentDidMount() {
    this.graph = buildGraph(this.props.nodes, this.props.edges)

    this.renderer = new Sigma(this.graph, this.containerRef.current, {
      defaultEdgeType: 'arrow',
      edgeProgramClasses: {
        arrow: EdgeArrowProgram,
        curved: EdgeCurveProgram,
        curvedArrow: EdgeCurvedArrowProgram,
      },
      enableEdgeEvents: true,
      renderEdgeLabels: true,
      labelDensity: 0.8,
      labelGridCellSize: 80,
      labelFont: 'sans-serif',
      labelSize: 12,
      edgeLabelSize: 10,
      labelRenderedSizeThreshold: 5,
      minCameraRatio: 0.05,
      maxCameraRatio: 20,
      nodeReducer: this.nodeReducer,
      edgeReducer: this.edgeReducer,
    })

    this.bindEvents()
    this.startLayout()

    this.datasetSignature = this.signature(this.props)
  }

  componentDidUpdate(prevProps) {
    const signature = this.signature(this.props)
    if (signature !== this.datasetSignature) {
      this.datasetSignature = signature
      this.syncGraph()
    } else if (prevProps.layout !== this.props.layout) {
      this.applyLayout()
    } else {
      // Only selection/highlight/style/filter props changed.
      this.renderer.refresh({ skipIndexation: true })
    }
  }

  componentWillUnmount() {
    this.stopLayout()
    if (this.renderer) {
      this.renderer.kill()
    }
  }

  signature = (props) =>
    [
      props.nodes ? props.nodes.size : 0,
      props.edges ? props.edges.size : 0,
      props.graphUpdateHack,
    ].join('/')

  // --- public API used via ref by GraphContainer -----------------------

  zoomToFit = () => {
    if (this.renderer) {
      this.renderer.getCamera().animatedReset({ duration: 500 })
    }
  }

  focusNode = (node) => {
    if (!this.renderer || !node) {
      return
    }
    const uid = node.id || node.uid
    if (!this.graph.hasNode(uid)) {
      return
    }
    const { x, y } = this.renderer.getNodeDisplayData(uid)
    this.renderer.getCamera().animate({ x, y, ratio: 0.35 }, { duration: 500 })
  }

  searchNode = (query) => {
    if (!query || !this.props.nodes) {
      return null
    }
    const q = query.toLowerCase().trim()
    let found = null
    this.props.nodes.forEach((n) => {
      if (found) {
        return
      }
      const name = (n.name || n.label || '').toLowerCase()
      const uid = (n.uid || n.id || '').toLowerCase()
      if (name.includes(q) || uid === q) {
        found = n
      }
    })
    return found
  }

  syncGraph = () => {
    // Carry positions over so expanding/collapsing doesn't reshuffle nodes
    // the user already arranged.
    const prevPositions = new Map()
    this.graph.forEachNode((uid, attrs) =>
      prevPositions.set(uid, { x: attrs.x, y: attrs.y }),
    )

    const next = buildGraph(this.props.nodes, this.props.edges, prevPositions)
    this.graph.clear()
    this.graph.import(next)
    this.applyLayout()
  }

  applyLayout = () => {
    const layout = this.props.layout || 'force'
    this.stopLayout()
    if (layout === 'circular') {
      circular.assign(this.graph, { scale: 100 })
      this.renderer.refresh()
      this.zoomToFit()
    } else if (layout === 'circlepack') {
      circlepack.assign(this.graph, { hierarchyAttributes: ['group'] })
      this.renderer.refresh()
      this.zoomToFit()
    } else {
      this.startLayout()
    }
  }

  startLayout = () => {
    this.stopLayout()
    if (this.graph.order < 2) {
      return
    }

    this.layout = new FA2Layout(this.graph, {
      settings: {
        gravity: 1,
        scalingRatio: 12,
        slowDown: 5,
        strongGravityMode: true,
        edgeWeightInfluence: 0,
      },
    })
    this.layout.start()
    this.layoutTimer = window.setTimeout(this.stopLayout, LAYOUT_MS)
  }

  stopLayout = () => {
    if (this.layoutTimer) {
      window.clearTimeout(this.layoutTimer)
      this.layoutTimer = null
    }
    if (this.layout) {
      this.layout.kill()
      this.layout = null
    }
  }

  // --- highlighting ---------------------------------------------------

  hoveredNode = null

  isHidden = (group) => {
    const { hiddenPredicates } = this.props
    return !!hiddenPredicates && hiddenPredicates.has(group)
  }

  nodeReducer = (uid, attrs) => {
    const { activeNode, styleRules } = this.props
    const res = { ...attrs }
    const group = attrs.originalNode && attrs.originalNode.group

    if (this.isHidden(group)) {
      res.hidden = true
      return res
    }

    const rule = styleRules && styleRules[group]
    if (rule) {
      if (rule.color) {
        res.color = rule.color
      }
      if (rule.size) {
        res.size = rule.size
      }
    }

    if (activeNode && attrs.originalNode === activeNode) {
      res.highlighted = true
    }

    if (this.hoveredNode && uid !== this.hoveredNode) {
      if (!this.graph.areNeighbors(uid, this.hoveredNode)) {
        res.color = DIM_COLOR
        res.label = null
      }
    }
    return res
  }

  edgeReducer = (key, attrs) => {
    const { activeEdge, highlightPredicate, styleRules } = this.props
    const res = { ...attrs }
    const edge = attrs.originalEdge

    if (this.isHidden(edge.predicate)) {
      res.hidden = true
      return res
    }

    const rule = styleRules && styleRules[edge.predicate]
    if (rule && rule.color) {
      res.color = rule.color
    }

    if (highlightPredicate && edge.predicate === highlightPredicate) {
      res.size = attrs.size * 2
    }
    if (activeEdge && edge === activeEdge) {
      res.size = attrs.size * 2.5
      res.zIndex = 1
    }
    if (this.hoveredNode) {
      const [source, target] = this.graph.extremities(key)
      if (source !== this.hoveredNode && target !== this.hoveredNode) {
        res.color = DIM_COLOR
        res.label = null
      }
    }
    return res
  }

  // --- events ----------------------------------------------------------

  bindEvents = () => {
    const renderer = this.renderer

    renderer.on('enterNode', ({ node }) => {
      this.hoveredNode = node
      this.props.onNodeHovered(this.originalNode(node))
      renderer.refresh({ skipIndexation: true })
    })
    renderer.on('leaveNode', () => {
      this.hoveredNode = null
      this.props.onNodeHovered(null)
      renderer.refresh({ skipIndexation: true })
    })
    renderer.on('clickNode', ({ node }) =>
      this.props.onNodeSelected(this.originalNode(node)),
    )
    renderer.on('doubleClickNode', (e) => {
      e.preventSigmaDefault()
      this.props.onNodeDoubleClicked(this.originalNode(e.node))
    })

    renderer.on('enterEdge', ({ edge }) =>
      this.props.onEdgeHovered(this.originalEdge(edge)),
    )
    renderer.on('leaveEdge', () => this.props.onEdgeHovered(null))
    renderer.on('clickEdge', ({ edge }) =>
      this.props.onEdgeSelected(this.originalEdge(edge)),
    )

    renderer.on('clickStage', () => this.props.onNodeSelected(null))

    // Node dragging.
    renderer.on('downNode', (e) => {
      this.draggedNode = e.node
      if (!renderer.getCustomBBox()) {
        renderer.setCustomBBox(renderer.getBBox())
      }
    })
    renderer.on('moveBody', ({ event }) => {
      if (!this.draggedNode) {
        return
      }
      const pos = renderer.viewportToGraph(event)
      this.graph.setNodeAttribute(this.draggedNode, 'x', pos.x)
      this.graph.setNodeAttribute(this.draggedNode, 'y', pos.y)

      event.preventSigmaDefault()
      event.original.preventDefault()
      event.original.stopPropagation()
    })
    const endDrag = () => (this.draggedNode = null)
    renderer.on('upNode', endDrag)
    renderer.on('upStage', endDrag)
  }

  originalNode = (uid) => this.graph.getNodeAttribute(uid, 'originalNode')
  originalEdge = (key) => this.graph.getEdgeAttribute(key, 'originalEdge')

  render() {
    return <div ref={this.containerRef} className='sigma-graph-outer' />
  }
}
