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

import EdgeProperties from "components/EdgeProperties";
import NodeProperties from "components/NodeProperties";
import PartialRenderInfo from "components/PartialRenderInfo";

import D3Graph from "components/D3Graph";
import MovablePanel from "components/MovablePanel";

import "../assets/css/Graph.scss";

export default ({
    graphUpdateHack,
    edgesDataset,
    highlightPredicate,
    nodesDataset,
    onCollapseNode,
    onDeleteNode,
    onExpandNode,
    onSetPanelMinimized,
    onShowMoreNodes,
    onPanelResize,
    panelMinimized,
    panelHeight,
    panelWidth,
    remainingNodes,
}) => {
    const [selectedNode, setSelectedNode] = React.useState(null);
    const [hoveredNode, setHoveredNode] = React.useState(null);

    const [hoveredEdge, setHoveredEdge] = React.useState(null);
    const [selectedEdge, setSelectedEdge] = React.useState(null);

    const onEdgeSelected = edge => {
        setSelectedNode(null);
        setSelectedEdge(edge);
    };
    const onNodeSelected = node => {
        setSelectedEdge(null);
        setSelectedNode(node);
    };

    const activeNode = hoveredNode || selectedNode;
    const activeEdge = !hoveredNode ? hoveredEdge || selectedEdge : null;

    const nodeProps = () => (
        <NodeProperties
            node={activeNode}
            onCollapseNode={onCollapseNode}
            onDeleteNode={onDeleteNode}
            onExpandNode={onExpandNode}
        />
    );

    const edgeProps = () => (
        <EdgeProperties
            edge={activeEdge}
            onSelectSource={() => onNodeSelected(activeEdge.source)}
            onSelectTarget={() => onNodeSelected(activeEdge.target)}
        />
    );

    const renderPanelContent = () => {
        if (hoveredNode) {
            return nodeProps();
        }
        if (hoveredEdge) {
            return edgeProps();
        }
        if (selectedNode) {
            return nodeProps();
        }
        if (selectedEdge) {
            return edgeProps();
        }
        return null;
    };

    const panelContent = renderPanelContent();

    return (
        <div className="graph-container">
            <D3Graph
                edges={edgesDataset}
                highlightPredicate={highlightPredicate}
                nodes={nodesDataset}
                graphUpdateHack={graphUpdateHack}
                onEdgeHovered={setHoveredEdge}
                onEdgeSelected={onEdgeSelected}
                onNodeDoubleClicked={node =>
                    !node.expanded
                        ? onExpandNode(node.uid)
                        : onCollapseNode(node.uid)
                }
                onNodeHovered={setHoveredNode}
                onNodeSelected={onNodeSelected}
                activeNode={activeNode}
                activeEdge={activeEdge}
            />
            {!remainingNodes ? null : (
                <PartialRenderInfo
                    remainingNodes={remainingNodes}
                    onShowMoreNodes={onShowMoreNodes}
                />
            )}
            <MovablePanel
                boundingSelector=".graph-container"
                collapsed={!selectedNode && !selectedEdge}
                minimized={panelMinimized}
                title={
                    panelContent
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
                {renderPanelContent()}
            </MovablePanel>
        </div>
    );
};
