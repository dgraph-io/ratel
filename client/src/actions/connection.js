// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

export const UPDATE_CONNECTED_STATE = "connection/UPDATE_CONNECTED_STATE";
export const UPDATE_SHOULD_PROMPT = "connection/UPDATE_SHOULD_PROMPT";
export const UPDATE_REFRESHING = "connection/UPDATE_REFRESHING";

export function updateConnectedState(connected) {
    return {
        type: UPDATE_CONNECTED_STATE,
        connected,
    };
}

export function updateShouldPrompt() {
    return {
        type: UPDATE_SHOULD_PROMPT,
    };
}

export function updateRefreshing(refreshing) {
    return {
        type: UPDATE_REFRESHING,
        refreshing,
    };
}
