/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { produce } from "immer";
import {
    RECEIVE_FRAME,
    DISCARD_FRAME,
    SET_ACTIVE_FRAME,
    SET_RESULTS_TAB,
    START_FRAME_EXECUTION,
    FRAME_REQUEST_ERROR,
    FRAME_REQUEST_COMPLETED,
    TAB_VISUAL,
    TAB_JSON,
} from "actions/frames";

const defaultState = {
    items: [],
    tab: TAB_VISUAL,
    frameResults: {},
};

function getFrameTiming(executionStart, extensions) {
    const fullRequestTimeNs = (Date.now() - executionStart) * 1e6;
    if (!extensions || !extensions.server_latency) {
        return {
            serverLatencyNs: 0,
            networkLatencyNs: fullRequestTimeNs,
        };
    }
    const { parsing_ns, processing_ns, encoding_ns } =
        extensions.server_latency;
    const serverLatencyNs = parsing_ns + processing_ns + (encoding_ns || 0);
    return {
        serverLatencyNs,
        networkLatencyNs: fullRequestTimeNs - serverLatencyNs,
    };
}

export default (state = defaultState, action) =>
    produce(state, (draft) => {
        switch (action.type) {
            case RECEIVE_FRAME: {
                const { frame } = action;
                if (draft.items.length) {
                    const lastFrame = draft.items[0];
                    if (
                        lastFrame.action === frame.action &&
                        lastFrame.query === frame.query
                    ) {
                        // Remove last query if it is identical to the new one
                        draft.items.shift();
                    }
                }
                draft.items.unshift(frame);
                draft.frameResults[frame.id] = {
                    [TAB_JSON]: { canExecute: true },
                    [TAB_VISUAL]: { canExecute: true },
                };
                break;
            }

            case DISCARD_FRAME:
                draft.items = draft.items.filter(
                    (item) => item.id !== action.frameId,
                );
                break;

            case SET_ACTIVE_FRAME:
                draft.activeFrameId = action.frameId;
                break;

            case SET_RESULTS_TAB:
                draft.tab = action.tab;
                break;

            case START_FRAME_EXECUTION: {
                const { executionStart, frameId, tabName } = action;
                const frameResult = draft.frameResults[frameId][tabName] || {};
                frameResult.executionStart = executionStart;
                frameResult.canExecute = false;
                break;
            }

            case FRAME_REQUEST_ERROR: {
                const { error, frameId, tabName } = action;
                const frameResult = draft.frameResults[frameId][tabName] || {};

                frameResult.completed = true;
                frameResult.error = error;

                Object.assign(
                    frameResult,
                    getFrameTiming(frameResult.executionStart, {}),
                );
                break;
            }

            case FRAME_REQUEST_COMPLETED: {
                const { frameId, response, tabName } = action;
                const frameResult = draft.frameResults[frameId][tabName] || {};

                frameResult.response = response;
                frameResult.completed = true;

                frameResult.error = response.errors?.[0];

                Object.assign(
                    frameResult,
                    getFrameTiming(
                        frameResult.executionStart,
                        response.extensions,
                    ),
                );
                break;
            }

            default:
                break;
        }
    });
