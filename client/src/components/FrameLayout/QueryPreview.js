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
