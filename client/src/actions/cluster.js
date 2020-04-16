// Copyright 2020 Dgraph Labs, Inc. and Contributors
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

import { getDgraphClientStub } from "lib/helpers";

export const GET_INSTANCE_HEALTH_RESULT = "cluster/GET_INSTANCE_HEALTH_RESULT";
export const GET_CLUSTER_STATE_RESULT = "cluster/GET_CLUSTER_STATE_RESULT";

export function getInstanceHealth() {
    return async (dispatch, getState) => {
        const clientStub = await getDgraphClientStub();

        try {
            const health = await clientStub.getHealth(true);
            dispatch(getInstanceHealthResult(health));
        } catch (err) {
            // Ignore auth errors
            console.error(err);
            dispatch(
                getInstanceHealthResult([
                    {
                        error: "You must be logged in",
                    },
                ]),
            );
        }
    };
}

export function getInstanceHealthResult(json) {
    return {
        type: GET_INSTANCE_HEALTH_RESULT,
        json,
    };
}

export function getClusterState() {
    return async (dispatch, getState) => {
        const client = await getDgraphClientStub();

        try {
            const clusterState = await client.getState();
            dispatch(getClusterStateResult(clusterState));
        } catch (err) {
            // Ignore auth errors
        }
    };
}

export function getClusterStateResult(json) {
    return {
        type: GET_CLUSTER_STATE_RESULT,
        json,
    };
}
