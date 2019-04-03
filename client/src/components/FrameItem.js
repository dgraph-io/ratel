// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
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

import { executeQuery } from "../lib/helpers";
import { GraphParser } from "../lib/graph";

export default class FrameItem extends React.Component {
    state = {
        graphParser: new GraphParser(),

        requestedMain: false,
        jsonResponse: null,
        parsedResponse: null,
        debugResponse: null,
    };

    componentDidMount() {
        this.maybeExecuteFrame();
    }

    componentDidUpdate() {
        this.maybeExecuteFrame();
    }

    maybeExecuteFrame = () => {
        const { requestedMain } = this.state;
        const { collapsed, frame } = this.props;
        const { action, errorMessage, executed, query, successMessage } = frame;
        if (collapsed || !query) {
            // Frame is collapsed or empty, ignore.
            return;
        }

        this.maybeFetchJsonResponse();

        if (executed && action === "mutate") {
            if ((successMessage || errorMessage) && !requestedMain) {
                // Mark this frame as executed and quit.
                this.setState({ requestedMain: true });
                return;
            }
        }

        if (!requestedMain) {
            this.setState({ requestedMain: true });
            this.executeAndUpdateFrame(query, action);
        }
    };

    async maybeFetchJsonResponse() {
        const { jsonResponse } = this.state;
        const { frame, framesTab } = this.props;
        const { query, action } = frame;

        if (action !== "query" || framesTab !== "code" || jsonResponse) {
            return;
        }

        const executionStart = Date.now();
        try {
            const jsonResponse = await this.executeQuery(query, action, false);
            this.updateFrameTiming(executionStart, jsonResponse.extensions);
            this.setState({ jsonResponse });
        } catch (errorMessage) {
            this.patchThisFrame({ errorMessage });
        } finally {
            this.patchThisFrame({ executed: true });
        }
    }

    patchThisFrame = data => {
        const { frame, patchFrame } = this.props;
        patchFrame(frame.id, data);
    };

    updateFrameTiming = (executionStart, extensions) => {
        if (!extensions || !extensions.server_latency) {
            return;
        }
        const {
            parsing_ns,
            processing_ns,
            encoding_ns,
        } = extensions.server_latency;
        const fullRequestTimeNs = (Date.now() - executionStart) * 1e6;
        const serverLatencyNs = parsing_ns + processing_ns + (encoding_ns || 0);
        this.patchThisFrame({
            serverLatencyNs,
            networkLatencyNs: fullRequestTimeNs - serverLatencyNs,
        });
    };

    handleShowMoreNodes = () => {
        const { graphParser } = this.state;
        graphParser.processQueue();
        this.updateParsedResponse();
    };

    updateParsedResponse = () => {
        const { graphParser } = this.state;
        const {
            nodes,
            edges,
            labels,
            remainingNodes,
        } = graphParser.getCurrentGraph();

        if (nodes.length === 0) {
            this.patchThisFrame({
                successMessage: "Your query did not return any results",
            });
            return;
        }

        this.setState({
            parsedResponse: {
                edges,
                nodes,
                plotAxis: labels,
                remainingNodes,
            },
        });
    };

    async handleExpandNode(uid) {
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
    }
    handleExpandNode = this.handleExpandNode.bind(this);

    sendNodesToGraphParser = data => {
        const regexStr = this.props.frame.regexStr || "Name";
        const { graphParser } = this.state;

        graphParser.addResponseToQueue(data);
        graphParser.processQueue(false, regexStr);
        this.updateParsedResponse();
    };

    async executeQuery(query, action, isDebug) {
        const { onUpdateConnectedState, url, queryTimeout } = this.props;
        try {
            const res = await executeQuery(url, query, {
                action,
                debug: isDebug,
                queryTimeout,
            });
            onUpdateConnectedState(true);
            return res;
        } catch (error) {
            if (!error.response) {
                // If no response, it's a network error or client side runtime error.
                onUpdateConnectedState(false);
                throw `Could not connect to the server: ${error.message}`;
            } else {
                throw await error.response.text();
            }
        }
    }

    async executeAndUpdateFrame(query, action) {
        const { debugResponse } = this.state;

        try {
            const executionStart = Date.now();
            const rawResponse = await this.executeQuery(query, action, true);
            const { data, errors, extensions } = rawResponse;

            this.updateFrameTiming(executionStart, extensions);
            if (!debugResponse) {
                this.setState({
                    debugResponse: rawResponse,
                });
            }

            if (errors) {
                this.patchThisFrame({
                    hasError: true,
                    errorMessage: errors[0].message,
                });
                return;
            }

            if (action === "query") {
                this.sendNodesToGraphParser(data);
                return;
            }

            if (action === "mutate") {
                this.patchThisFrame({
                    successMessage: data.message,
                    rawResponse,
                });
                return;
            }
        } catch (errorMessage) {
            this.patchThisFrame({ errorMessage, hasError: true });
        } finally {
            this.patchThisFrame({ executed: true });
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
            framesTab,
            collapsed,
            onDiscardFrame,
            onSelectQuery,
        } = this.props;
        const {
            debugResponse,
            jsonResponse,
            hoveredAxis,
            hoveredNode,
            parsedResponse,
            selectedNode,
        } = this.state;
        const { errorMessage, successMessage, executed, rawResponse } = frame;

        let content;
        if (!executed) {
            content = <FrameLoading />;
        } else if (parsedResponse) {
            content = (
                <FrameSession
                    frame={frame}
                    framesTab={framesTab}
                    highlightPredicate={hoveredAxis}
                    hoveredAxis={hoveredAxis}
                    hoveredNode={hoveredNode}
                    jsonResponse={rawResponse || jsonResponse || debugResponse}
                    onShowMoreNodes={this.handleShowMoreNodes}
                    onExpandNode={this.handleExpandNode}
                    onNodeHovered={this.handleNodeHovered}
                    onNodeSelected={this.handleNodeSelected}
                    onAxisHovered={this.handleAxisHovered}
                    parsedResponse={parsedResponse}
                    selectedNode={selectedNode}
                />
            );
        } else if (errorMessage || successMessage) {
            content = (
                <FrameMessage
                    errorMessage={errorMessage}
                    query={frame.query}
                    rawResponse={rawResponse || jsonResponse || debugResponse}
                    successMessage={successMessage}
                />
            );
        }

        return (
            <FrameLayout
                activeFrameId={activeFrameId}
                frame={frame}
                collapsed={collapsed}
                onDiscardFrame={onDiscardFrame}
                onSelectQuery={onSelectQuery}
            >
                {content}
            </FrameLayout>
        );
    }
}
