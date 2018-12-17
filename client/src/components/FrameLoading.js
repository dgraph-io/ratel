// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";

import loader from "../assets/images/loader.svg";

export default function FrameLoading() {
    return (
        <div className="loading-container">
            <div className="loading-content">
                <img src={loader} alt="loading-indicator" className="loader" />
                <div className="text">Fetching result...</div>
            </div>
        </div>
    );
}
