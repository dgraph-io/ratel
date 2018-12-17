// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import {
    UPDATE_CONNECTED_STATE,
    UPDATE_SHOULD_PROMPT,
    UPDATE_REFRESHING,
} from "../actions/connection";

const defaultState = {
    connected: false,
    shouldPrompt: false,
    refreshing: false,
};

export default function connection(state = defaultState, action) {
    switch (action.type) {
        case UPDATE_CONNECTED_STATE:
            return {
                ...state,
                connected: action.connected,
                shouldPrompt: !action.connected,
                refreshing: false,
            };
        case UPDATE_SHOULD_PROMPT:
            return {
                ...state,
                shouldPrompt: !state.connected,
                refreshing: false,
            };
        case UPDATE_REFRESHING:
            return {
                ...state,
                refreshing: action.refreshing,
            };
        default:
            return state;
    }
}
