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
    UPDATE_SERVER_HEALTH,
} from "../actions/connection";
import { MIGRATE_TO_SERVER_CONNECTION } from "../actions/migration";
import {
    getDefaultUrl,
    setCurrentServerQueryTimeout,
    setCurrentServerUrl,
} from "../lib/helpers";

const SERVER_HISTORY_LENGTH = 5;

const QUERY_TIMEOUT_DEFAULT = 20; // Seconds

const Unknown = Symbol("Unknown");
const Fetching = Symbol("Fetching");
const FetchError = Symbol("FetchError");
const OK = Symbol("OK");

const LoggedIn = Symbol("LoggedIn");
const Anonymous = Symbol("Anonymous");

export { Unknown, Fetching, FetchError, OK, LoggedIn, Anonymous };

const makeServerRecord = url => ({
    url,
    version: Unknown,
    adminGqlSupport: Unknown,
    health: Unknown,
    queryTimeout: QUERY_TIMEOUT_DEFAULT,

    isEnterprise: Unknown,
    licenseExpiresAt: Unknown,
    licenseWarningDismissedTs: -1,

    loginStatus: Anonymous,
    loginError: null,

    refreshToken: null,
});

const defaultServer = makeServerRecord(getDefaultUrl());
const defaultState = {
    currentServer: defaultServer,
    serverHistory: [defaultServer],
};

if (defaultServer.url !== "https://play.dgraph.io/") {
    defaultState.serverHistory.push(
        makeServerRecord("https://play.dgraph.io/"),
    );
}

function addServerToHistory(history, server) {
    // Add url to the top of the list, removing duplicates.
    const other = (history || []).filter(s => s.url !== server.url);
    // Limit to max history length
    return [server, ...other].slice(0, SERVER_HISTORY_LENGTH);
}

function findServer(history, url) {
    return history.find(s => s.url === url) || makeServerRecord(url);
}

export default (state = defaultState, action) =>
    produce(state, draft => {
        const logoutCurrentServer = () =>
            Object.assign(draft.currentServer, {
                refreshToken: null,
                loginStatus: Anonymous,
                loginError: null,
            });

        switch (action.type) {
            case UPDATE_URL: {
                const url = action.url;
                if (!url) {
                    console.error("Attempt to add empty server", action);
                    break;
                }
                if (draft.currentServer.url === url) {
                    break;
                }
                logoutCurrentServer();
                const newServer = findServer(draft.serverHistory, url);
                draft.serverHistory = addServerToHistory(
                    state.serverHistory,
                    newServer,
                );
                draft.currentServer = newServer;
                setCurrentServerUrl(draft.currentServer.url);
                break;
            }

            case SET_QUERY_TIMEOUT:
                draft.currentServer.queryTimeout = action.queryTimeout;
                setCurrentServerQueryTimeout(draft.currentServer.queryTimeout);
                break;

            case DO_LOGOUT:
                logoutCurrentServer();
                break;

            case LOGIN_ERROR:
                Object.assign(draft.currentServer, {
                    refreshToken: null,
                    loginStatus: Anonymous,
                    loginError: action.error,
                });
                break;

            case LOGIN_SUCCESS:
                Object.assign(draft.currentServer, {
                    refreshToken: action.refreshToken,
                    loginStatus: LoggedIn,
                    loginError: action.error,
                    health: OK,
                });
                break;

            case LOGIN_PENDING:
                draft.currentServer.loginStatus = Fetching;
                draft.currentServer.loginError = null;
                break;

            case LOGIN_TIMEOUT:
                draft.currentServer.loginStatus = FetchError;
                draft.currentServer.loginError = null;
                break;

            case UPDATE_SERVER_HEALTH:
                draft.currentServer.health = action.health;
                break;

            case DISMISS_LICENSE_WARNING:
                draft.currentServer.licenseWarningDismissedTs = Date.now();
                break;

            case MIGRATE_TO_SERVER_CONNECTION:
                if (draft.currentServer) {
                    break;
                }
                draft.currentServer = makeServerRecord(
                    draft?.url?.url || getDefaultUrl(),
                );
                draft.serverHistory = [draft.currentServer];
                if (defaultServer.url !== "https://play.dgraph.io/") {
                    defaultState.serverHistory.push(
                        makeServerRecord("https://play.dgraph.io/"),
                    );
                }
                delete draft.url;
                break;

            default:
                return;
        }
    });
