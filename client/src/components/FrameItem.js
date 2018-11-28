import React from "react";
import Raven from "raven-js";

import FrameLayout from "./FrameLayout";
import FrameSession from "./FrameLayout/FrameSession";
import FrameMessage from "./FrameMessage";
import FrameLoading from "./FrameLoading";

import { executeQuery, isNotEmpty } from "../lib/helpers";
import { GraphParser } from "../lib/graph";

export default class FrameItem extends React.Component {
    state = {
        errorMessage: null,
        requestedVersion: 0,
        receivedVersion: 0,
        graphParser: new GraphParser(),
        parsedResponse: null,
        rawResponse: null,
        successMessage: null,
    };

    componentDidMount() {
        this.props.frame.version = this.props.frame.version || 1;
        this.maybeExecuteFrameQuery();
    }

    componentDidUpdate() {
        this.props.frame.version = this.props.frame.version || 1;
        this.maybeExecuteFrameQuery();
    }

    maybeExecuteFrameQuery = () => {
        const { collapsed, frame } = this.props;
        const { requestedVersion } = this.state;
        const { action, extraQuery, query } = frame;

        if (collapsed || !query) {
            // Frame is collapsed or empty, ignore.
            return;
        }

        if (requestedVersion >= frame.version) {
            // Latest frame data is already pending
            return;
        }

        // Invariant: there's data to fetch at this line.
        if (!requestedVersion) {
            // Nothing has been fetched at all. Do initial load.
            this.executeFrameQuery(query, action);
        } else {
            // We have requested something, if we got here - extra version has
            // incremented since last fetch, run extraQuery and update frame.
            this.executeFrameQuery(extraQuery, action);
        }
    };

    cleanFrameData = () =>
        this.setState({
            errorMessage: null,
            requestedVersion: 0,
            receivedVersion: 0,
            graphParser: new GraphParser(),
            parsedResponse: null,
            rawResponse: null,
            successMessage: null,
        });

    executeOnJsonClick = () => {
        const { frame, url } = this.props;
        const { query, action } = frame;

        if (action !== "query") {
            return;
        }

        const executionStart = Date.now();
        executeQuery(url, query, action, false).then(rawResponse => {
            this.updateFrameTiming(executionStart, rawResponse);
            this.setState({ rawResponse });
        });
    };

    patchThisFrame = data => {
        const { frame, patchFrame } = this.props;
        patchFrame(frame.id, data);
    };

    updateFrameTiming = (executionStart, response) => {
        if (
            !response ||
            !response.extensions ||
            !response.extensions.server_latency
        ) {
            return;
        }
        const {
            parsing_ns,
            processing_ns,
            encoding_ns,
        } = response.extensions.server_latency;
        const fullRequestTimeNs = (Date.now() - executionStart) * 1e6;
        const serverLatencyNs = parsing_ns + processing_ns + (encoding_ns || 0);
        this.patchThisFrame({
            serverLatencyNs,
            networkLatencyNs: fullRequestTimeNs - serverLatencyNs,
        });
    };

    handleExpandResponse = () => {
        const { graphParser } = this.state;
        graphParser.processQueue();
        this.updateParsedResponse();
    };

    updateParsedResponse = rawResponse => {
        const { graphParser, parsedResponse } = this.state;
        rawResponse =
            rawResponse || (parsedResponse && parsedResponse.rawResponse);
        const {
            nodes,
            edges,
            labels,
            remainingNodes,
        } = graphParser.getCurrentGraph();

        if (nodes.length === 0) {
            this.setState({
                successMessage: "Your query did not return any results",
            });
            return;
        }

        this.setState({
            parsedResponse: {
                edges: edges,
                nodes: nodes,
                numNodes: nodes.length,
                numEdges: edges.length,
                plotAxis: labels,
                rawResponse,
                remainingNodes,
                treeView: false,
            },
        });
    };

    executeFrameQuery = (query, action) => {
        const {
            frame: { meta, version },
            url,
            onUpdateConnectedState,
        } = this.props;

        this.setState({
            requestedVersion: Math.max(this.state.requestedVersion, version),
        });

        const executionStart = Date.now();
        executeQuery(url, query, action, true)
            .then(res => {
                const { receivedVersion } = this.state;
                if (receivedVersion >= version) {
                    // Ignore request that has arrived too late.
                    return;
                }
                this.updateFrameTiming(executionStart, res);

                this.setState({
                    rawResponse: res,
                    receivedVersion: version,
                });
                onUpdateConnectedState(true);

                if (action === "query") {
                    if (res.errors) {
                        // Handle query error responses here.
                        this.setState({
                            errorMessage: res.errors[0].message,
                        });
                        this.patchThisFrame({ hasError: true });
                    } else if (isNotEmpty(res.data)) {
                        const regexStr = meta.regexStr || "Name";
                        const { graphParser } = this.state;

                        graphParser.addResponseToQueue(res.data);
                        graphParser.processQueue(false, regexStr);
                        this.updateParsedResponse(res);
                    } else {
                        this.setState({
                            successMessage:
                                "Your query did not return any results",
                        });
                    }
                } else {
                    // Mutation or Alter.
                    if (res.errors) {
                        this.setState({
                            errorMessage: res.errors[0].message,
                        });
                        this.patchThisFrame({ hasError: true });
                    } else {
                        this.setState({
                            successMessage: res.data.message,
                        });
                    }
                }
            })
            .catch(error => this.processError(error, version));
    };

    async processError(error, receivedVersion) {
        this.patchThisFrame({ hasError: true });
        let errorMessage;
        // If no response, it's a network error or client side runtime error.
        if (!error.response) {
            // Capture client side error not query execution error from server.
            // FIXME: This captures 404.
            this.props.onUpdateConnectedState(false);

            errorMessage = `${error.message}: Could not connect to the server`;
        } else {
            errorMessage = await error.response.text();
        }
        this.setState({
            errorMessage,
            receivedVersion,
            rawData: error,
        });
    }

    handleNodeSelected = selectedNode => {
        if (!selectedNode) {
            this.setState({
                selectedNode: null,
                hoveredNode: null,
                configuringNodeType: null,
            });
        } else {
            this.setState({ selectedNode });
        }
    };

    handleNodeHovered = hoveredNode => this.setState({ hoveredNode });

    render() {
        const {
            frame,
            framesTab,
            collapsed,
            onDiscardFrame,
            onSelectQuery,
        } = this.props;
        const {
            rawResponse,
            errorMessage,
            receivedVersion,
            hoveredNode,
            parsedResponse,
            selectedNode,
            successMessage,
        } = this.state;

        let content;
        if (!receivedVersion) {
            content = <FrameLoading />;
        } else if (parsedResponse) {
            content = (
                <FrameSession
                    frame={frame}
                    framesTab={framesTab}
                    onExpandResponse={this.handleExpandResponse}
                    onNodeHovered={this.handleNodeHovered}
                    handleNodeSelected={this.handleNodeSelected}
                    hoveredNode={hoveredNode}
                    selectedNode={selectedNode}
                    parsedResponse={parsedResponse}
                    rawResponse={rawResponse}
                    onJsonClick={this.executeOnJsonClick}
                />
            );
        } else if (errorMessage || successMessage) {
            content = (
                <FrameMessage
                    errorMessage={errorMessage}
                    query={frame.query}
                    rawResponse={rawResponse}
                    successMessage={successMessage}
                />
            );
        }

        return (
            <FrameLayout
                frame={frame}
                collapsed={collapsed}
                response={rawResponse}
                onDiscardFrame={onDiscardFrame}
                onSelectQuery={onSelectQuery}
                responseFetched={receivedVersion > 0}
                onAfterExpandFrame={this.executeFrameQuery}
            >
                {content}
            </FrameLayout>
        );
    }
}
