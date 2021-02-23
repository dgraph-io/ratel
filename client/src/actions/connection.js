// Copyright 2017-2021 Dgraph Labs, Inc. and Contributors
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

import * as helpers from "lib/helpers";
import { clickSidebarUrl } from "../actions/ui";

import {
    FetchError,
    OK,
    QUERY_TIMEOUT_DEFAULT,
    Unknown,
} from "../lib/constants";

export const LOGIN_ERROR = "connection/LOGIN_ERROR";
export const LOGIN_PENDING = "connection/LOGIN_PENDING";
export const LOGIN_SUCCESS = "connection/LOGIN_SUCCESS";
export const LOGIN_TIMEOUT = "connection/LOGIN_TIMEOUT";
export const DO_LOGOUT = "connection/DO_LOGOUT";
export const SET_ACL_ENABLED = "connection/SET_ACL_ENABLED";
export const SET_BACKUP_ENABLED = "connection/SET_BACKUP_ENABLED";
export const SET_QUERY_TIMEOUT = "connection/SET_QUERY_TIMEOUT";
export const SET_SLASH_API_KEY = "connection/SET_SLASH_API_KEY";
export const SET_AUTH_TOKEN = "connection/SET_AUTH_TOKEN";
export const REMOVE_URL = "connection/REMOVE_URL";
export const UPDATE_URL = "connection/UPDATE_URL";
export const UPDATE_ACL_STATE = "connection/UPDATE_ACL_STATE";
export const UPDATE_NETWORK_HEALTH = "connection/UPDATE_NETWORK_HEALTH";
export const UPDATE_SERVER_HEALTH = "connection/UPDATE_SERVER_HEALTH";
export const UPDATE_SERVER_VERSION = "connection/UPDATE_SERVER_VERSION";
export const UPDATE_ZERO_URL = "connection/UPDATE_ZERO_URL";

export const DISMISS_LICENSE_WARNING = "connection/DISMISS_LICENSE_WARNING";

const SLASH_DOMAINS = [
    ".app.thegaas.com",
    ".slash.dgraph.io",
    ".cloud.dgraph.io",
];

const assert = (test, message = "No message") => {
    if (!test) {
        throw new Error("Assertion Failed: " + message);
    }
};

export function setQueryTimeout(url, queryTimeout) {
    queryTimeout = parseInt(queryTimeout) || QUERY_TIMEOUT_DEFAULT;
    return {
        type: SET_QUERY_TIMEOUT,
        url,
        queryTimeout,
    };
}

export function setSlashApiKey(url, slashApiKey) {
    return {
        type: SET_SLASH_API_KEY,
        url,
        slashApiKey,
    };
}

export function setAuthToken(url, authToken) {
    return {
        type: SET_AUTH_TOKEN,
        url,
        authToken,
    };
}

export function setAclEnabled(url, isAclEnabled) {
    return {
        type: SET_ACL_ENABLED,
        url,
        isAclEnabled,
    };
}

export function setBackupEnabled(url, isBackupEnabled) {
    return {
        type: SET_BACKUP_ENABLED,
        url,
        isBackupEnabled,
    };
}

export const updateUrl = url => async (dispatch, getState) => {
    dispatch(loginTimeout(getState().connection.serverHistory[0].url));

    dispatch({
        type: UPDATE_URL,
        url,
    });

    dispatch(checkHealth());
};

export const removeUrl = url => async (dispatch, getState) => {
    dispatch(loginTimeout(getState().connection.serverHistory[0].url));

    dispatch({
        type: REMOVE_URL,
        url,
    });
    // TODO: health checks and other code that "reacts" to the global URL should
    // be moved to one dedicated place.
    dispatch(checkHealth());
};

export const updateZeroUrl = zeroUrl => ({
    type: UPDATE_ZERO_URL,
    zeroUrl,
});

export const checkNetworkHealth = async (dispatch, getState) => {
    const url = getState().connection.serverHistory[0].url;
    try {
        const res = await fetch(url + "/health");
        if (res.ok) {
            dispatch(networkHealth(url, OK));
        }
        try {
            const health = await res.json();
            const ee_features = health?.[0]?.ee_features;
            if (!ee_features) {
                // Throw an error to go to the catch all block
                throw new Error("old server, fallback to everything on");
            }
            dispatch(setAclEnabled(url, ee_features.indexOf("acl") >= 0));
            dispatch(
                setBackupEnabled(
                    url,
                    ee_features.indexOf("backup_restore") >= 0 ||
                        ee_features.indexOf("encrypted_backup_restore") >= 0,
                ),
            );
        } catch (e) {
            // This is either an old server or health isn't ok.
            dispatch(setAclEnabled(url, true));
            dispatch(setBackupEnabled(url, true));
        }
    } catch (err) {
        dispatch(networkHealth(url, FetchError));
    }
};

export const checkAclState = async (dispatch, getState) => {
    const url = getState().connection.serverHistory[0].url;

    const isSlashDomain = SLASH_DOMAINS.find(u => url.indexOf(u) >= 0);
    if (isSlashDomain) {
        // For Slash domains lets just assume ACL is OK, because a query costs
        // credits
        dispatch(serverAclState(url, OK));
        return;
    }

    try {
        helpers.setCurrentServerUrl(url);
        const client = await helpers.getDgraphClient();
        const res = await client
            .newTxn()
            .query("{ q(func: uid(1)) { uid } }", {});
        assert(res.data.q[0].uid === "0x1");
        dispatch(serverAclState(url, OK));
    } catch (err) {
        console.error("serverAclState error", err);
        dispatch(serverAclState(url, FetchError));
    }
};

export const checkHealth = ({
    openUrlOnError = false,
    unknownOnStart = true,
} = {}) => async (dispatch, getState) => {
    checkNetworkHealth(dispatch, getState);
    checkAclState(dispatch, getState);

    const url = getState().connection.serverHistory[0].url;
    unknownOnStart && dispatch(serverHealth(url, Unknown));
    try {
        helpers.setCurrentServerUrl(url);
        const stub = await helpers.getDgraphClientStub();
        const health = await stub.getHealth();
        dispatch(serverHealth(url, OK));
        dispatch(serverVersion(url, health?.[0]?.version || health.version));
        if (health === "OK") {
            // Overwrite the version we've just dispatched.
            dispatch(serverVersion(url, "1.0.15-???"));
        }
    } catch (err) {
        console.error("GetHealth error", err);
        dispatch(serverHealth(url, FetchError));
        if (openUrlOnError) {
            dispatch(clickSidebarUrl("connection"));
        }
    }
};

export const serverAclState = (url, aclState) => ({
    type: UPDATE_ACL_STATE,
    aclState,
    url,
});

export const networkHealth = (url, health) => ({
    type: UPDATE_NETWORK_HEALTH,
    health,
    url,
});

export const serverHealth = (url, health) => ({
    type: UPDATE_SERVER_HEALTH,
    health,
    url,
});

export const serverVersion = (url, version) => ({
    type: UPDATE_SERVER_VERSION,
    url,
    version,
});

const loginPending = url => ({
    type: LOGIN_PENDING,
    url,
});

const loginSuccess = (url, { refreshToken }) => ({
    type: LOGIN_SUCCESS,
    url,
    refreshToken,
});

const loginTimeout = url => ({
    type: LOGIN_TIMEOUT,
    url,
});

const loginError = (url, error) => ({
    type: LOGIN_ERROR,
    error,
    url,
});

export const loginUser = (userid, password, refreshToken) => async (
    dispatch,
    getState,
) => {
    const url = getState().connection.serverHistory[0].url;
    dispatch(loginPending(url));

    // Issue loginTimeout in case something went wrong with network or server.
    setTimeout(() => dispatch(loginTimeout(url)), 30 * 1000);

    await new Promise(resolve => setTimeout(resolve, 500));
    try {
        const stub = await helpers.getDgraphClientStub();
        await stub.login(userid, password, refreshToken);
        stub.setAutoRefresh(true);
        dispatch(loginSuccess(url, stub.getAuthTokens()));
    } catch (err) {
        console.error("Login Failed", url, err);
        dispatch(loginError(url, err));
    }
};

export const logoutUser = () => async (dispatch, getState) => {
    try {
        (await helpers.getDgraphClient()).logout();
        dispatch({ type: DO_LOGOUT });
        dispatch(checkHealth());
    } catch (err) {
        console.error("Logout Failed");
        console.error(err);
        dispatch(loginError(err));
    }
};

export const dismissLicenseWarning = () => ({
    type: DISMISS_LICENSE_WARNING,
});
