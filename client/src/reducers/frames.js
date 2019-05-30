// Copyright 2017-2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import produce from "immer";
import {
    RECEIVE_FRAME,
    DISCARD_FRAME,
    PATCH_FRAME,
    PATCH_FRAME_RESULT,
    SET_ACTIVE_FRAME,
    UPDATE_FRAMES_TAB,
} from "../actions/frames";

const defaultState = {
    items: [],
    tab: "graph",
    frameResults: {},
};

export default (state = defaultState, action) =>
    produce(state, draft => {
        switch (action.type) {
            case RECEIVE_FRAME:
                const { frame } = action;
                if (draft.items.length) {
                    const lastFrame = draft.items[0];
                    if (
                        lastFrame.action === frame.action &&
                        lastFrame.query === frame.query
                    ) {
                        draft.items.shift();
                    }
                }
                draft.items.unshift(frame);
                break;

            case DISCARD_FRAME:
                draft.items = draft.items.filter(
                    item => item.id !== action.frameId,
                );
                break;

            case PATCH_FRAME:
                Object.assign(
                    draft.items.find(frame => frame.id === action.id) || {},
                    action.frameData,
                );
                break;

            case PATCH_FRAME_RESULT:
                const frameId = action.id;
                draft.frameResults[frameId] = draft.frameResults[frameId] || {};
                draft.frameResults[frameId][action.tab] = Object.assign(
                    draft.frameResults[frameId][action.tab] || {},
                    action.data,
                );
                break;

            case SET_ACTIVE_FRAME:
                draft.activeFrameId = action.frameId;
                return;

            case UPDATE_FRAMES_TAB:
                draft.tab = action.tab;
                return;

            default:
                return;
        }
    });
