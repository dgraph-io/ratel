// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import { persistCombineReducers } from "redux-persist";

import frames from "./frames";
import connection from "./connection";
import query from "./query";
import ui from "./ui";
import url from "./url";

export default function makeRootReducer(config) {
    return persistCombineReducers(config, {
        frames,
        connection,
        query,
        ui,
        url,
    });
}
