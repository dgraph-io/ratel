import React from "react";
import classnames from "classnames";
import { connect } from "react-redux";

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

        this.state = {
            isTreePartial: false,
        };

        this.nodes = parsedResponse.nodes;
        this.edges = parsedResponse.edges;
    }

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

    navigateTab = tabName => {
        const { onJsonClick, data, updateFramesTab } = this.props;
        this.setState(
            {
                currentTab: tabName,
            },
            () => updateFramesTab(tabName),
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

    renderToolbar = currentTab => (
        <ul className="toolbar">
            <li>
                <button
                    className={classnames({
                        active: currentTab === "graph",
                    })}
                    onClick={() => this.navigateTab("graph")}
                >
                    <div className="icon-container">
                        <GraphIcon />
                    </div>
                    <span className="menu-label">Graph</span>
                </button>
            </li>
            <li>
                <button
                    className={classnames({
                        active: currentTab === "code",
                    })}
                    onClick={() => this.navigateTab("code")}
                >
                    <div className="icon-container">
                        <i className="icon fa fa-code" />
                    </div>

                    <span className="menu-label">JSON</span>
                </button>
            </li>
        </ul>
    );

    render() {
        const {
            rawResponse,
            parsedResponse,
            frame,
            framesTab,
            onExpandResponse,
            handleNodeHovered,
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
                        onNodeHovered={handleNodeHovered}
                        onNodeSelected={handleNodeSelected}
                        parsedResponse={parsedResponse}
                        selectedNode={selectedNode}
                    />
                ) : null}

                {currentTab === "code" ? (
                    <FrameCodeTab code={rawResponse} />
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
