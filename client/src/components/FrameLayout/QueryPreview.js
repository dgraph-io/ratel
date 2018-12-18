// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import { collapseQuery } from "lib/helpers";

export default function QueryPreview({
    frameId,
    action,
    hasError,
    onSelectQuery,
    query,
}) {
    return (
        <div
            className="query-row"
            onClick={() => onSelectQuery(frameId, query, action)}
        >
            <i
                className={
                    action === "query"
                        ? "fa fa-search query-icon"
                        : "far fa-edit query-icon"
                }
            />
            // TODO: use React.Fragment to do two elements in one if-statement
            {!hasError ? null : (
                <i
                    className="extra-icon fas fa-circle"
                    style={{ color: "#fff" }}
                />
            )}
            {!hasError ? null : (
                <i className="extra-icon fas fa-times-circle" />
            )}{" "}
            <span className="preview">{collapseQuery(query)}</span>
        </div>
    );
}
