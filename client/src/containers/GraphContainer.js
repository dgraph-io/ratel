import React from "react";

import NodeProperties from "../components/NodeProperties";
import PartialRenderInfo from "../components/PartialRenderInfo";

import D3Graph from "components/D3Graph";
import MovablePanel from "components/MovablePanel";

import "../assets/css/Graph.scss";

export default ({
    edgesDataset,
    highlightPredicate,
    nodesDataset,
    onExpandNode,
    onShowMoreNodes,
    onNodeHovered,
    onNodeSelected,
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
        {selectedNode ? (
            <MovablePanel boundingSelector=".graph-container">
                <NodeProperties
                    node={selectedNode}
                    onExpandNode={onExpandNode}
                />
            </MovablePanel>
        ) : null}
    </div>
);
