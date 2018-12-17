// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import {
    UPDATE_QUERY,
    UPDATE_ACTION,
    UPDATE_QUERY_AND_ACTION,
} from "../actions/query";

const defaultState = {
    query: "",
    allQueries: { query: "", mutate: "", alter: "" },
    action: "query",
};

export default function query(state = defaultState, action) {
    switch (action.type) {
        case UPDATE_QUERY:
            return {
                ...state,
                query: action.query,
            };
        case UPDATE_ACTION:
            state.allQueries[state.action] = state.query || "";
            return {
                ...state,
                query: state.allQueries[action.action] || "",
                action: action.action,
            };
        case UPDATE_QUERY_AND_ACTION:
            state.allQueries[state.action] = state.query || "";
            return {
                ...state,
                query: action.query,
                action: action.action,
            };
        default:
            return state;
    }
}
