// Copyright 2017-2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import { executeQuery } from "lib/helpers";

export const RECEIVE_FRAME = "frames/RECEIVE_FRAME";
export const DISCARD_FRAME = "frames/DISCARD_FRAME";
export const DISCARD_ALL_FRAMES = "frames/DISCARD_ALL_FRAMES";
export const PATCH_FRAME = "frames/PATCH_FRAME";
export const PATCH_FRAME_RESULT = "frames/PATCH_FRAME_RESULT";
export const UPDATE_FRAMES_TAB = "frames/UPDATE_FRAMES_TAB";
export const SET_ACTIVE_FRAME = "frames/SET_ACTIVE_FRAME";

export const SHOW_FRAME = "frames/SHOW_FRAME";

export function receiveFrame({ id, ...frameProps }) {
    return {
        type: RECEIVE_FRAME,
        frame: {
            id,
            ...frameProps,
        },
    };
}

export function discardFrame(frameId) {
    return {
        type: DISCARD_FRAME,
        frameId,
    };
}

export function setActiveFrame(frameId) {
    return (dispatch, getState) => {
        dispatch({
            type: SET_ACTIVE_FRAME,
            frameId,
        });
        // TODO: there's a prettier way to call another dispatcher. Find it.
        showFrame(frameId)(dispatch, getState);
    };
}

export function patchFrame(id, frameData) {
    return {
        type: PATCH_FRAME,
        id,
        frameData,
    };
}

export function patchFrameResult(id, tab, data) {
    return {
        type: PATCH_FRAME_RESULT,
        id,
        tab,
        data,
    };
}

export function updateFramesTab(tab) {
    return (dispatch, getState) => {
        dispatch({
            type: UPDATE_FRAMES_TAB,
            tab,
        });
        // TODO: there's a prettier way to call another dispatcher. Find it.
        showFrame(getState().frames.activeFrameId)(dispatch, getState);
    };
}

function getFrameTiming(executionStart, extensions) {
    const fullRequestTimeNs = (Date.now() - executionStart) * 1e6;
    if (!extensions || !extensions.server_latency) {
        return {
            serverLatencyNs: 0,
            networkLatencyNs: fullRequestTimeNs,
        };
    }
    const {
        parsing_ns,
        processing_ns,
        encoding_ns,
    } = extensions.server_latency;
    const serverLatencyNs = parsing_ns + processing_ns + (encoding_ns || 0);
    return {
        serverLatencyNs,
        networkLatencyNs: fullRequestTimeNs - serverLatencyNs,
    };
}

export function showFrame(frameId) {
    return async (dispatch, getState) => {
        const { frames: state, url } = getState();

        const frameResult = state.frameResults[frameId] || {};
        const frame = state.items.find(x => x.id === frameId);

        const tabName = frame.action === "mutate" ? "mutate" : state.tab;
        const tabResult = frameResult[tabName] || {};

        if (tabResult.executionStart) {
            // Request for this tab has already been sent
            return;
        }

        if (frameResult.executionStart && tabName === "mutate") {
            // Mutate can be executed only once, regardless of the results tab.
            return;
        }

        const executionStart = Date.now();
        dispatch(patchFrame(frame.id, { executionStart }));
        dispatch(patchFrameResult(frame.id, tabName, { executionStart }));

        const isGraph = tabName === "graph";
        let response = null;

        try {
            response = await executeQuery(url.url, frame.query, {
                action: frame.action,
                debug: isGraph,
            });
        } catch (error) {
            dispatch(
                patchFrameResult(frame.id, tabName, {
                    ...getFrameTiming(executionStart),
                    error,
                    hasError: true,
                }),
            );
            // Could not get a response. Abort.
            return;
        } finally {
            dispatch(
                patchFrameResult(frame.id, tabName, {
                    completed: true,
                }),
            );
            dispatch(
                patchFrame(frame.id, {
                    completed: true,
                }),
            );
        }
        dispatch(patchFrameResult(frame.id, tabName, { response }));
        dispatch(
            patchFrame(frame.id, {
                ...getFrameTiming(executionStart, response.extensions),
                message: response && response.message,
                error: response && response.errors && response.errors[0],
                hasError: !!response.errors,
            }),
        );
    };
}
