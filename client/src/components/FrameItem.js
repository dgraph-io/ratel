// Copyright 2017-2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";

import FrameLayout from "./FrameLayout";
import FrameSession from "./FrameLayout/FrameSession";
import FrameMessage from "./FrameMessage";
import FrameLoading from "./FrameLoading";

export default class FrameItem extends React.Component {
    state = {
        selectedNode: null,
    };

    componentDidMount() {
        const { collapsed, frame, showFrame } = this.props;
        if (!collapsed) {
            showFrame(frame.id);
        }
    }

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
            tabName,
            tabResult,
            collapsed,
            onDeleteNode,
            onDiscardFrame,
            onSelectQuery,
        } = this.props;

        const { hoveredAxis, hoveredNode, selectedNode } = this.state;
        const { response, error } = tabResult || {};

        const renderContent = () => {
            if (!frame.completed) {
                return <FrameLoading />;
            }
            return response ? (
                <FrameSession
                    activeTab={tabName}
                    frame={frame}
                    tabResult={tabResult}
                    highlightPredicate={hoveredAxis}
                    hoveredAxis={hoveredAxis}
                    hoveredNode={hoveredNode}
                    onAxisHovered={this.handleAxisHovered}
                    onDeleteNode={onDeleteNode}
                    onNodeHovered={this.handleNodeHovered}
                    onNodeSelected={this.handleNodeSelected}
                    selectedNode={selectedNode}
                />
            ) : (
                <FrameMessage
                    error={error}
                    query={frame.query}
                    response={tabResult.response}
                />
            );
        };

        return (
            <FrameLayout
                activeFrameId={activeFrameId}
                frame={frame}
                collapsed={collapsed}
                onDiscardFrame={onDiscardFrame}
                onSelectQuery={onSelectQuery}
            >
                {!collapsed ? renderContent() : null}
            </FrameLayout>
        );
    }
}
