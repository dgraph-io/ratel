// Copyright 2017-2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
