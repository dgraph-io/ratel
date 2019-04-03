// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

export const SET_PANEL_SIZE = "ui/SET_PANEL_SIZE";
export const SET_PANEL_MINIMIZED = "ui/SET_PANEL_MINIMIZED";
export const SET_QUERY_TIMEOUT = "ui/SET_QUERY_TIMEOUT";

export function setPanelSize({ width, height }) {
    return {
        type: SET_PANEL_SIZE,
        width,
        height,
    };
}

export function setPanelMinimized(minimized) {
    return {
        type: SET_PANEL_MINIMIZED,
        minimized,
    };
}

export function setQueryTimeout(queryTimeout) {
    return {
        type: SET_QUERY_TIMEOUT,
        queryTimeout,
    };
}
