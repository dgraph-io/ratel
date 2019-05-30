// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import { connect } from "react-redux";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";

import FrameCodeTab from "components/FrameCodeTab";
import GraphContainer from "components/GraphContainer";
import EntitySelector from "components/EntitySelector";
import GraphIcon from "components/GraphIcon";

import { updateFramesTab } from "actions/frames";
import { setPanelMinimized, setPanelSize } from "actions/ui";

function FrameSession(props) {
    const {
        activeTab,
        frame,
        graphParser,
        tabResult,
        handlePanelResize,
        handleSetPanelMinimized,
        highlightPredicate,
        hoveredNode,
        onDeleteNode,
        onExpandNode,
        onShowMoreNodes,
        onNodeHovered,
        onNodeSelected,
        panelMinimized,
        panelHeight,
        panelWidth,
        selectedNode,
        updateFramesTab,
        onAxisHovered,
    } = props;

    const toolButton = (id, icon, title) => (
        <Tab
            eventKey={id}
            title={
                <span>
                    <div className="icon-container">{icon}</div>
                    {title}
                </span>
            }
        />
    );

    const renderToolbar = currentTab => (
        <Tabs
            className="toolbar"
            id="frame-session-tabs"
            activeKey={currentTab}
            onSelect={updateFramesTab}
        >
            {toolButton("graph", <GraphIcon />, "Graph")}
            {toolButton("code", <i className="icon fa fa-code" />, "JSON")}
        </Tabs>
    );

    const currentTab = activeTab === "tree" ? "graph" : activeTab;
    const graph = graphParser.getCurrentGraph();

    return (
        <div className="body">
            {renderToolbar(currentTab)}
            {currentTab === "graph" && graph ? (
                <GraphContainer
                    edgesDataset={graph.edges}
                    highlightPredicate={highlightPredicate}
                    hoveredNode={hoveredNode}
                    onShowMoreNodes={onShowMoreNodes}
                    nodesDataset={graph.nodes}
                    onDeleteNode={onDeleteNode}
                    onExpandNode={onExpandNode}
                    onNodeHovered={onNodeHovered}
                    onNodeSelected={onNodeSelected}
                    onSetPanelMinimized={handleSetPanelMinimized}
                    onPanelResize={handlePanelResize}
                    panelMinimized={panelMinimized}
                    panelHeight={panelHeight}
                    panelWidth={panelWidth}
                    remainingNodes={graph.remainingNodes}
                    selectedNode={selectedNode}
                />
            ) : null}

            {currentTab === "code" ? (
                <FrameCodeTab code={tabResult.response} />
            ) : null}

            {currentTab === "userQuery" ? (
                <FrameCodeTab code={frame.query} mode="graphql" />
            ) : null}

            {currentTab === "graph" && graph ? (
                <EntitySelector
                    graphLabels={graph.labels}
                    onAxisHovered={onAxisHovered}
                />
            ) : null}
        </div>
    );
}

const mapStateToProps = ({ ui }) => ({
    panelMinimized: ui.panelMinimized,
    panelHeight: ui.panelHeight,
    panelWidth: ui.panelWidth,
});

function mapDispatchToProps(dispatch) {
    return {
        handlePanelResize: panelSize => dispatch(setPanelSize(panelSize)),
        handleSetPanelMinimized: minimized =>
            dispatch(setPanelMinimized(minimized)),
        updateFramesTab: tab => dispatch(updateFramesTab(tab)),
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(FrameSession);
