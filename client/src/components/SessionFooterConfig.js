// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";

// TODO: Implement customization for label based on nodetype not global regex.
export default function SessionFooterConfig() {
    return (
        <div>
            <input
                type="text"
                placeholder="Enter regex to customize node labels"
            />
        </div>
    );
}
