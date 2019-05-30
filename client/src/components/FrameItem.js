// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import memoize from "memoize-one";

import FrameLayout from "./FrameLayout";
import FrameSession from "./FrameLayout/FrameSession";
import FrameMessage from "./FrameMessage";
import FrameLoading from "./FrameLoading";
import { GraphParser } from "lib/graph";

export default class FrameItem extends React.Component {
    state = {
        selectedNode: null,
    };

    getGraphParser = memoize(response => {
        if (!response) {
            return null;
        }
        const graphParser = new GraphParser();
        // TODO: add support for custom name regex in UI
        const regexStr = "Name";

        graphParser.addResponseToQueue(response.data);
        graphParser.processQueue(regexStr);
        return graphParser;
    });

    componentDidMount() {
        const { collapsed, frame, showFrame } = this.props;
        if (!collapsed) {
            showFrame(frame.id);
        }
    }

    handleShowMoreNodes = () => {
        this.getGraphParser(this.props.tabResult.response).processQueue();
    };

    handleExpandNode = async uid => {
        const query = `{
          node(func:uid(${uid})) {
            expand(_all_) {
              uid
              expand(_all_)
            }
          }
        }`;
        try {
            const { data } = await this.executeQuery(query, "query", true);
            this.sendNodesToGraphParser(data);
        } catch (error) {
            // Ignore errors and exceptions on this RPC.
            console.error(error);
        }
    };

    sendNodesToGraphParser = data => {
        const regexStr = this.props.frame.regexStr || "Name";
        const graphParser = this.getGraphParser(
            this.props.tabResult && this.props.tabResult.response,
        );

        graphParser.addResponseToQueue(data);
        graphParser.processQueue(regexStr);
        this.updateParsedResponse();
    };

    handleNodeSelected = selectedNode => {
        if (!selectedNode) {
            this.setState({
                selectedNode: null,
                hoveredNode: null,
            });
        } else {
            this.setState({ selectedNode });
        }
    };

    handleNodeHovered = hoveredNode => this.setState({ hoveredNode });

    handleAxisHovered = hoveredAxis => this.setState({ hoveredAxis });

    render() {
        const {
            activeFrameId,
            frame,
            tabResult,
            tabName,
            collapsed,
            onDeleteNode,
            onDiscardFrame,
            onSelectQuery,
        } = this.props;
        const { hoveredAxis, hoveredNode, selectedNode } = this.state;
        const { errorMessage, successMessage } = frame;
        const { response } = tabResult || {};

        const renderContent = () => {
            if (response) {
                return (
                    <FrameSession
                        activeTab={tabName}
                        frame={frame}
                        graphParser={this.getGraphParser(
                            tabResult && tabResult.response,
                        )}
                        tabResult={tabResult}
                        highlightPredicate={hoveredAxis}
                        hoveredAxis={hoveredAxis}
                        hoveredNode={hoveredNode}
                        onAxisHovered={this.handleAxisHovered}
                        onDeleteNode={onDeleteNode}
                        onExpandNode={this.handleExpandNode}
                        onNodeHovered={this.handleNodeHovered}
                        onNodeSelected={this.handleNodeSelected}
                        onShowMoreNodes={this.handleShowMoreNodes}
                        selectedNode={selectedNode}
                    />
                );
            }

            if (errorMessage || successMessage) {
                return (
                    <FrameMessage
                        errorMessage={errorMessage}
                        query={frame.query}
                        rawResponse={response}
                        successMessage={successMessage}
                    />
                );
            }

            return <FrameLoading />;
        };

        return (
            <FrameLayout
                activeFrameId={activeFrameId}
                frame={frame}
                collapsed={collapsed}
                onDiscardFrame={onDiscardFrame}
                onSelectQuery={onSelectQuery}
            >
                {renderContent()}
            </FrameLayout>
        );
    }
}
