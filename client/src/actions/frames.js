// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

export const RECEIVE_FRAME = "frames/RECEIVE_FRAME";
export const DISCARD_FRAME = "frames/DISCARD_FRAME";
export const DISCARD_ALL_FRAMES = "frames/DISCARD_ALL_FRAMES";
export const PATCH_FRAME = "frames/PATCH_FRAME";
export const UPDATE_FRAMES_TAB = "frames/UPDATE_FRAMES_TAB";
export const SET_ACTIVE_FRAME = "frames/SET_ACTIVE_FRAME";

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
    return {
        type: SET_ACTIVE_FRAME,
        frameId,
    };
}

export function patchFrame(id, frameData) {
    return {
        type: PATCH_FRAME,
        id,
        frameData,
    };
}

export function updateFramesTab(tab) {
    return {
        type: UPDATE_FRAMES_TAB,
        tab,
    };
}
