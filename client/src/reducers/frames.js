// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import {
    RECEIVE_FRAME,
    DISCARD_FRAME,
    PATCH_FRAME,
    UPDATE_FRAME,
    DISCARD_ALL_FRAMES,
    UPDATE_FRAMES_TAB,
} from "../actions/frames";

const defaultState = {
    items: [],
    tab: "graph",
};

const frames = (state = defaultState, action) => {
    switch (action.type) {
        case RECEIVE_FRAME:
            return {
                ...state,
                items: [action.frame, ...state.items],
            };
        case DISCARD_FRAME:
            return {
                ...state,
                items: state.items.filter(item => item.id !== action.frameID),
            };
        case DISCARD_ALL_FRAMES:
            return {
                ...state,
                items: defaultState.items,
            };
        case PATCH_FRAME:
            return {
                ...state,
                items: state.items.map(item => {
                    if (item.id === action.id) {
                        return { ...item, ...action.frameData };
                    } else {
                        return item;
                    }
                }),
            };
        case UPDATE_FRAME:
            return {
                ...state,
                items: state.items.map(item => {
                    if (item.id === action.id) {
                        return { ...item, ...action.frame };
                    }

                    return item;
                }),
            };
        case UPDATE_FRAMES_TAB:
            return {
                ...state,
                tab: action.tab,
            };
        default:
            return state;
    }
};

export default frames;
