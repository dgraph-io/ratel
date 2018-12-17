// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import pluralize from "pluralize";

import { humanizeTime, serverLatency } from "../lib/helpers";

export default function SessionFooterResult({
    graphRenderTime,
    treeRenderTime,
    currentTab,
    response,
}) {
    let currentAction;
    if (currentTab === "graph" || currentTab === "tree") {
        currentAction = "Showing";
    } else {
        currentAction = "Found";
    }

    return (
        <div className="row">
            <div className="col-12 col-sm-8">
                <i className="fa fa-check check-mark" />{" "}
                <span className="result-message">
                    {currentAction}{" "}
                    <span className="value">{response.numNodes}</span>{" "}
                    {pluralize("node", response.numNodes)} and{" "}
                    <span className="value">{response.numEdges}</span>{" "}
                    {pluralize("edge", response.numEdges)}
                </span>
            </div>
            <div className="col-12 col-sm-4">
                <div className="latency stats">
                    {response.rawResponse.extensions &&
                    response.rawResponse.extensions.server_latency ? (
                        <div className="stat">
                            Server latency:&nbsp;
                            <span className="value">
                                {serverLatency(
                                    response.rawResponse.extensions
                                        .server_latency,
                                )}
                            </span>
                        </div>
                    ) : null}
                    {graphRenderTime && currentTab === "graph" ? (
                        <div className="stat">
                            Rendering latency:&nbsp;
                            <span className="value">
                                {humanizeTime(graphRenderTime)}
                            </span>
                        </div>
                    ) : null}
                    {treeRenderTime && currentTab === "tree" ? (
                        <div className="stat">
                            Rendering latency:&nbsp;
                            <span className="value">
                                {humanizeTime(treeRenderTime)}
                            </span>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
