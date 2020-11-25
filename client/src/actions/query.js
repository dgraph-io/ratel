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

export const UPDATE_QUERY = "query/UPDATE_QUERY";
export const UPDATE_ACTION = "query/UPDATE_ACTION";
export const UPDATE_QUERY_AND_ACTION = "query/UPDATE_QUERY_AND_ACTION";
export const UPDATE_QUERY_VARS = "query/UPDATE_QUERY_VARS";
export const UPDATE_READ_ONLY = "query/UPDATE_READ_ONLY";
export const UPDATE_BEST_EFFORT = "query/UPDATE_BEST_EFFORT";

export function updateQuery(query) {
    return {
        type: UPDATE_QUERY,
        query,
    };
}

export function updateAction(action) {
    return {
        type: UPDATE_ACTION,
        action,
    };
}

export function updateQueryAndAction(query, action) {
    return {
        type: UPDATE_QUERY_AND_ACTION,
        query,
        action,
    };
}

export function updateReadOnly(readOnly) {
    return {
        type: UPDATE_READ_ONLY,
        readOnly,
    };
}

export function updateBestEffort(bestEffort) {
    return {
        type: UPDATE_BEST_EFFORT,
        bestEffort,
    };
}

export const updateQueryVars = newVars => ({
    type: UPDATE_QUERY_VARS,
    newVars,
});
