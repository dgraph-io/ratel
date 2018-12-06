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
    handleUpdateLabelRegex = val => {
        const { frame, changeRegexStr } = this.props;
        changeRegexStr(frame, val);
    };

    getGraphRenderTime = () => {
        const { graphRenderStart, graphRenderEnd } = this.state;
        if (!graphRenderStart || !graphRenderEnd) {
            return;
        }

        return graphRenderEnd.getTime() - graphRenderStart.getTime();
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
            onSelect={this.props.updateFramesTab}
        >
            {this.toolButton("graph", <GraphIcon />, "Graph")}
            {this.toolButton("code", <i className="icon fa fa-code" />, "JSON")}
        </Tabs>
    );

    render() {
        const {
            jsonResponse,
            parsedResponse,
            frame,
            framesTab,
            highlightPredicate,
            onExpandResponse,
            onNodeHovered,
            handleNodeSelected,
            hoveredNode,
            selectedNode,
            onAxisHovered,
        } = this.props;
        const currentTab = framesTab === "tree" ? "graph" : framesTab;

        return (
            <div className="body">
                {this.renderToolbar(currentTab)}
                {currentTab === "graph" ? (
                    <GraphContainer
                        edgesDataset={parsedResponse.edges}
                        highlightPredicate={highlightPredicate}
                        onExpandResponse={onExpandResponse}
                        nodesDataset={parsedResponse.nodes}
                        onExpandNode={this.handleExpandNode}
                        onRunQuery={this.props.onRunQuery}
                        onNodeHovered={onNodeHovered}
                        onNodeSelected={handleNodeSelected}
                        parsedResponse={parsedResponse}
                        selectedNode={selectedNode}
                    />
                ) : null}

                {currentTab === "code" ? (
                    <FrameCodeTab code={jsonResponse} />
                ) : null}

                {currentTab === "userQuery" ? (
                    <FrameCodeTab code={frame.query} mode="graphql" />
                ) : null}

                {currentTab === "graph" ? (
                    <SessionFooter
                        rawResponse={jsonResponse}
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
                        onAxisHovered={onAxisHovered}
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
