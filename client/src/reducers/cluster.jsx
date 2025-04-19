/*
 * SPDX-FileCopyrightText: Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { produce } from "immer"

import {
    GET_INSTANCE_HEALTH_RESULT,
    GET_CLUSTER_STATE_RESULT,
    SET_IS_AUTHORIZED,
} from "actions/cluster"

const defaultState = {
    instanceHealth: null,
    clusterState: null,
}

export default (state = defaultState, action) =>
    produce(state, (draft) => {
        switch (action.type) {
            case GET_INSTANCE_HEALTH_RESULT:
                draft.instanceHealth = action.json
                break

            case GET_CLUSTER_STATE_RESULT:
                draft.clusterState = action.json
                break

            case SET_IS_AUTHORIZED:
                draft.isAuthorized = action.isAuthorized
                break

            default:
                return
        }
    })
