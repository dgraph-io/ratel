// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";

export default function FrameMessageTab({ message }) {
    return (
        <div className="content-container">
            <div className="text-content">{message}</div>
        </div>
    );
}
