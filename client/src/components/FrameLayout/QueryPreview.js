// Copyright 2017-2021 Dgraph Labs, Inc. and Contributors
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

// CollapseQuery replaces deeply nested blocks in a query with ellipsis.
export function collapseQuery(query) {
    const depthLimit = 3;
    let ret = "";
    let depth = 0;

    for (let i = 0; i < query.length; i++) {
        let char = query[i];

        if (char === "{") {
            depth++;

            if (depth === depthLimit) {
                ret += char;
                ret += " ... ";
                continue;
            }
        } else if (char === "}") {
            depth--;
        }

        if (depth >= depthLimit) {
            continue;
        }

        ret += char;
    }

    return ret;
}

export default function QueryPreview({
    frameId,
    action,
    hasError,
    onClick,
    query,
}) {
    return (
        <div className="query-row" onClick={onClick}>
            <i
                className={
                    action === "query"
                        ? "fa fa-search query-icon"
                        : "far fa-edit query-icon"
                }
            />
            {!hasError ? null : (
                <React.Fragment>
                    <i
                        className="extra-icon fas fa-circle"
                        style={{ color: "#fff" }}
                    />
                    <i className="extra-icon fas fa-times-circle" />
                </React.Fragment>
            )}{" "}
            <span className="preview">{collapseQuery(query)}</span>
        </div>
    );
}
