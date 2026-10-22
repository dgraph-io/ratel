/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'

import EdgeProperties from 'components/EdgeProperties'
import NodeProperties from 'components/NodeProperties'
import PartialRenderInfo from 'components/PartialRenderInfo'

import D3Graph from 'components/D3Graph'
import MovablePanel from 'components/MovablePanel'

import { downloadJSON, downloadPNG } from '../lib/exportGraph'

import '../assets/css/Graph.scss'

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
}) => {
  const [selectedNode, setSelectedNode] = React.useState(null)
  const [hoveredNode, setHoveredNode] = React.useState(null)

  const [hoveredEdge, setHoveredEdge] = React.useState(null)
  const [selectedEdge, setSelectedEdge] = React.useState(null)

  const [searchQuery, setSearchQuery] = React.useState('')
  const [searchFocused, setSearchFocused] = React.useState(false)

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
      <D3Graph
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
        <button
          className='graph-control-btn'
          onClick={(e) => {
            const container = e.currentTarget.closest('.graph-container')
            if (container) {
              downloadPNG(container)
            }
          }}
          title='Download graph as PNG'
        >
          <svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
            <path d='M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z' />
            <path d='M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z' />
          </svg>
        </button>
        <button
          className='graph-control-btn'
          onClick={() => downloadJSON(nodesDataset, edgesDataset)}
          title='Download nodes and edges as JSON'
        >
          <svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
            <path d='M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z' />
            <path d='M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z' />
          </svg>
        </button>
      </div>

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
