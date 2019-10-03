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
