import React from "react";

import FrameLayout from "./FrameLayout";
import FrameSession from "./FrameLayout/FrameSession";
import FrameMessage from "./FrameMessage";
import FrameLoading from "./FrameLoading";

import { executeQuery, isNotEmpty } from "../lib/helpers";
import { GraphParser } from "../lib/graph";

export default class FrameItem extends React.Component {
    state = {
        requestedVersion: 0,
        receivedVersion: 0,
        graphParser: new GraphParser(),
        parsedResponse: null,
    };

    componentDidMount() {
        this.maybeExecuteFrameQuery();
    }

    componentDidUpdate() {
        this.maybeExecuteFrameQuery();
    }

    maybeExecuteFrameQuery = () => {
        const { collapsed, frame } = this.props;
        const { receivedVersion, requestedVersion } = this.state;
        const {
            action,
            errorMessage,
            executed,
            extraQuery,
            query,
            successMessage,
        } = frame;
        if (collapsed || !query) {
            // Frame is collapsed or empty, ignore.
            return;
        }

        this.fetchJsonResponse();

        if (executed && action === "mutate") {
            if (!receivedVersion && (successMessage || errorMessage)) {
                // Mark this frame as executed and quit.
                this.setState({ receivedVersion: 1 });
                return;
            }
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

    fetchJsonResponse = () => {
        const { jsonResponse } = this.state;
        const { frame, url, framesTab } = this.props;
        const { query, action } = frame;

        if (action !== "query" || framesTab !== "code" || jsonResponse) {
            return;
        }

        const executionStart = Date.now();
        executeQuery(url, query, action, false)
            .then(jsonResponse => {
                this.patchThisFrame({ executed: true });
                this.updateFrameTiming(executionStart, jsonResponse);
                this.setState({ jsonResponse });
            })
            .catch(() => this.patchThisFrame({ executed: true }));
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

    async executeFrameQuery(query, action) {
        const {
            frame: { meta, version },
            url,
            onUpdateConnectedState,
        } = this.props;
        const { debugResponse, requestedVersion } = this.state;

        this.setState({
            requestedVersion: Math.max(requestedVersion, version),
        });

        try {
            const executionStart = Date.now();
            const res = await executeQuery(url, query, action, true);
            this.patchThisFrame({ executed: true });

            const { receivedVersion } = this.state;
            if (receivedVersion >= version) {
                // Ignore request that has arrived too late.
                return;
            }
            this.updateFrameTiming(executionStart, res);

            this.setState({
                receivedVersion: version,
            });
            if (!debugResponse) {
                this.setState({ debugResponse: res });
            }

            onUpdateConnectedState(true);

            if (res.errors) {
                // Handle query error responses here.
                this.patchThisFrame({
                    hasError: true,
                    errorMessage: res.errors[0].message,
                });
            } else if (action === "query") {
                if (isNotEmpty(res.data)) {
                    const regexStr = meta.regexStr || "Name";
                    const { graphParser } = this.state;

                    graphParser.addResponseToQueue(res.data);
                    graphParser.processQueue(false, regexStr);
                    this.updateParsedResponse();
                } else {
                    this.patchThisFrame({
                        successMessage: "Your query did not return any results",
                    });
                }
            } else {
                // Mutation
                this.patchThisFrame({
                    successMessage: res.data.message,
                });
            }
        } catch (error) {
            this.processError(error, version);
        }
    }

    async processError(error, receivedVersion) {
        let errorMessage;
        // If no response, it's a network error or client side runtime error.
        if (!error.response) {
            // Capture client side error not query execution error from server.
            this.props.onUpdateConnectedState(false);

            errorMessage = `${error.message}: Could not connect to the server`;
        } else {
            errorMessage = await error.response.text();
        }
        this.patchThisFrame({ errorMessage, hasError: true });
        this.setState({ receivedVersion });
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
        const { errorMessage, successMessage, executed } = frame;

        let content;
        if (!executed) {
            content = <FrameLoading />;
        } else if (parsedResponse) {
            content = (
                <FrameSession
                    frame={frame}
                    framesTab={framesTab}
                    highlightPredicate={hoveredAxis}
                    onExpandResponse={this.handleExpandResponse}
                    onNodeHovered={this.handleNodeHovered}
                    handleNodeSelected={this.handleNodeSelected}
                    onAxisHovered={this.handleAxisHovered}
                    hoveredAxis={hoveredAxis}
                    hoveredNode={hoveredNode}
                    selectedNode={selectedNode}
                    parsedResponse={parsedResponse}
                    jsonResponse={jsonResponse || debugResponse}
                />
            );
        } else if (errorMessage || successMessage) {
            content = (
                <FrameMessage
                    errorMessage={errorMessage}
                    query={frame.query}
                    jsonResponse={jsonResponse || debugResponse}
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
