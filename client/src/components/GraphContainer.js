import React from "react";

import NodeProperties from "components/NodeProperties";
import PartialRenderInfo from "components/PartialRenderInfo";

import D3Graph from "components/D3Graph";
import MovablePanel from "components/MovablePanel";

import "../assets/css/Graph.scss";

export default ({
    edgesDataset,
    highlightPredicate,
    hoveredNode,
    nodesDataset,
    onExpandNode,
    onSetPanelMinimized,
    onShowMoreNodes,
    onNodeHovered,
    onNodeSelected,
    onPanelResize,
    panelMinimized,
    panelHeight,
    panelWidth,
    parsedResponse,
    selectedNode,
}) => (
    <div className="graph-container">
        <D3Graph
            edges={edgesDataset}
            highlightPredicate={highlightPredicate}
            nodes={nodesDataset}
            onNodeDoubleClicked={node => onExpandNode(node.uid)}
            onNodeHovered={onNodeHovered}
            onNodeSelected={onNodeSelected}
        />
        <PartialRenderInfo
            canExpand={parsedResponse.remainingNodes > 0}
            remainingNodes={parsedResponse.remainingNodes}
            onExpandNetwork={onShowMoreNodes}
        />
        <MovablePanel
            boundingSelector=".graph-container"
            collapsed={!selectedNode}
            minimized={panelMinimized}
            title={
                selectedNode
                    ? null
                    : parsedResponse.remainingNodes > 0
                    ? `Showing ${nodesDataset.length +
                          parsedResponse.remainingNodes} nodes (${
                          parsedResponse.remainingNodes
                      } hidden) and ${edgesDataset.length} edges`
                    : `Showing ${nodesDataset.length} nodes and ${
                          edgesDataset.length
                      } edges`
            }
            height={panelHeight}
            width={panelWidth}
            onSetPanelMinimized={onSetPanelMinimized}
            onResize={onPanelResize}
        >
            {selectedNode ? (
                <NodeProperties
                    node={hoveredNode || selectedNode}
                    onExpandNode={onExpandNode}
                />
            ) : null}
        </MovablePanel>
    </div>
);
