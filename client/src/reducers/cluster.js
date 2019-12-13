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

import { GET_CLUSTER_HEALTH, GET_CLUSTER_STATE } from "../actions/cluster";

const defaultState = {
    health: {
        default: "",
        all: "",
    },
    state: "",
};

export default function connection(state = defaultState, action) {
    switch (action.type) {
        case GET_CLUSTER_HEALTH:
            return {
                ...state,
                health: Object.assign({}, state.health, {
                    [action.group]: action.json,
                }),
            };
        case GET_CLUSTER_STATE:
            return {
                ...state,
                state: action.json,
            };
        default:
            return state;
    }
}
