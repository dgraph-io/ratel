// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import { UPDATE_URL } from "../actions/url";

import { getDefaultUrl } from "../lib/helpers";

const URL_HISTORY_LENGTH = 5;

const defaultState = {
    url: getDefaultUrl(),
    urlHistory: ["https://play.dgraph.io/"],
};

function addUrlToHistory(curHistory, url) {
    if (!url) {
        return curHistory;
    }
    // Add url to the top of the list, removing duplicates.
    const res = (curHistory || []).filter(x => x !== url);
    res.splice(0, 0, url);
    // Limit to max history length
    return res.slice(0, URL_HISTORY_LENGTH);
}

export default function url(state = defaultState, action) {
    switch (action.type) {
        case UPDATE_URL:
            return {
                ...state,
                urlHistory: addUrlToHistory(state.urlHistory, action.url),
                url: action.url,
            };
        default:
            return state;
    }
}
