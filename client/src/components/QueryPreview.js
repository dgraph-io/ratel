// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";

import { collapseQuery } from "../lib/helpers";

export default function QueryPreview({ query, action, onSelectQuery }) {
    return (
        <div
            className="query-row"
            onClick={e => {
                e.preventDefault();
                onSelectQuery(query, action);

                // Scroll to top.
                // IDEA: This breaks encapsulation. Is there a better way?
                document.querySelector(".main-content").scrollTop = 0;
            }}
        >
            <i className="fa fa-search query-prompt" />{" "}
            <span className="preview">{collapseQuery(query)}</span>
        </div>
    );
}
