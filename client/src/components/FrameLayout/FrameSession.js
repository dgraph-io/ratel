import React from "react";
import { connect } from "react-redux";
import Tab from "react-bootstrap/lib/Tab";
import Tabs from "react-bootstrap/lib/Tabs";

import FrameCodeTab from "components/FrameCodeTab";
import GraphContainer from "components/GraphContainer";
import EntitySelector from "components/EntitySelector";
import GraphIcon from "components/GraphIcon";

import { updateFramesTab } from "actions/frames";
import { setPanelSize } from "actions/ui";

class FrameSession extends React.Component {
    getGraphRenderTime = () => {
        const { graphRenderStart, graphRenderEnd } = this.state;
        if (!graphRenderStart || !graphRenderEnd) {
            return;
        }

        return graphRenderEnd.getTime() - graphRenderStart.getTime();
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
            handlePanelResize,
            highlightPredicate,
            onExpandNode,
            onShowMoreNodes,
            onNodeHovered,
            onNodeSelected,
            panelHeight,
            panelWidth,
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
                        onShowMoreNodes={onShowMoreNodes}
                        nodesDataset={parsedResponse.nodes}
                        onExpandNode={onExpandNode}
                        onNodeHovered={onNodeHovered}
                        onNodeSelected={onNodeSelected}
                        onPanelResize={handlePanelResize}
                        panelHeight={panelHeight}
                        panelWidth={panelWidth}
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

const mapStateToProps = ({ ui }) => ({
    panelHeight: ui.panelHeight,
    panelWidth: ui.panelWidth,
});

function mapDispatchToProps(dispatch) {
    return {
        handlePanelResize: panelSize =>
            console.log("resize to ", panelSize) ||
            dispatch(setPanelSize(panelSize)),
        updateFramesTab: tab => dispatch(updateFramesTab(tab)),
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(FrameSession);
