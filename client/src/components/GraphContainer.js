// Copyright 2017-2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
    onCollapseNode,
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
            onNodeDoubleClicked={node =>
                !node.expanded
                    ? onExpandNode(node.uid)
                    : onCollapseNode(node.uid)
            }
            onNodeHovered={onNodeHovered}
            onNodeSelected={onNodeSelected}
        />
        {!remainingNodes ? null : (
            <PartialRenderInfo
                remainingNodes={remainingNodes}
                onShowMoreNodes={onShowMoreNodes}
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
                    onCollapseNode={onCollapseNode}
                    onDeleteNode={onDeleteNode}
                    onExpandNode={onExpandNode}
                />
            ) : null}
        </MovablePanel>
    </div>
);
