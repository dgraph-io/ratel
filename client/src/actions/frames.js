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

import uuid from "uuid";

import { executeQuery } from "lib/helpers";

export const RECEIVE_FRAME = "frames/RECEIVE_FRAME";
export const DISCARD_FRAME = "frames/DISCARD_FRAME";
export const DISCARD_ALL_FRAMES = "frames/DISCARD_ALL_FRAMES";
export const SET_ACTIVE_FRAME = "frames/SET_ACTIVE_FRAME";
export const SET_RESULTS_TAB = "frames/SET_RESULTS_TAB";
export const START_FRAME_EXECUTION = "frames/START_FRAME_EXECUTION";

export const EXECUTE_FRAME = "frames/EXECUTE_FRAME";
export const FRAME_REQUEST_ERROR = "frames/FRAME_REQUEST_ERROR";
export const FRAME_REQUEST_COMPLETED = "frames/FRAME_REQUEST_COMPLETED";

export const TAB_VISUAL = "graph";
export const TAB_JSON = "json";
export const TAB_QUERY = "userQuery";

export const ALLOWED_RESULT_TABS = [TAB_VISUAL, TAB_JSON, TAB_QUERY];

export function receiveFrame(frame) {
    return {
        type: RECEIVE_FRAME,
        frame,
    };
}

/**
 * runQuery runs the query and displays the appropriate result in a frame
 * @params query {String}
 * @params action {String}
 * @params [frameId] {String}
 *
 */
export function runQuery(query, action = "query") {
    return dispatch => {
        const frame = {
            action,
            id: uuid(),
            query,
        };
        dispatch(receiveFrame(frame));
        dispatch(setActiveFrame(frame.id));
        dispatch(executeFrame(frame.id));
    };
}

export function discardFrame(frameId) {
    return {
        type: DISCARD_FRAME,
        frameId,
    };
}

export function setActiveFrame(frameId) {
    return {
        type: SET_ACTIVE_FRAME,
        frameId,
    };
}

export function setResultsTab(tab) {
    return (dispatch, getState) => {
        if (ALLOWED_RESULT_TABS.indexOf(tab) < 0) {
            tab = TAB_JSON;
        }
        dispatch({
            type: SET_RESULTS_TAB,
            tab,
        });
        dispatch(executeFrame(getState().frames.activeFrameId));
    };
}

export function executeFrame(frameId) {
    return async (dispatch, getState) => {
        const { frames, url } = getState();

        if (frames.tab === TAB_QUERY) {
            return;
        }

        const frameResult = frames.frameResults[frameId] || {};
        const frame = frames.items.find(x => x.id === frameId);

        const tabName = frame.action === "mutate" ? TAB_JSON : frames.tab;
        const tabResult = frameResult[tabName] || {};

        if (!tabResult.canExecute) {
            // This tab has been executed already.
            return;
        }

        dispatch(startFrameExecution(frame.id, tabName));

        try {
            const response = await executeQuery(url.url, frame.query, {
                action: frame.action,
                debug: tabName === "graph",
                queryTimeout: url.queryTimeout,
            });
            dispatch(frameRequestCompleted(frame.id, tabName, response));
        } catch (error) {
            dispatch(frameRequestError(frame.id, tabName, error));
        }
    };
}

export function startFrameExecution(frameId, tabName) {
    return {
        type: START_FRAME_EXECUTION,
        frameId,
        tabName,
        executionStart: Date.now(),
    };
}

export function frameRequestError(frameId, tabName, error) {
    return {
        type: FRAME_REQUEST_ERROR,
        frameId,
        tabName,
        error,
    };
}

export function frameRequestCompleted(frameId, tabName, response) {
    return {
        type: FRAME_REQUEST_COMPLETED,
        frameId,
        tabName,
        response,
    };
}
