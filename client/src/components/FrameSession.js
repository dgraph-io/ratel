import React from "react";
import classnames from "classnames";
import vis from "vis";
import { connect } from "react-redux";

import FrameCodeTab from "./FrameCodeTab";
import GraphContainer from "../containers/GraphContainer";
import SessionFooter from "./SessionFooter";
import EntitySelector from "./EntitySelector";
import GraphIcon from "./GraphIcon";
import TreeIcon from "./TreeIcon";

import { getNodeLabel, shortenName } from "../lib/graph";
import { updateFrame, updateFramesTab } from "../actions/frames";

class FrameSession extends React.Component {
    constructor(props) {
        super(props);
        const { framesTab, response } = props;

        this.state = {
            // Tabs: "query", "graph", "tree", "json".
            currentTab: framesTab,
            graphRenderStart: null,
            graphRenderEnd: null,
            treeRenderStart: null,
            treeRenderEnd: null,
            isTreePartial: false,
            configuringNodeType: null,
        };

        this.nodes = new vis.DataSet(response.nodes);
        this.edges = new vis.DataSet(response.edges);
    }

    componentDidMount() {
        const { onJsonClick, data } = this.props;
        if (this.state.currentTab === "code" && data == null) {
            onJsonClick();
        }
    }

    handleUpdateLabelRegex = val => {
        const { frame, changeRegexStr } = this.props;
        changeRegexStr(frame, val);
    };

    handleBeforeGraphRender = () => {
        this.setState({ graphRenderStart: new Date() });
    };

    handleGraphRendered = () => {
        this.setState({ graphRenderEnd: new Date() });
    };

    handleBeforeTreeRender = () => {
        this.setState({ treeRenderStart: new Date() });
    };

    handleTreeRendered = () => {
        this.setState({ treeRenderEnd: new Date() });
    };

    handleInitNodeTypeConfig = nodeType => {
        const { configuringNodeType } = this.state;

        let nextValue;
        if (configuringNodeType === nodeType) {
            nextValue = "";
        } else {
            nextValue = nodeType;
        }
        this.setState({ configuringNodeType: nextValue });
    };

    navigateTab = (tabName, e) => {
        e.preventDefault();

        const { onJsonClick, data, updateFramesTab } = this.props;
        this.setState(
            {
                currentTab: tabName,
            },
            () => {
                updateFramesTab(tabName);
            },
        );

        if (tabName === "code" && data == null) {
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
            const properties = JSON.parse(node.title);
            const fullName = getNodeLabel(properties.attrs, re);
            const displayLabel = shortenName(fullName);
            return { ...node, label: displayLabel };
        });

        this.nodes.update(updatedNodes);
    };

    handleUpdateFrameQuery = query => {
        const { dispatchUpdateQuery, frame } = this.props;
        dispatchUpdateQuery(query, frame);
    };

    render() {
        const {
            data,
            frame,
            handleNodeHovered,
            handleNodeSelected,
            hoveredNode,
            response,
            restoreSelectionOnLoad,
            selectedNode,
        } = this.props;
        const {
            currentTab,
            configuringNodeType,
            isConfiguringLabel,
        } = this.state;

        return (
            <div className="body">
                <div className="content">
                    <div className="sidebar">
                        <ul className="sidebar-nav">
                            <li>
                                <a
                                    href="#graph"
                                    className={classnames("sidebar-nav-item", {
                                        active: currentTab === "graph",
                                    })}
                                    onClick={this.navigateTab.bind(
                                        this,
                                        "graph",
                                    )}
                                >
                                    <div className="icon-container">
                                        <GraphIcon />
                                    </div>
                                    <span className="menu-label">Graph</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#tree"
                                    className={classnames("sidebar-nav-item", {
                                        active: currentTab === "tree",
                                    })}
                                    onClick={this.navigateTab.bind(
                                        this,
                                        "tree",
                                    )}
                                >
                                    <div className="icon-container">
                                        <TreeIcon />
                                    </div>
                                    <span className="menu-label">Tree</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#code"
                                    className={classnames("sidebar-nav-item", {
                                        active: currentTab === "code",
                                    })}
                                    onClick={this.navigateTab.bind(
                                        this,
                                        "code",
                                    )}
                                >
                                    <div className="icon-container">
                                        <i className="icon fa fa-code" />
                                    </div>

                                    <span className="menu-label">JSON</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div className="main">
                        {currentTab === "graph" ? (
                            <div className="content-container">
                                <GraphContainer
                                    edgesDataset={this.edges}
                                    key={currentTab}
                                    nodesDataset={this.nodes}
                                    onBeforeRender={
                                        this.handleBeforeGraphRender
                                    }
                                    onRendered={this.handleGraphRendered}
                                    onRunQuery={this.props.onRunQuery}
                                    onNodeHovered={handleNodeHovered}
                                    onNodeSelected={handleNodeSelected}
                                    response={response}
                                    restoreSelectionOnLoad={
                                        restoreSelectionOnLoad
                                    }
                                    selectedNode={selectedNode}
                                    updateQuery={this.handleUpdateFrameQuery}
                                />
                            </div>
                        ) : null}

                        {currentTab === "tree" ? (
                            <div className="content-container">
                                <GraphContainer
                                    edgesDataset={this.edges}
                                    key={currentTab}
                                    nodesDataset={this.nodes}
                                    onBeforeRender={this.handleBeforeTreeRender}
                                    onRendered={this.handleTreeRendered}
                                    onRunQuery={this.props.onRunQuery}
                                    onNodeSelected={handleNodeSelected}
                                    onNodeHovered={handleNodeHovered}
                                    response={response}
                                    restoreSelectionOnLoad={
                                        restoreSelectionOnLoad
                                    }
                                    selectedNode={selectedNode}
                                    updateQuery={this.handleUpdateFrameQuery}
                                    treeView
                                />
                            </div>
                        ) : null}

                        {currentTab === "code" ? (
                            <FrameCodeTab query={frame.query} response={data} />
                        ) : null}

                        {currentTab === "graph" || currentTab === "tree" ? (
                            <EntitySelector
                                response={response}
                                onInitNodeTypeConfig={
                                    this.handleInitNodeTypeConfig
                                }
                                labelRegexStr={frame.meta.regexStr}
                                onUpdateLabelRegex={this.handleUpdateLabelRegex}
                                onUpdateLabels={this.handleUpdateLabels}
                            />
                        ) : null}

                        <SessionFooter
                            response={response}
                            currentTab={currentTab}
                            selectedNode={selectedNode}
                            hoveredNode={hoveredNode}
                            configuringNodeType={configuringNodeType}
                            graphRenderTime={this.getGraphRenderTime()}
                            treeRenderTime={this.getTreeRenderTime()}
                            isConfiguringLabel={isConfiguringLabel}
                        />
                    </div>
                </div>
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
        dispatchUpdateQuery(query, frame) {
            return dispatch(
                updateFrame({
                    ...frame,
                    query,
                    version: (frame.version || 0) + 1,
                    meta: {
                        ...frame.meta,
                    },
                }),
            );
        },
    };
}

export default connect(
    null,
    mapDispatchToProps,
)(FrameSession);
