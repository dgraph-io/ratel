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

import produce from "immer";

import {
    GET_INSTANCE_HEALTH_RESULT,
    GET_CLUSTER_STATE_RESULT,
    SET_IS_AUTHORIZED,
} from "actions/cluster";

const defaultState = {
    instanceHealth: null,
    clusterState: null,
};

export default (state = defaultState, action) =>
    produce(state, draft => {
        switch (action.type) {
            case GET_INSTANCE_HEALTH_RESULT:
                draft.instanceHealth = action.json;
                break;

            case GET_CLUSTER_STATE_RESULT:
                draft.clusterState = action.json;
                break;

            case SET_IS_AUTHORIZED:
                draft.isAuthorized = action.isAuthorized;
                break;

            default:
                return;
        }
    });
