import React from "react";
import { connect } from "react-redux";
import Tab from "react-bootstrap/lib/Tab";
import Tabs from "react-bootstrap/lib/Tabs";

import FrameCodeTab from "components/FrameCodeTab";
import GraphContainer from "containers/GraphContainer";
import EntitySelector from "../EntitySelector";
import GraphIcon from "../GraphIcon";

import { patchFrame, updateFramesTab } from "actions/frames";

class FrameSession extends React.Component {
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
                    <EntitySelector
                        response={parsedResponse}
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
        dispatchAddExtraQuery(extraQuery, frame) {
            return dispatch(
                patchFrame(frame.id, {
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
