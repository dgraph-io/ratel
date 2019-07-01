// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import produce from "immer";

import { LOGIN_SUCCESS, SET_QUERY_TIMEOUT, UPDATE_URL } from "../actions/url";
import { getDefaultUrl } from "../lib/helpers";

const URL_HISTORY_LENGTH = 5;

const defaultState = {
    queryTimeout: 60,
    loginUser: null,
    accessJwt: null,
    refreshJwt: null,

    url: getDefaultUrl(),
    urlHistory: ["https://play.dgraph.io/"],
};

function addUrlToHistory(curHistory, url) {
    if (!url) {
        return curHistory;
    }
    // Add url to the top of the list, removing duplicates.
    const res = (curHistory || []).filter(x => x !== url);
    // Limit to max history length
    return [url, ...res].slice(0, URL_HISTORY_LENGTH);
}

export default (state = defaultState, action) =>
    produce(state, draft => {
        switch (action.type) {
            case UPDATE_URL:
                draft.urlHistory = addUrlToHistory(
                    state.urlHistory,
                    action.url,
                );
                draft.url = action.url;
                break;

            case SET_QUERY_TIMEOUT:
                draft.queryTimeout = action.queryTimeout;
                break;

            case LOGIN_SUCCESS:
                draft.accessJwt = action.accessJwt;
                draft.refreshJwt = action.refreshJwt;
                break;

            default:
                return;
        }
    });
