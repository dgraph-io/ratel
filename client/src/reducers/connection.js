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
