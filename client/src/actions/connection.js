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

import * as helpers from "lib/helpers";
import { Unknown, FetchError, OK } from "../reducers/connection";
import { clickSidebarUrl } from "../actions/ui";

export const LOGIN_ERROR = "connection/LOGIN_ERROR";
export const LOGIN_PENDING = "connection/LOGIN_PENDING";
export const LOGIN_SUCCESS = "connection/LOGIN_SUCCESS";
export const LOGIN_TIMEOUT = "connection/LOGIN_TIMEOUT";
export const DO_LOGOUT = "connection/DO_LOGOUT";
export const SET_QUERY_TIMEOUT = "connection/SET_QUERY_TIMEOUT";
export const UPDATE_URL = "connection/UPDATE_URL";
export const UPDATE_SERVER_HEALTH = "connection/UPDATE_SERVER_HEALTH";

export const DISMISS_LICENSE_WARNING = "connection/DISMISS_LICENSE_WARNING";

export function setQueryTimeout(queryTimeout) {
    return {
        type: SET_QUERY_TIMEOUT,
        queryTimeout,
    };
}

export const updateUrl = url => async (dispatch, getState) => {
    dispatch(loginTimeout());

    dispatch({
        type: UPDATE_URL,
        url,
    });

    dispatch(checkHealth());
};

export const checkHealth = ({
    openUrlOnError = false,
    unknownOnStart = true,
} = {}) => async dispatch => {
    unknownOnStart && dispatch(serverHealth(Unknown));
    try {
        const stub = await helpers.getDgraphClientStub();
        await stub.getHealth();
        dispatch(serverHealth(OK));
    } catch (err) {
        console.error(err);
        dispatch(serverHealth(FetchError));
        if (openUrlOnError) {
            dispatch(clickSidebarUrl("connection"));
        }
    }
};

export const serverHealth = health => ({
    type: UPDATE_SERVER_HEALTH,
    health,
});

const loginPending = () => ({
    type: LOGIN_PENDING,
});

const loginSuccess = ({ refreshToken }) => ({
    type: LOGIN_SUCCESS,
    refreshToken,
});

const loginTimeout = () => ({
    type: LOGIN_TIMEOUT,
});

const loginError = error => ({
    type: LOGIN_ERROR,
    error,
});

export const loginUser = (userid, password, refreshToken) => async (
    dispatch,
    getState,
) => {
    dispatch(loginPending());

    // Issue loginTimeout in case something went wrong with network or server.
    setTimeout(() => dispatch(loginTimeout()), 30 * 1000);

    await new Promise(resolve => setTimeout(resolve, 500));
    try {
        const stub = await helpers.getDgraphClientStub();
        await stub.login(userid, password, refreshToken);
        stub.setAutoRefresh(true);
        dispatch(loginSuccess(stub.getAuthTokens()));
    } catch (err) {
        console.error("Login Failed");
        console.error(err);
        dispatch(loginError(err));
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
