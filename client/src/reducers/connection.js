/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { produce } from "immer";

import {
    DISMISS_LICENSE_WARNING,
    DO_LOGOUT,
    LOGIN_ERROR,
    LOGIN_PENDING,
    LOGIN_SUCCESS,
    LOGIN_TIMEOUT,
    SET_ACL_ENABLED,
    SET_BACKUP_ENABLED,
    SET_QUERY_TIMEOUT,
    SET_SLASH_API_KEY,
    SET_AUTH_TOKEN,
    REMOVE_URL,
    UPDATE_URL,
    UPDATE_ACL_STATE,
    UPDATE_NETWORK_HEALTH,
    UPDATE_SERVER_HEALTH,
    UPDATE_SERVER_VERSION,
    UPDATE_ZERO_URL,
    SET_MULTI_TENANCY_ENABLED,
    SET_URL_AND_SLASH_API_KEY,
} from "actions/connection";
import {
    MIGRATE_TO_SERVER_CONNECTION,
    MIGRATE_TO_HAVE_ZERO_URL,
} from "actions/migration";
import {
    getDefaultUrl,
    setCurrentServerQueryTimeout,
    setCurrentServerSlashApiKey,
    setCurrentServerAuthToken,
    setCurrentServerUrl,
    sanitizeUrl,
} from "lib/helpers";

import {
    Anonymous,
    Fetching,
    FetchError,
    LoggedIn,
    OK,
    QUERY_TIMEOUT_DEFAULT,
    SERVER_HISTORY_LENGTH,
    Unknown,
} from "lib/constants";

const HYPERMODE_HOST_DOMAIN = "hypermode.host";
const HYPERMODE_STAGE_HOST_DOMAIN = "hypermode-stage.host";

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
    slashApiKey: null,
    accessToken: null,
    isAclEnabled: true,
    isBackupEnabled: true,

    licenseWarningDismissedTs: -1,

    loginStatus: Anonymous,
    loginError: null,

    refreshToken: null,
});

const defaultUrl = getDefaultUrl();

const defaultState = {
    serverHistory: [makeServerRecord(defaultUrl)],
};

const PLAYGROUND_URL = "https://play.dgraph.io";
const makePlayRecord = () => makeServerRecord(PLAYGROUND_URL);

if (defaultUrl !== PLAYGROUND_URL) {
    defaultState.serverHistory.push(makePlayRecord());
}

// Returns a server history array with a new record added as the first
// (most recent) entry.
function historyPlusServer(history, server) {
    // Add url to the top of the list, removing duplicates.
    const other = (history || []).filter(s => s.url !== server.url);
    // Limit to max history length
    return [server, ...other].slice(0, SERVER_HISTORY_LENGTH);
}

function findServerOrMake(history, url) {
    return history.find(s => s.url === url) || makeServerRecord(url);
}

const logoutServer = server => {
    Object.assign(server, {
        refreshToken: null,
        loginStatus: Anonymous,
        loginError: null,
    });

    setTimeout(() => window.location.reload(), 100);
};

export default (state = defaultState, action) =>
    produce(state, draft => {
        if (!draft.serverHistory?.length) {
            draft.serverHistory = [makeServerRecord(getDefaultUrl())];
        }

        action = {
            ...action,
            url: sanitizeUrl(action.url),
        };

        const currentServer = draft.serverHistory[0];

        const activeServer =
            draft.serverHistory.find(s => s.url === action.url) || {};

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
                draft.serverHistory = historyPlusServer(
                    state.serverHistory,
                    newServer,
                );
                setCurrentServerUrl(draft.serverHistory[0].url);
                break;
            }

            case REMOVE_URL: {
                const url = action.url;
                if (activeServer?.url === url) {
                    logoutServer(activeServer);
                }
                draft.serverHistory = draft.serverHistory.filter(
                    s => s.url !== url,
                );
                if (draft.serverHistory.length === 0) {
                    draft.serverHistory.push(makePlayRecord());
                }
                break;
            }

            case SET_ACL_ENABLED:
                assert(action.url, "This action requires url " + action.type);
                activeServer.isAclEnabled = action.isAclEnabled;
                break;
            case SET_MULTI_TENANCY_ENABLED:
                assert(action.url, "This actions requires url", +action.type);
                activeServer.isMultiTenancyEnabled =
                    action.isMultiTenancyEnabled;
                break;
            case SET_BACKUP_ENABLED:
                assert(action.url, "This action requires url " + action.type);
                activeServer.isBackupEnabled = action.isBackupEnabled;
                break;
            case SET_QUERY_TIMEOUT:
                assert(action.url, "This action requires url " + action.type);
                activeServer.queryTimeout = action.queryTimeout;
                if (action.url === currentServer.url) {
                    setCurrentServerQueryTimeout(activeServer.queryTimeout);
                }
                break;
            case SET_SLASH_API_KEY:
                assert(action.url, "This action requires url " + action.type);
                activeServer.slashApiKey = action.slashApiKey;
                if (action.url === currentServer.url) {
                    setCurrentServerSlashApiKey(activeServer.slashApiKey);
                }
                break;
            case SET_URL_AND_SLASH_API_KEY:
                draft.serverHistory = historyPlusServer(
                    draft.serverHistory,
                    makeServerRecord(action.url),
                );

                const newActiveServer = draft.serverHistory[0];
                newActiveServer.slashApiKey = action.slashApiKey;
                setCurrentServerUrl(newActiveServer.url);
                if (
                    action.url.endsWith(HYPERMODE_HOST_DOMAIN) ||
                    action.url.endsWith(HYPERMODE_STAGE_HOST_DOMAIN)
                ) {
                    setCurrentServerSlashApiKey(newActiveServer.slashApiKey);
                }
                break;
            case SET_AUTH_TOKEN:
                assert(action.url, "This action requires url " + action.type);
                activeServer.authToken = action.authToken;
                if (action.url === currentServer.url) {
                    setCurrentServerAuthToken(activeServer.authToken);
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
                activeServer.aclState = action.aclState;
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
                    draft.serverHistory = historyPlusServer(
                        draft.serverHistory,
                        makeServerRecord(url),
                    );
                });

                draft.serverHistory = historyPlusServer(
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
