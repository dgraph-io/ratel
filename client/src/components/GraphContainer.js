/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'

import EdgeProperties from 'components/EdgeProperties'
import NodeProperties from 'components/NodeProperties'
import PartialRenderInfo from 'components/PartialRenderInfo'

import GraphStylePanel from 'components/GraphStylePanel'
import MovablePanel from 'components/MovablePanel'
import SigmaGraph from 'components/SigmaGraph'

import { loadStyleRules, saveStyleRules } from '../lib/graphStyles'

import '../assets/css/Graph.scss'

const LAYOUTS = [
  ['force', 'Force'],
  ['circular', 'Circular'],
  ['circlepack', 'Packed'],
]

export default ({
  graphUpdateHack,
  edgesDataset,
  highlightPredicate,
  nodesDataset,
  onCollapseNode,
  onExpandNode,
  onSetPanelMinimized,
  onShowMoreNodes,
  onPanelResize,
  panelMinimized,
  panelHeight,
  panelWidth,
  remainingNodes,
  hiddenPredicates,
}) => {
  const [selectedNode, setSelectedNode] = React.useState(null)
  const [hoveredNode, setHoveredNode] = React.useState(null)

  const [hoveredEdge, setHoveredEdge] = React.useState(null)
  const [selectedEdge, setSelectedEdge] = React.useState(null)

  const [searchQuery, setSearchQuery] = React.useState('')
  const [searchFocused, setSearchFocused] = React.useState(false)

  const [layout, setLayout] = React.useState('force')
  const [styleRules, setStyleRules] = React.useState(loadStyleRules)
  const [stylePanelOpen, setStylePanelOpen] = React.useState(false)

  const handleStyleChange = (rules) => {
    setStyleRules(rules)
    saveStyleRules(rules)
  }

  const styleGroups = React.useMemo(() => {
    const groups = new Map()
    nodesDataset.forEach((node) => {
      if (node.group && !groups.has(node.group)) {
        groups.set(node.group, node.color || '#cccccc')
      }
    })
    return Array.from(groups, ([group, color]) => ({ group, color })).sort(
      (a, b) => a.group.localeCompare(b.group),
    )
    // graphUpdateHack changes when the (mutable) dataset Maps change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodesDataset, graphUpdateHack])

  const graphRef = React.useRef(null)

  const onEdgeSelected = (edge) => {
    setSelectedNode(null)
    setSelectedEdge(edge)
  }
  const onNodeSelected = (node) => {
    setSelectedEdge(null)
    setSelectedNode(node)
  }

  const activeNode = hoveredNode || selectedNode
  const activeEdge = !hoveredNode ? hoveredEdge || selectedEdge : null

  const handleSearch = (e) => {
    if (e.key !== 'Enter' || !graphRef.current) return
    const node = graphRef.current.searchNode(searchQuery)
    if (node) {
      graphRef.current.focusNode(node)
      onNodeSelected(node)
    }
  }

  const handleZoomToFit = () => {
    if (graphRef.current) graphRef.current.zoomToFit()
  }

  const nodeProps = () => (
    <NodeProperties
      node={activeNode}
      onCollapseNode={onCollapseNode}
      onExpandNode={onExpandNode}
    />
  )

  const edgeProps = () => (
    <EdgeProperties
      edge={activeEdge}
      onSelectSource={() => onNodeSelected(activeEdge.source)}
      onSelectTarget={() => onNodeSelected(activeEdge.target)}
    />
  )

  const renderPanelContent = () => {
    if (hoveredNode) return nodeProps()
    if (hoveredEdge) return edgeProps()
    if (selectedNode) return nodeProps()
    if (selectedEdge) return edgeProps()
    return null
  }

  return (
    <div className='graph-container'>
      <SigmaGraph
        ref={graphRef}
        edges={edgesDataset}
        highlightPredicate={highlightPredicate}
        nodes={nodesDataset}
        graphUpdateHack={graphUpdateHack}
        onEdgeHovered={setHoveredEdge}
        onEdgeSelected={onEdgeSelected}
        onNodeDoubleClicked={(node) =>
          !node.expanded ? onExpandNode(node.uid) : onCollapseNode(node.uid)
        }
        onNodeHovered={setHoveredNode}
        onNodeSelected={onNodeSelected}
        activeNode={activeNode}
        activeEdge={activeEdge}
        hoveredNode={hoveredNode}
        layout={layout}
        styleRules={styleRules}
        hiddenPredicates={hiddenPredicates}
      />

      {/* Graph toolbar: search + controls */}
      <div className='graph-toolbar'>
        <div className={`graph-search ${searchFocused ? 'focused' : ''}`}>
          <svg
            width='14'
            height='14'
            viewBox='0 0 16 16'
            fill='currentColor'
            className='search-icon'
          >
            <path d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z' />
          </svg>
          <input
            type='text'
            placeholder='Search nodes...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
        <button
          className='graph-control-btn'
          onClick={handleZoomToFit}
          title='Fit to screen'
        >
          <svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
            <path d='M1 1h5v1.5H2.5V5H1V1zm9 0h5v4h-1.5V2.5H10V1zM1 11h1.5v2.5H5V15H1v-4zm12.5 2.5V11H15v4h-4v-1.5h2.5z' />
          </svg>
        </button>
        <select
          className='graph-layout-select'
          aria-label='Graph layout'
          title='Graph layout'
          value={layout}
          onChange={(e) => setLayout(e.target.value)}
        >
          {LAYOUTS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          className='graph-control-btn'
          onClick={() => setStylePanelOpen(!stylePanelOpen)}
          title='Graph styles'
        >
          <svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
            <path d='M12.433 10.07C14.133 10.585 16 11.15 16 8a8 8 0 1 0-8 8c1.996 0 1.826-1.504 1.649-3.08-.124-1.101-.252-2.237.351-2.92.465-.527 1.42-.237 2.433.07zM4.5 9.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm1-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4-1a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3 3a1 1 0 1 1 0-2 1 1 0 0 1 0 2z' />
          </svg>
        </button>
      </div>

      {stylePanelOpen && (
        <GraphStylePanel
          groups={styleGroups}
          styleRules={styleRules}
          onChange={handleStyleChange}
          onClose={() => setStylePanelOpen(false)}
        />
      )}

      {/* Node/edge count indicator */}
      <div className='graph-stats'>
        {nodesDataset.size} nodes &middot; {edgesDataset.size} edges
        {remainingNodes > 0 && ` · ${remainingNodes} hidden`}
      </div>

      {!remainingNodes ? null : (
        <PartialRenderInfo
          remainingNodes={remainingNodes}
          onShowMoreNodes={onShowMoreNodes}
        />
      )}
      {(selectedNode || selectedEdge) && (
        <MovablePanel
          boundingSelector='.graph-container'
          collapsed={false}
          minimized={panelMinimized}
          title={null}
          height={panelHeight}
          width={panelWidth}
          onSetPanelMinimized={onSetPanelMinimized}
          onResize={onPanelResize}
        >
          {renderPanelContent()}
        </MovablePanel>
      )}
    </div>
  )
}
