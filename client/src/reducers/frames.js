// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
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
    SET_SELECTED_FRAME,
    SET_ACTIVE_FRAME,
    UPDATE_FRAMES_TAB,
} from "../actions/frames";

const defaultState = {
    items: [],
    tab: "graph",
};

export default (state = defaultState, action) =>
    produce(state, draft => {
        switch (action.type) {
            case RECEIVE_FRAME:
                draft.items.unshift(action.frame);
                break;

            case DISCARD_FRAME:
                draft.items = draft.items.filter(
                    item => item.id !== action.frameId,
                );
                break;

            case PATCH_FRAME:
                Object.assign(
                    draft.items.find(frame => frame.id === action.id),
                    action.frameData,
                );
                break;

            case SET_SELECTED_FRAME:
                draft.selectedFrameId = action.frameId;
                return;

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
