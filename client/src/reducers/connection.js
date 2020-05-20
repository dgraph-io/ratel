// Copyright 2017-2020 Dgraph Labs, Inc. and Contributors
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
    DISMISS_LICENSE_WARNING,
    DO_LOGOUT,
    LOGIN_ERROR,
    LOGIN_PENDING,
    LOGIN_SUCCESS,
    LOGIN_TIMEOUT,
    SET_QUERY_TIMEOUT,
    UPDATE_URL,
    UPDATE_ACL_STATE,
    UPDATE_NETWORK_HEALTH,
    UPDATE_SERVER_HEALTH,
    UPDATE_SERVER_VERSION,
    UPDATE_ZERO_URL,
} from "../actions/connection";
import {
    MIGRATE_TO_SERVER_CONNECTION,
    MIGRATE_TO_HAVE_ZERO_URL,
} from "../actions/migration";
import {
    getDefaultUrl,
    setCurrentServerQueryTimeout,
    setCurrentServerUrl,
    sanitizeUrl,
} from "../lib/helpers";

import {
    Anonymous,
    Fetching,
    FetchError,
    LoggedIn,
    OK,
    QUERY_TIMEOUT_DEFAULT,
    SERVER_HISTORY_LENGTH,
    Unknown,
} from "../lib/constants";

const assert = (test, message = "No message") => {
    if (!test) {
        throw new Error("Assertion Failed: " + message);
    }
};

const makeServerRecord = url => ({
    url: sanitizeUrl(url),
    version: Unknown,
    adminGqlSupport: Unknown,
    health: Unknown,
    networkHealth: Unknown,
    aclState: Unknown,
    queryTimeout: QUERY_TIMEOUT_DEFAULT,

    licenseWarningDismissedTs: -1,

    loginStatus: Anonymous,
    loginError: null,

    refreshToken: null,
});

const defaultUrl = getDefaultUrl();

const defaultState = {
    serverHistory: [makeServerRecord(defaultUrl)],
};

if (defaultUrl !== "https://play.dgraph.io") {
    defaultState.serverHistory.push(makeServerRecord("https://play.dgraph.io"));
}

function addServerToHistory(history, server) {
    // Add url to the top of the list, removing duplicates.
    const other = (history || []).filter(s => s.url !== server.url);
    // Limit to max history length
    return [server, ...other].slice(0, SERVER_HISTORY_LENGTH);
}

function findServerOrMake(history, url) {
    return history.find(s => s.url === url) || makeServerRecord(url);
}

export default (state = defaultState, action) =>
    produce(state, draft => {
        const logoutServer = server =>
            Object.assign(server, {
                refreshToken: null,
                loginStatus: Anonymous,
                loginError: null,
            });

        if (!draft.serverHistory?.length) {
            draft.serverHistory = [makeServerRecord(getDefaultUrl())];
        }

        const currentServer = draft.serverHistory[0];

        const activeServer = draft.serverHistory.find(
            s => s.url === action.url,
        );

        switch (action.type) {
            case UPDATE_URL: {
                const url = action.url;
                if (!url) {
                    console.error("Attempt to add empty server", action);
                    break;
                }
                if (currentServer.url === url) {
                    break;
                }
                if (activeServer) {
                    logoutServer(activeServer);
                }
                const newServer = findServerOrMake(draft.serverHistory, url);
                draft.serverHistory = addServerToHistory(
                    state.serverHistory,
                    newServer,
                );
                setCurrentServerUrl(draft.serverHistory[0].url);
                break;
            }

            case SET_QUERY_TIMEOUT:
                assert(action.url, "This action requires url " + action.type);
                activeServer.queryTimeout = action.queryTimeout;
                if (action.url === currentServer.url) {
                    setCurrentServerQueryTimeout(activeServer.queryTimeout);
                }
                break;

            case DO_LOGOUT:
                logoutServer(currentServer);
                break;

            case LOGIN_ERROR:
                assert(action.url, "This action requires url " + action.type);
                Object.assign(activeServer, {
                    refreshToken: null,
                    loginStatus: Anonymous,
                    loginError: action.error,
                });
                break;

            case LOGIN_SUCCESS:
                assert(action.url, "This action requires url " + action.type);
                Object.assign(activeServer, {
                    refreshToken: action.refreshToken,
                    loginStatus: LoggedIn,
                    loginError: null,
                    health: OK,
                });
                break;

            case LOGIN_PENDING:
                activeServer.loginStatus = Fetching;
                activeServer.loginError = null;
                break;

            case LOGIN_TIMEOUT:
                assert(action.url, "This action requires url " + action.type);
                activeServer.loginStatus = FetchError;
                activeServer.loginError = null;
                break;

            case UPDATE_NETWORK_HEALTH:
                assert(action.url, "This action requires url " + action.type);
                activeServer.networkHealth = action.health;
                break;

            case UPDATE_ACL_STATE:
                assert(action.url, "This action requires url " + action.type);
                activeServer.aclState = action.health;
                break;

            case UPDATE_SERVER_HEALTH:
                assert(action.url, "This action requires url " + action.type);
                activeServer.health = action.health;
                break;

            case UPDATE_SERVER_VERSION:
                assert(action.url, "This action requires url " + action.type);
                activeServer.version = action.version;
                break;

            case UPDATE_ZERO_URL:
                currentServer.zeroUrl = sanitizeUrl(action.zeroUrl);
                break;

            case DISMISS_LICENSE_WARNING:
                currentServer.licenseWarningDismissedTs = Date.now();
                break;

            case MIGRATE_TO_SERVER_CONNECTION:
                if (draft.serverHistory) {
                    break;
                }
                draft.serverHistory = [];
                (action.urlHistory || []).reverse().forEach(url => {
                    draft.serverHistory = addServerToHistory(
                        draft.serverHistory,
                        makeServerRecord(url),
                    );
                });

                draft.serverHistory = addServerToHistory(
                    draft.serverHistory,
                    makeServerRecord(action.mainUrl || getDefaultUrl()),
                );

                delete draft.url;
                break;

            case MIGRATE_TO_HAVE_ZERO_URL:
                draft.serverHistory.forEach(s => {
                    s.zeroUrl = s.zeroUrl || "";
                });
                break;

            default:
                return;
        }
    });
