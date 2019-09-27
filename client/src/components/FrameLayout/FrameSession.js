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
import memoize from "memoize-one";
import { useDispatch, useSelector } from "react-redux";
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

export default function FrameSession({
    activeTab,
    frame,
    tabResult,
    onDeleteNode,
}) {
    const { panelMinimized, panelHeight, panelWidth } = useSelector(
        store => store.ui,
    );
    const url = useSelector(store => store.url);

    const dispatch = useDispatch();

    const handlePanelResize = panelSize => dispatch(setPanelSize(panelSize));
    const handleSetPanelMinimized = minimized =>
        dispatch(setPanelMinimized(minimized));
    const handleChangeTab = tab => dispatch(updateFramesTab(tab));

    const [selectedNode, setSelectedNode] = React.useState(null);
    const [hoveredNode, setHoveredNode] = React.useState(null);
    const [hoveredPredicate, setHoveredPredicate] = React.useState(null);

    // TODO: updating graphUpdateHack will force Graphcontainer > D3Graph
    // to re-render, and before render it will refresh nodes/edges dataset.
    // When GraphParser creates a new node or edge the d3 renderer needs to
    // be notified, because they share nodes/edges arrays.
    // But right now d3 renderer and graphParser live in different components.
    // There's no way to send this notification.
    // Most likely solution - make d3 force layout a part of graphParser,
    // that way graphParser will be able to control/update it.
    const [graphUpdateHack, setGraphUpdateHack] = React.useState("");

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
            onSelect={handleChangeTab}
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
                        highlightPredicate={hoveredPredicate}
                        hoveredNode={hoveredNode}
                        onShowMoreNodes={onShowMoreNodes}
                        nodesDataset={graph.nodes}
                        onCollapseNode={handleCollapseNode}
                        onDeleteNode={onDeleteNode}
                        onExpandNode={handleExpandNode}
                        onNodeHovered={setHoveredNode}
                        onNodeSelected={setSelectedNode}
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
                        onPredicateHovered={setHoveredPredicate}
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
