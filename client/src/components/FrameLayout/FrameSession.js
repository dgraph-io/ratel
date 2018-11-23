import React from "react";
import { connect } from "react-redux";
import Tab from "react-bootstrap/lib/Tab";
import Tabs from "react-bootstrap/lib/Tabs";

import FrameCodeTab from "components/FrameCodeTab";
import GraphContainer from "containers/GraphContainer";
import SessionFooter from "./SessionFooter";
import EntitySelector from "../EntitySelector";
import GraphIcon from "../GraphIcon";

import { getNodeLabel, shortenName } from "lib/graph";
import { updateFrame, updateFramesTab } from "actions/frames";

class FrameSession extends React.Component {
    constructor(props) {
        super(props);
        const { parsedResponse } = props;

        this.nodes = parsedResponse.nodes;
        this.edges = parsedResponse.edges;
    }

    state = {};

    componentDidMount() {
        const { onJsonClick, rawResponse } = this.props;
        if (this.state.currentTab === "code" && rawResponse == null) {
            onJsonClick();
        }
    }

    handleUpdateLabelRegex = val => {
        const { frame, changeRegexStr } = this.props;
        changeRegexStr(frame, val);
    };

    navigateTab = currentTab => {
        const { onJsonClick, data, updateFramesTab } = this.props;
        this.setState({ currentTab });
        updateFramesTab(currentTab);
        if (currentTab === "code" && data === null) {
            onJsonClick();
        }
    };

    getGraphRenderTime = () => {
        const { graphRenderStart, graphRenderEnd } = this.state;
        if (!graphRenderStart || !graphRenderEnd) {
            return;
        }

        return graphRenderEnd.getTime() - graphRenderStart.getTime();
    };

    getTreeRenderTime = () => {
        const { treeRenderStart, treeRenderEnd } = this.state;
        if (!treeRenderStart || !treeRenderEnd) {
            return;
        }

        return treeRenderEnd.getTime() - treeRenderStart.getTime();
    };

    handleUpdateLabels = () => {
        const {
            frame: {
                meta: { regexStr },
            },
        } = this.props;
        if (!regexStr) {
            return;
        }

        const re = new RegExp(regexStr, "i");
        const allNodes = this.nodes.get();
        const updatedNodes = allNodes.map(node => {
            const { properties } = node;
            const fullName = getNodeLabel(properties.attrs, re);
            const displayLabel = shortenName(fullName);
            return { ...node, label: displayLabel };
        });

        this.nodes.update(updatedNodes);
    };

    handleExpandNode = uid => {
        const { dispatchAddExtraQuery, frame } = this.props;

        const query = `{
          node(func:uid(${uid})) {
            expand(_all_) {
              uid
              expand(_all_)
            }
          }
        }`;
        dispatchAddExtraQuery(query, frame);
    };

    toolButton = (id, icon, title) => (
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

    renderToolbar = currentTab => (
        <Tabs
            className="toolbar"
            id="frame-session-tabs"
            activeKey={currentTab}
            onSelect={this.navigateTab}
        >
            {this.toolButton("graph", <GraphIcon />, "Graph")}
            {this.toolButton("code", <i className="icon fa fa-code" />, "JSON")}
        </Tabs>
    );

    render() {
        const {
            rawResponse,
            parsedResponse,
            frame,
            framesTab,
            onExpandResponse,
            onNodeHovered,
            handleNodeSelected,
            hoveredNode,
            selectedNode,
        } = this.props;
        const currentTab = framesTab === "tree" ? "graph" : framesTab;

        return (
            <div className="body">
                {this.renderToolbar(currentTab)}
                {currentTab === "graph" ? (
                    <GraphContainer
                        edgesDataset={this.edges}
                        onExpandResponse={onExpandResponse}
                        nodesDataset={this.nodes}
                        onExpandNode={this.handleExpandNode}
                        onRunQuery={this.props.onRunQuery}
                        onNodeHovered={onNodeHovered}
                        onNodeSelected={handleNodeSelected}
                        parsedResponse={parsedResponse}
                        selectedNode={selectedNode}
                    />
                ) : null}

                {currentTab === "code" ? (
                    <FrameCodeTab code={rawResponse} />
                ) : null}

                {currentTab === "userQuery" ? (
                    <FrameCodeTab code={frame.query} mode="graphql" />
                ) : null}

                {currentTab === "graph" ? (
                    <SessionFooter
                        response={parsedResponse}
                        currentTab={currentTab}
                        selectedNode={selectedNode}
                        hoveredNode={hoveredNode}
                    />
                ) : null}

                {currentTab === "graph" ? (
                    <EntitySelector
                        response={parsedResponse}
                        labelRegexStr={frame.meta.regexStr}
                        onUpdateLabelRegex={this.handleUpdateLabelRegex}
                        onUpdateLabels={this.handleUpdateLabels}
                    />
                ) : null}
            </div>
        );
    }
}

function mapDispatchToProps(dispatch) {
    return {
        updateFramesTab(tab) {
            return dispatch(updateFramesTab(tab));
        },
        changeRegexStr(frame, regexStr) {
            return dispatch(
                updateFrame({
                    ...frame,
                    meta: {
                        ...frame.meta,
                        regexStr,
                    },
                }),
            );
        },
        dispatchAddExtraQuery(extraQuery, frame) {
            return dispatch(
                updateFrame({
                    ...frame,
                    extraQuery,
                    version: frame.version + 1,
                }),
            );
        },
    };
}

export default connect(
    null,
    mapDispatchToProps,
)(FrameSession);
