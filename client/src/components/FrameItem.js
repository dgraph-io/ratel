import React from "react";
import Raven from "raven-js";

import FrameLayout from "./FrameLayout";
import FrameSession from "./FrameSession";
import FrameError from "./FrameError";
import FrameSuccess from "./FrameSuccess";
import FrameLoading from "./FrameLoading";

import { executeQuery, isNotEmpty, getSharedQuery } from "../lib/helpers";
import { GraphParser } from "../lib/graph";

export default class FrameItem extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            errorMessage: null,
            requestedVersion: 0,
            receivedVersion: 0,
            graphParser: new GraphParser(),
            parsedResponse: null,
            rawResponse: null,
            successMessage: null,
        };
    }

    componentDidMount() {
        this.props.frame.version = this.props.frame.version || 1;
        this.maybeExecuteFrameQuery();
    }

    componentDidUpdate() {
        this.props.frame.version = this.props.frame.version || 1;
        const { requestedVersion } = this.state;

        if (requestedVersion < this.props.frame.version) {
            this.maybeExecuteFrameQuery();
        }
    }

    maybeExecuteFrameQuery = () => {
        const { frame } = this.props;
        const { query, share, meta, action } = frame;

        if (!meta.collapsed && query && query.length > 0) {
            this.executeFrameQuery(query, action);
        } else if (share && share.length > 0 && !query) {
            this.getAndExecuteSharedQuery(share);
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

    getAndExecuteSharedQuery = shareId => {
        const { frame, updateFrame, url } = this.props;
        getSharedQuery(url, shareId).then(query => {
            if (!query) {
                this.setState({
                    errorMessage: `No query found for the shareId: ${shareId}`,
                    executed: true,
                });
            } else {
                this.executeFrameQuery(query, "query");
                updateFrame({
                    query: query,
                    id: frame.id,
                    // Lets update share back to empty, because we now have the query.
                    share: "",
                });
            }
        });
    };

    executeOnJsonClick = () => {
        const { frame, url } = this.props;
        const { query, action } = frame;

        if (action !== "query") {
            return;
        }

        executeQuery(url, query, action, false).then(res => {
            this.setState({
                rawResponse: res,
            });
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

        executeQuery(url, query, action, true)
            .then(res => {
                const { receivedVersion } = this.state;
                if (receivedVersion >= version) {
                    // Ignore request that has arrived too late.
                    return;
                }

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
                    } else if (isNotEmpty(res.data)) {
                        const regexStr = meta.regexStr || "Name";
                        this.state.graphParser.addResponseToQueue(res.data);
                        this.state.graphParser.processQueue(false, regexStr);

                        const {
                            nodes,
                            edges,
                            labels,
                            nodesIndex,
                        } = this.state.graphParser.getCurrentGraph();

                        if (nodes.length === 0) {
                            this.setState({
                                successMessage:
                                    "Your query did not return any results",
                            });
                            return;
                        }

                        const response = {
                            plotAxis: labels,
                            allNodes: nodes,
                            allEdges: edges,
                            numNodes: nodes.length,
                            numEdges: edges.length,
                            nodes: nodes,
                            edges: edges,
                            treeView: false,
                            rawResponse: res,
                        };
                        this.setState({ parsedResponse: response });
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
        let errorMessage;
        // If no response, it's a network error or client side runtime error.
        if (!error.response) {
            // Capture client side error not query execution error from server.
            // FIXME: This captures 404.
            Raven.captureException(error);
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

    handleNodeHovered = node => {
        this.setState({ hoveredNode: node });
    };

    render() {
        const {
            frame,
            framesTab,
            onDiscardFrame,
            onSelectQuery,
            collapseAllFrames,
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
                    handleNodeHovered={this.handleNodeHovered}
                    handleNodeSelected={this.handleNodeSelected}
                    hoveredNode={hoveredNode}
                    selectedNode={selectedNode}
                    parsedResponse={parsedResponse}
                    rawResponse={rawResponse}
                    onJsonClick={this.executeOnJsonClick}
                />
            );
        } else if (successMessage) {
            console.log("Render Frame Success");
            content = (
                <FrameSuccess
                    rawResponse={rawResponse}
                    query={frame.query}
                    successMessage={successMessage}
                />
            );
        } else if (errorMessage) {
            console.log("Render Frame Layout");
            content = (
                <FrameError
                    errorMessage={errorMessage}
                    rawResponse={rawResponse}
                    query={frame.query}
                />
            );
        }

        return (
            <FrameLayout
                frame={frame}
                onDiscardFrame={onDiscardFrame}
                onSelectQuery={onSelectQuery}
                collapseAllFrames={collapseAllFrames}
                responseFetched={receivedVersion > 0}
                onAfterExpandFrame={this.executeFrameQuery}
                onAfterCollapseFrame={this.cleanFrameData}
            >
                {content}
            </FrameLayout>
        );
    }
}
