// Copyright 2018-2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import memoize from "memoize-one";
import { connect } from "react-redux";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";

import { updateFramesTab } from "actions/frames";
import { setPanelMinimized, setPanelSize } from "actions/ui";

import FrameCodeTab from "components/FrameCodeTab";
import GraphContainer from "components/GraphContainer";
import EntitySelector from "components/EntitySelector";
import GraphIcon from "components/GraphIcon";
import { executeQuery } from "lib/helpers";
import { GraphParser } from "lib/graph";

const getGraphParser = memoize(response => {
    if (!response) {
        return new GraphParser();
    }
    const graphParser = new GraphParser();
    // TODO: add support for custom name regex in UI
    const regexStr = "Name";

    graphParser.addResponseToQueue(response.data);
    graphParser.processQueue(regexStr);
    return graphParser;
});

function FrameSession(props) {
    // TODO: updating graphUpdateHack will force Graphcontainer > D3Graph
    // to re-render, and before render it will refresh nodes/edges dataset.
    // When GraphParser creates a new node or edge the d3 renderer needs to
    // be notified, because they share nodes/edges arrays.
    // But right now d3 renderer and graphParser live in different components.
    // There's no way to send this notification.
    // Most likely solution - make d3 force layout a part of graphParser,
    // that way graphParser will be able to control/update it.
    const [graphUpdateHack, setGraphUpdateHack] = React.useState("");

    const {
        activeTab,
        frame,
        tabResult,
        handlePanelResize,
        handleSetPanelMinimized,
        highlightPredicate,
        hoveredNode,
        onDeleteNode,
        onNodeHovered,
        onNodeSelected,
        panelMinimized,
        panelHeight,
        panelWidth,
        selectedNode,
        updateFramesTab,
        onAxisHovered,
    } = props;

    const graphParser =
        frame.action === "query" &&
        getGraphParser(tabResult && tabResult.response);

    const forceReRender = () => {
        const graph = graphParser.getCurrentGraph();
        setGraphUpdateHack(
            `${Date.now()} ${graph.edges.length} ${graph.nodes.length}`,
        );
    };

    const onShowMoreNodes = () => {
        graphParser.processQueue();
        forceReRender();
    };

    const handleCollapseNode = uid => {
        graphParser.collapseNode(uid);
        forceReRender();
    };

    const handleExpandNode = async uid => {
        const { url } = props;
        const query = `{
          node(func:uid(${uid})) {
            uid
            expand(_all_) {
              uid
              expand(_all_)
            }
          }
        }`;
        try {
            const { data } = await executeQuery(url.url, query, {
                action: "query",
                debug: true,
            });
            sendNodesToGraphParser(data, uid);
        } catch (error) {
            // Ignore errors and exceptions on this RPC.
            console.error(error);
        }
    };

    const sendNodesToGraphParser = (data, expansionNode) => {
        graphParser.addResponseToQueue(data, expansionNode);
        graphParser.processQueue("Name");
        forceReRender();
    };

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

    const currentTab = activeTab === "tree" ? "graph" : activeTab;
    const graph = graphParser && graphParser.getCurrentGraph();

    const renderToolbar = () => (
        <Tabs
            className="toolbar"
            id="frame-session-tabs"
            activeKey={currentTab}
            onSelect={updateFramesTab}
        >
            {frame.action !== "mutate" &&
                toolButton("graph", <GraphIcon />, "Graph")}

            {frame.action !== "mutate" &&
                toolButton("code", <i className="icon fa fa-code" />, "JSON")}

            {frame.action === "mutate" &&
                toolButton(
                    "mutate",
                    <i className="icon fa fa-code" />,
                    "Response",
                )}
        </Tabs>
    );

    return (
        <div className="body">
            {renderToolbar()}
            {currentTab === "graph" && graph ? (
                <React.Fragment>
                    <GraphContainer
                        graphUpdateHack={graphUpdateHack}
                        edgesDataset={graph.edges}
                        highlightPredicate={highlightPredicate}
                        hoveredNode={hoveredNode}
                        onShowMoreNodes={onShowMoreNodes}
                        nodesDataset={graph.nodes}
                        onCollapseNode={handleCollapseNode}
                        onDeleteNode={onDeleteNode}
                        onExpandNode={handleExpandNode}
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
                    <EntitySelector
                        graphLabels={graph.labels}
                        onAxisHovered={onAxisHovered}
                    />
                </React.Fragment>
            ) : null}

            {currentTab === "code" ? (
                <FrameCodeTab code={tabResult.response} />
            ) : null}

            {currentTab === "mutate" ? (
                <FrameCodeTab code={tabResult.response} />
            ) : null}

            {currentTab === "userQuery" ? (
                <FrameCodeTab code={frame.query} />
            ) : null}
        </div>
    );
}

const mapStateToProps = ({ ui, url }) => ({
    panelMinimized: ui.panelMinimized,
    panelHeight: ui.panelHeight,
    panelWidth: ui.panelWidth,
    url,
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
