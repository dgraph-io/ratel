/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'

import EdgeProperties from 'components/EdgeProperties'
import NodeProperties from 'components/NodeProperties'
import PartialRenderInfo from 'components/PartialRenderInfo'

import GraphFilterPanel from 'components/GraphFilterPanel'
import GraphStatsPanel from 'components/GraphStatsPanel'
import GraphStylePanel from 'components/GraphStylePanel'
import MovablePanel from 'components/MovablePanel'
import SigmaGraph from 'components/SigmaGraph'
import { buildGraph } from 'components/SigmaGraph/buildGraph'

import {
  EMPTY_FILTER,
  collectAttributeKeys,
  nodeMatchesFilter,
} from '../lib/graphFilter'
import { summarizeGraph, topByAttribute } from '../lib/graphStats'
import { loadStyleRules, saveStyleRules } from '../lib/graphStyles'
import { timelineRange } from '../lib/graphTimeline'

import { downloadJSON, downloadPNG } from '../lib/exportGraph'

import '../assets/css/Graph.scss'

const LAYOUTS = [
  ['force', 'Force'],
  ['circular', 'Circular'],
  ['circlepack', 'Packed'],
]

const COLOR_BY = [
  ['group', 'Color: Predicate'],
  ['community', 'Color: Community'],
]

const SIZE_BY = [
  ['degree', 'Size: Degree'],
  ['betweenness', 'Size: Centrality'],
  ['uniform', 'Size: Uniform'],
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
  const [colorBy, setColorBy] = React.useState('group')
  const [sizeBy, setSizeBy] = React.useState('degree')
  const [styleRules, setStyleRules] = React.useState(loadStyleRules)
  const [stylePanelOpen, setStylePanelOpen] = React.useState(false)

  // Find-path: pick two nodes, highlight the shortest route between them.
  const [pathMode, setPathMode] = React.useState(false)
  const [pathSource, setPathSource] = React.useState(null)
  const [pathResult, setPathResult] = React.useState(null)
  const [pathMessage, setPathMessage] = React.useState(null)

  // Faceted filtering: hide nodes outside a degree range / attribute predicate.
  const [filter, setFilter] = React.useState(EMPTY_FILTER)
  const [filterPanelOpen, setFilterPanelOpen] = React.useState(false)

  // Read-only graph statistics panel.
  const [statsPanelOpen, setStatsPanelOpen] = React.useState(false)

  // Timeline: scrub/animate the graph by node timestamps.
  const [timeEnabled, setTimeEnabled] = React.useState(false)
  const [timeCutoff, setTimeCutoff] = React.useState(null)
  const [playing, setPlaying] = React.useState(false)

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

  const attributeKeys = React.useMemo(
    () => collectAttributeKeys(nodesDataset),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodesDataset, graphUpdateHack],
  )

  const timeRange = React.useMemo(
    () => timelineRange(nodesDataset),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodesDataset, graphUpdateHack],
  )

  // Node degree from the edge dataset, tolerating either uid-string or
  // resolved-object endpoints, used to preview how many nodes the filter hides.
  const hiddenCount = React.useMemo(() => {
    const endpointId = (x) => (x && typeof x === 'object' ? x.id || x.uid : x)
    const degree = new Map()
    edgesDataset.forEach((edge) => {
      ;[endpointId(edge.source), endpointId(edge.target)].forEach((id) => {
        degree.set(id, (degree.get(id) || 0) + 1)
      })
    })
    let hidden = 0
    nodesDataset.forEach((node) => {
      const id = node.id || node.uid
      if (!nodeMatchesFilter(node, degree.get(id) || 0, filter)) {
        hidden++
      }
    })
    return hidden
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodesDataset, edgesDataset, filter, graphUpdateHack])

  // Snapshot of the currently visible graph for the stats panel. Building
  // a second graphology graph (rather than reaching into the Sigma instance)
  // keeps the renderer unaware of the stats consumer and avoids the cost of
  // remounting it whenever the panel opens.
  const statsGraph = React.useMemo(() => {
    if (!statsPanelOpen) {
      return null
    }
    return buildGraph(nodesDataset, edgesDataset)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodesDataset, edgesDataset, graphUpdateHack, statsPanelOpen])

  const statsSummary = React.useMemo(
    () => (statsGraph ? summarizeGraph(statsGraph) : null),
    [statsGraph],
  )

  const topByDegree = React.useMemo(
    () => (statsGraph ? topByAttribute(statsGraph, 'degree', 5) : []),
    [statsGraph],
  )

  const topByBetweenness = React.useMemo(
    () =>
      statsGraph && statsGraph.order > 0 && statsGraph.order <= 1500
        ? topByAttribute(statsGraph, '_betweenness', 5)
        : [],
    [statsGraph],
  )

  const graphRef = React.useRef(null)

  const onEdgeSelected = (edge) => {
    setSelectedNode(null)
    setSelectedEdge(edge)
  }
  const onNodeSelected = (node) => {
    if (pathMode && node) {
      handlePathPick(node)
      return
    }
    setSelectedEdge(null)
    setSelectedNode(node)
  }

  const clearPath = () => {
    setPathSource(null)
    setPathResult(null)
    setPathMessage(null)
  }

  const togglePathMode = () => {
    clearPath()
    setPathMode((on) => !on)
  }

  const nodeKey = (node) => node.id || node.uid
  const nodeName = (node) => node.label || node.uid || node.id

  const handlePathPick = (node) => {
    if (!pathSource) {
      setPathResult(null)
      setPathSource(node)
      setPathMessage(`From “${nodeName(node)}” — now pick a target`)
      return
    }
    if (nodeKey(node) === nodeKey(pathSource)) {
      return
    }
    const result = graphRef.current?.findPathBetween(
      nodeKey(pathSource),
      nodeKey(node),
    )
    if (result) {
      setPathResult(result)
      setPathMessage(
        `${result.hops} hop${result.hops === 1 ? '' : 's'} from ` +
          `“${nodeName(pathSource)}” to “${nodeName(node)}”`,
      )
    } else {
      setPathResult(null)
      setPathMessage('No path between those nodes in the current graph')
    }
    setPathSource(null)
  }

  const toggleTimeline = () => {
    setPlaying(false)
    setTimeEnabled((on) => {
      const next = !on
      if (next && timeRange.available) {
        setTimeCutoff(timeRange.max)
      }
      return next
    })
  }

  const togglePlay = () => {
    if (!timeRange.available) return
    if (!playing && (timeCutoff == null || timeCutoff >= timeRange.max)) {
      setTimeCutoff(timeRange.min)
    }
    setPlaying((p) => !p)
  }

  // Advance the scrubber while playing, ~7s end to end, stopping at the end.
  React.useEffect(() => {
    if (!playing || !timeRange.available) return undefined
    const step = Math.max(1, (timeRange.max - timeRange.min) / 120)
    const id = window.setInterval(() => {
      setTimeCutoff((prev) => {
        const base = prev == null ? timeRange.min : prev
        const next = base + step
        if (next >= timeRange.max) {
          setPlaying(false)
          return timeRange.max
        }
        return next
      })
    }, 60)
    return () => window.clearInterval(id)
  }, [playing, timeRange])

  // Reset the scrubber when the dataset's time span changes underneath it.
  React.useEffect(() => {
    if (timeEnabled && timeRange.available) {
      setTimeCutoff((prev) =>
        prev == null || prev < timeRange.min || prev > timeRange.max
          ? timeRange.max
          : prev,
      )
    }
  }, [timeEnabled, timeRange])

  const formatTime = (ms) => {
    const date = new Date(ms)
    const intraday = timeRange.max - timeRange.min < 2 * 24 * 3600 * 1000
    return intraday ? date.toLocaleString() : date.toLocaleDateString()
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
        colorBy={colorBy}
        sizeBy={sizeBy}
        styleRules={styleRules}
        hiddenPredicates={hiddenPredicates}
        filter={filter}
        pathNodes={pathResult?.nodes}
        pathEdges={pathResult?.edges}
        timeCutoff={timeEnabled && timeRange.available ? timeCutoff : null}
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
          type='button'
          className='graph-control-btn'
          onClick={handleZoomToFit}
          title='Fit to screen'
          aria-label='Fit to screen'
        >
          <svg
            width='16'
            height='16'
            viewBox='0 0 16 16'
            fill='currentColor'
            role='img'
            aria-hidden='true'
          >
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
        <select
          className='graph-layout-select'
          aria-label='Color nodes by'
          title='Color nodes by'
          value={colorBy}
          onChange={(e) => setColorBy(e.target.value)}
        >
          {COLOR_BY.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className='graph-layout-select'
          aria-label='Size nodes by'
          title='Size nodes by'
          value={sizeBy}
          onChange={(e) => setSizeBy(e.target.value)}
        >
          {SIZE_BY.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type='button'
          className='graph-control-btn'
          onClick={() => setStylePanelOpen(!stylePanelOpen)}
          title='Graph styles'
          aria-label='Graph styles'
          aria-pressed={stylePanelOpen}
        >
          <svg
            width='16'
            height='16'
            viewBox='0 0 16 16'
            fill='currentColor'
            role='img'
            aria-hidden='true'
          >
            <path d='M12.433 10.07C14.133 10.585 16 11.15 16 8a8 8 0 1 0-8 8c1.996 0 1.826-1.504 1.649-3.08-.124-1.101-.252-2.237.351-2.92.465-.527 1.42-.237 2.433.07zM4.5 9.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm1-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4-1a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3 3a1 1 0 1 1 0-2 1 1 0 0 1 0 2z' />
          </svg>
        </button>
        <button
          type='button'
          className='graph-control-btn'
          onClick={(e) => {
            const container = e.currentTarget.closest('.graph-container')
            if (container) {
              downloadPNG(container)
            }
          }}
          title='Download graph as PNG'
          aria-label='Download graph as PNG'
        >
          <svg
            width='16'
            height='16'
            viewBox='0 0 16 16'
            fill='currentColor'
            role='img'
            aria-hidden='true'
          >
            <path d='M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z' />
            <path d='M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z' />
          </svg>
        </button>
        <button
          type='button'
          className='graph-control-btn'
          onClick={() => downloadJSON(nodesDataset, edgesDataset)}
          title='Download nodes and edges as JSON'
          aria-label='Download nodes and edges as JSON'
        >
          <svg
            width='16'
            height='16'
            viewBox='0 0 16 16'
            fill='currentColor'
            role='img'
            aria-hidden='true'
          >
            <path d='M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z' />
            <path d='M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z' />
          </svg>
        </button>
        <button
          type='button'
          className={`graph-control-btn ${pathMode ? 'active' : ''}`}
          onClick={togglePathMode}
          title='Find path between two nodes'
          aria-label='Find path between two nodes'
          aria-pressed={pathMode}
        >
          <svg
            width='16'
            height='16'
            viewBox='0 0 16 16'
            fill='currentColor'
            role='img'
            aria-hidden='true'
          >
            <path d='M3.5 13a2.5 2.5 0 1 1 1.972-.965l1.62 1.62a2.5 2.5 0 0 1 2.787.013l2.043-2.043A2.5 2.5 0 1 1 16 9.5a2.5 2.5 0 0 1-3.94 2.04l-2.043 2.044a2.5 2.5 0 1 1-4.516.022l-1.62-1.62A2.49 2.49 0 0 1 3.5 13zm0-1.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm10-3a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z' />
          </svg>
        </button>
        <button
          type='button'
          className={`graph-control-btn ${filterPanelOpen ? 'active' : ''}`}
          onClick={() => setFilterPanelOpen(!filterPanelOpen)}
          title='Filter nodes'
          aria-label='Filter nodes'
          aria-pressed={filterPanelOpen}
        >
          <svg
            width='16'
            height='16'
            viewBox='0 0 16 16'
            fill='currentColor'
            role='img'
            aria-hidden='true'
          >
            <path d='M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z' />
          </svg>
        </button>
        <button
          type='button'
          className={`graph-control-btn ${statsPanelOpen ? 'active' : ''}`}
          onClick={() => setStatsPanelOpen(!statsPanelOpen)}
          title='Graph statistics'
          aria-label='Graph statistics'
          aria-pressed={statsPanelOpen}
        >
          <svg
            width='16'
            height='16'
            viewBox='0 0 16 16'
            fill='currentColor'
            role='img'
            aria-hidden='true'
          >
            <path d='M2 13h2v1H2v-1zm0-3h2v2H2v-2zm0-3h2v2H2V7zm0-3h2v2H2V4zm4 6h2v4H6v-4zm0-3h2v2H6V7zm0-3h2v2H6V4zm4 6h2v4h-2v-4zm0-3h2v2h-2V7zm0-3h2v2h-2V4zm4 9h2v1h-2v-1zm0-3h2v2h-2v-2zm0-3h2v2h-2V7zm0-3h2v2h-2V4z' />
          </svg>
        </button>
        {timeRange.available && (
          <button
            type='button'
            className={`graph-control-btn ${timeEnabled ? 'active' : ''}`}
            onClick={toggleTimeline}
            title='Timeline'
            aria-label='Timeline'
            aria-pressed={timeEnabled}
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 16 16'
              fill='currentColor'
              role='img'
              aria-hidden='true'
            >
              <path d='M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z' />
              <path d='M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z' />
            </svg>
          </button>
        )}
      </div>

      {stylePanelOpen && (
        <GraphStylePanel
          groups={styleGroups}
          styleRules={styleRules}
          onChange={handleStyleChange}
          onClose={() => setStylePanelOpen(false)}
        />
      )}

      {filterPanelOpen && (
        <GraphFilterPanel
          attributeKeys={attributeKeys}
          filter={filter}
          hiddenCount={hiddenCount}
          onChange={setFilter}
          onClose={() => setFilterPanelOpen(false)}
        />
      )}

      {statsPanelOpen && (
        <GraphStatsPanel
          summary={statsSummary}
          topByDegree={topByDegree}
          topByBetweenness={topByBetweenness}
          onClose={() => setStatsPanelOpen(false)}
        />
      )}

      {/* Node/edge count indicator */}
      <div className='graph-stats'>
        {nodesDataset.size} nodes &middot; {edgesDataset.size} edges
        {remainingNodes > 0 && ` · ${remainingNodes} hidden`}
      </div>

      {pathMode && (
        <div className='graph-path-banner'>
          <span className='graph-path-banner-text'>
            {pathMessage || 'Pick a source node, then a target'}
          </span>
          {pathResult && (
            <button
              type='button'
              className='graph-path-banner-clear'
              onClick={clearPath}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {timeEnabled && timeRange.available && (
        <div className='graph-timeline'>
          <button
            type='button'
            className='graph-timeline__play'
            onClick={togglePlay}
            title={playing ? 'Pause' : 'Play'}
          >
            {playing ? '❚❚' : '▶'}
          </button>
          <input
            type='range'
            className='graph-timeline__slider'
            aria-label='Timeline'
            min={timeRange.min}
            max={timeRange.max}
            value={timeCutoff == null ? timeRange.max : timeCutoff}
            onChange={(e) => {
              setPlaying(false)
              setTimeCutoff(Number(e.target.value))
            }}
          />
          <span className='graph-timeline__label'>
            {formatTime(timeCutoff == null ? timeRange.max : timeCutoff)}
          </span>
        </div>
      )}

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
