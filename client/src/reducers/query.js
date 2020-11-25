// Copyright 2017-2021 Dgraph Labs, Inc. and Contributors
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

import produce from "immer";
import {
    UPDATE_QUERY,
    UPDATE_ACTION,
    UPDATE_QUERY_AND_ACTION,
    UPDATE_QUERY_VARS,
    UPDATE_READ_ONLY,
    UPDATE_BEST_EFFORT,
} from "actions/query";

const defaultState = {
    query: "",
    queryVars: [],
    allQueries: { query: "", mutate: "", alter: "" },
    action: "query",
    readOnly: false,
    bestEffort: false,
};

export default (state = defaultState, action) =>
    produce(state, draft => {
        draft.allQueries = draft.allQueries || {};
        draft.action = draft.action || "query";
        draft.allQueries[draft.action] = draft.query || "";

        switch (action.type) {
            case UPDATE_QUERY:
                draft.query = action.query;
                break;

            case UPDATE_ACTION:
                draft.action = action.action;
                draft.query = draft.allQueries[draft.action];
                break;

            case UPDATE_QUERY_AND_ACTION:
                draft.action = action.action;
                draft.query = action.query;
                break;

            case UPDATE_READ_ONLY:
                draft.readOnly = action.readOnly;
                draft.bestEffort = action.readOnly;
                break;

            case UPDATE_BEST_EFFORT:
                draft.bestEffort = action.bestEffort;
                break;

            case UPDATE_QUERY_VARS:
                draft.queryVars = action.newVars;
                break;

            default:
                break;
        }

        draft.allQueries[draft.action] = draft.query;
    });
