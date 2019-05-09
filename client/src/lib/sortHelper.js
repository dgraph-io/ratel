// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";

export default function sortDataGrid(sortColumn, sortDirection, data) {
    const comparer = (a, b) => {
        const sortDir = sortDirection === "ASC" ? 1 : -1;

        const aValue = React.isValidElement(a[sortColumn])
            ? a[sortColumn].props.datasortkey
            : a[sortColumn];
        const bValue = React.isValidElement(b[sortColumn])
            ? b[sortColumn].props.datasortkey
            : b[sortColumn];

        return aValue > bValue ? sortDir : -sortDir;
    };
    return sortDirection === "NONE" ? data : data.sort(comparer);
}
