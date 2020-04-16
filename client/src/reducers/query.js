// Copyright 2017-2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
    UPDATE_QUERY,
    UPDATE_ACTION,
    UPDATE_QUERY_AND_ACTION,
    UPDATE_READ_ONLY,
    UPDATE_BEST_EFFORT,
} from "../actions/query";

const defaultState = {
    query: "",
    allQueries: { query: "", mutate: "", alter: "" },
    action: "query",
    readOnly: true,
    bestEffort: true,
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
        case UPDATE_READ_ONLY:
            return {
                ...state,
                readOnly: action.readOnly,
                bestEffort: action.readOnly,
            };
        case UPDATE_BEST_EFFORT:
            return {
                ...state,
                bestEffort: action.bestEffort,
            };
        default:
            return state;
    }
}
