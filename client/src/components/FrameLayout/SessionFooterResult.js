// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import pluralize from "pluralize";

export default function SessionFooterResult({ currentTab, response }) {
    const currentAction = currentTab === "graph" ? "Showing" : "Found";

    return (
        <div className="row">
            <div className="col-12">
                <span className="result-message">
                    {currentAction}{" "}
                    <span className="value">{response.nodes.length}</span>{" "}
                    {pluralize("node", response.nodes.length)} and{" "}
                    <span className="value">{response.edges.length}</span>{" "}
                    {pluralize("edge", response.edges.length)}
                </span>
            </div>
        </div>
    );
}
