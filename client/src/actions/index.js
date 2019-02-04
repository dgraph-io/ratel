// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import { makeFrame } from "../lib/helpers";
import { receiveFrame, setActiveFrame } from "./frames";

/**
 * runQuery runs the query and displays the appropriate result in a frame
 * @params query {String}
 * @params action {String}
 * @params [frameId] {String}
 *
 */
export function runQuery(query, action = "query") {
    return dispatch => {
        const frame = makeFrame({ query, action });
        dispatch(receiveFrame(frame));
        dispatch(setActiveFrame(frame.id));
    };
}
