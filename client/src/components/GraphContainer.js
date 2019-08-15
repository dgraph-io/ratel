// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";

import NodeProperties from "components/NodeProperties";
import PartialRenderInfo from "components/PartialRenderInfo";

import D3Graph from "components/D3Graph";
import MovablePanel from "components/MovablePanel";

import "../assets/css/Graph.scss";

export default ({
    graphUpdateHack,
    edgesDataset,
    highlightPredicate,
    hoveredNode,
    nodesDataset,
    onDeleteNode,
    onExpandNode,
    onSetPanelMinimized,
    onShowMoreNodes,
    onNodeHovered,
    onNodeSelected,
    onPanelResize,
    panelMinimized,
    panelHeight,
    panelWidth,
    remainingNodes,
    selectedNode,
}) => (
    <div className="graph-container">
        <D3Graph
            edges={edgesDataset}
            highlightPredicate={highlightPredicate}
            nodes={nodesDataset}
            graphUpdateHack={graphUpdateHack}
            onNodeDoubleClicked={node => onExpandNode(node.uid)}
            onNodeHovered={onNodeHovered}
            onNodeSelected={onNodeSelected}
        />
        {!remainingNodes ? null : (
            <PartialRenderInfo
                remainingNodes={remainingNodes}
                onExpandNetwork={onShowMoreNodes}
            />
        )}
        <MovablePanel
            boundingSelector=".graph-container"
            collapsed={!selectedNode}
            minimized={panelMinimized}
            title={
                selectedNode
                    ? null
                    : remainingNodes > 0
                    ? `Showing ${nodesDataset.size +
                          remainingNodes} nodes (${remainingNodes} hidden) and ${
                          edgesDataset.size
                      } edges`
                    : `Showing ${nodesDataset.size} nodes and ${edgesDataset.size} edges`
            }
            height={panelHeight}
            width={panelWidth}
            onSetPanelMinimized={onSetPanelMinimized}
            onResize={onPanelResize}
        >
            {selectedNode ? (
                <NodeProperties
                    node={hoveredNode || selectedNode}
                    onDeleteNode={onDeleteNode}
                    onExpandNode={onExpandNode}
                />
            ) : null}
        </MovablePanel>
    </div>
);
