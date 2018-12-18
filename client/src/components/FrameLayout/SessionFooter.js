// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";

import SessionFooterResult from "./SessionFooterResult";
import SessionFooterProperties from "./SessionFooterProperties";

// TODO: this component isn't used at the moment. Maybe delete.

export default function SessionFooter({
    response,
    currentTab,
    hoveredNode,
    selectedNode,
}) {
    return (
        <div className="footer">
            {selectedNode || hoveredNode ? (
                <SessionFooterProperties entity={selectedNode || hoveredNode} />
            ) : (
                <SessionFooterResult
                    currentTab={currentTab}
                    response={response}
                />
            )}
        </div>
    );
}
