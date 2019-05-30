// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";

export default function PartialRenderInfo({ remainingNodes, onExpandNetwork }) {
    return (
        <div className="partial-render-info">
            Only a subset of the graph was rendered.
            <button
                className="btn btn-link"
                style={{ verticalAlign: "baseline" }}
                onClick={onExpandNetwork}
            >
                Expand remaining {remainingNodes} nodes.
            </button>
        </div>
    );
}
