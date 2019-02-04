// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";

function getTextColor(bgColor) {
    const nThreshold = 105;
    const components = getRGBComponents(bgColor);
    const bgDelta =
        components.R * 0.299 + components.G * 0.587 + components.B * 0.114;

    return 255 - bgDelta < nThreshold ? "#000000" : "#ffffff";
}

function getRGBComponents(color) {
    const r = color.substring(1, 3);
    const g = color.substring(3, 5);
    const b = color.substring(5, 7);

    return {
        R: parseInt(r, 16),
        G: parseInt(g, 16),
        B: parseInt(b, 16),
    };
}

export default ({ color, pred, label, ...domProps }) => (
    <div
        className="label-container"
        style={{
            backgroundColor: color,
            color: getTextColor(color),
        }}
        {...domProps}
    >
        <span className="label-value">{pred}</span>
        <span className="shorthand">({label})</span>
    </div>
);
