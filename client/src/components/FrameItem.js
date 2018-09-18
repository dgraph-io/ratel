import React from "react";
import Raven from "raven-js";

import FrameLayout from "./FrameLayout";
import FrameSession from "./FrameSession";
import FrameError from "./FrameError";
import FrameSuccess from "./FrameSuccess";
import FrameLoading from "./FrameLoading";

import { executeQuery, isNotEmpty, getSharedQuery } from "../lib/helpers";
import { processGraph } from "../lib/graph";

export default class FrameItem extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            // FIXME: naming could be better. Logically data should be called response
            // and vice-versa.
            // Data is a raw JSON response from Dgraph
            data: null,
            // Response is a processed version of data suited to render graph.
            response: null,
            responseVersion: null,
            executed: false,
            errorMessage: null,
            successMessage: null,
        };
    }

    componentDidMount() {
        this.maybeExecuteFrameQuery();
    }

    componentDidUpdate() {
        const { executed, responseVersion, lastRequestedVersion } = this.state;
        const frameVersion = this.props.frame.version;
        if (executed && frameVersion && frameVersion !== responseVersion) {
            this.cleanFrameData(true);
            if (!lastRequestedVersion || lastRequestedVersion < frameVersion) {
                this.maybeExecuteFrameQuery();
            }
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

    cleanFrameData = preserveSelection => {
        const lastSelectedNodeId = preserveSelection
            ? this.state.selectedNode && this.state.selectedNode.uid
            : null;
        this.setState({
            data: null,
            errorMessage: null,
            executed: false,
            lastSelectedNodeId,
            response: null,
            responseVersion: null,
            selectedNode: null,
            hoveredNode: null,
            successMessage: null,
        });
    };

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
                data: res,
            });
        });
    };

    executeFrameQuery = (query, action) => {
        const {
            frame: { meta, version },
            url,
            onUpdateConnectedState,
        } = this.props;

        this.setState({ lastRequestedVersion: version });

        executeQuery(url, query, action, true)
            .then(res => {
                const { lastRequestedVersion } = this.state;
                if (lastRequestedVersion && version < lastRequestedVersion) {
                    // Ignore request that has arrived too late.
                    return;
                }
                this.setState({
                    executed: true,
                    data: res,
                    responseVersion: version,
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
                        const {
                            nodes,
                            edges,
                            labels,
                            nodesIndex,
                            edgesIndex,
                        } = processGraph(res.data, false, regexStr);

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
                            nodes: nodes.slice(0, nodesIndex),
                            edges: edges.slice(0, edgesIndex),
                            treeView: false,
                            data: res,
                        };
                        this.setState({ response });
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

    async processError(error, responseVersion) {
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
            executed: true,
            responseVersion: responseVersion,
            data: error,
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
            data,
            errorMessage,
            executed,
            hoveredNode,
            lastSelectedNodeId,
            response,
            selectedNode,
            successMessage,
        } = this.state;

        let content;
        if (!executed) {
            content = <FrameLoading />;
        } else if (response) {
            content = (
                <FrameSession
                    frame={frame}
                    framesTab={framesTab}
                    restoreSelectionOnLoad={lastSelectedNodeId}
                    handleNodeHovered={this.handleNodeHovered}
                    handleNodeSelected={this.handleNodeSelected}
                    hoveredNode={hoveredNode}
                    selectedNode={selectedNode}
                    response={response}
                    data={data}
                    onJsonClick={this.executeOnJsonClick}
                />
            );
        } else if (successMessage) {
            content = (
                <FrameSuccess
                    data={data}
                    query={frame.query}
                    successMessage={successMessage}
                />
            );
        } else if (errorMessage) {
            content = (
                <FrameError
                    errorMessage={errorMessage}
                    data={data}
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
                responseFetched={!!response}
                onAfterExpandFrame={this.executeFrameQuery}
                onAfterCollapseFrame={this.cleanFrameData}
            >
                {content}
            </FrameLayout>
        );
    }
}
