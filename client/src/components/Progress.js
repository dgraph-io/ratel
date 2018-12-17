// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import ProgressBar from "react-bootstrap/lib/ProgressBar";

import "../assets/css/Graph.scss";

export default function Progress({ perc }) {
    return (
        <ProgressBar
            className="Graph-progress"
            active={true}
            now={perc}
            min={0}
            max={100}
            label={`${perc}%`}
        />
    );
}
