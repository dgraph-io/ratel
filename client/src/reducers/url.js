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

import produce from "immer";

import {
    DO_LOGOUT,
    LOGIN_ERROR,
    LOGIN_PENDING,
    LOGIN_SUCCESS,
    LOGIN_TIMEOUT,
    SET_QUERY_TIMEOUT,
    UPDATE_URL,
} from "../actions/url";
import { getDefaultUrl } from "../lib/helpers";

const URL_HISTORY_LENGTH = 5;

const QUERY_TIMEOUT_DEFAULT = 20; // Seconds

const defaultState = {
    queryTimeout: QUERY_TIMEOUT_DEFAULT,
    loginUser: null,
    accessToken: null,
    refreshToken: null,

    loginPending: false,

    url: getDefaultUrl(),
    urlHistory: [getDefaultUrl(), "https://play.dgraph.io/"],
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

            case DO_LOGOUT:
                draft.accessToken = draft.refreshToken = null;
                break;

            case LOGIN_ERROR:
                draft.loginError = action.error;
                draft.loginPending = false;

                // Logout, because maybe we got bad tokens.
                draft.accessToken = draft.refreshToken = null;
                break;

            case LOGIN_SUCCESS:
                draft.loginError = undefined;
                draft.loginPending = false;

                draft.accessToken = action.accessToken;
                draft.refreshToken = action.refreshToken;
                break;

            case LOGIN_PENDING:
                draft.loginPending = true;
                draft.loginError = undefined;
                break;

            case LOGIN_TIMEOUT:
                draft.loginPending = false;
                break;

            default:
                return;
        }
    });
