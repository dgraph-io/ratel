// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";

export default function PartialRenderInfo({
    canExpand,
    remainingNodes,
    onExpandNetwork,
}) {
    return (
        <div className="partial-render-info">
            {canExpand ? (
                <div>
                    Only a subset of graph was rendered.{" "}
                    <a
                        href="#expand"
                        onClick={e => {
                            e.preventDefault();
                            onExpandNetwork();
                        }}
                    >
                        Expand remaining {remainingNodes} nodes.
                    </a>
                </div>
            ) : null}
        </div>
    );
}
