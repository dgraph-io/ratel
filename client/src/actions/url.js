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

import { updateConnectedState, updateRefreshing } from "./connection";
import * as helpers from "lib/helpers";

export const LOGIN_ERROR = "url/LOGIN_ERROR";
export const LOGIN_PENDING = "url/LOGIN_PENDING";
export const LOGIN_SUCCESS = "url/LOGIN_SUCCESS";
export const DO_LOGOUT = "url/DO_LOGOUT";
export const SET_QUERY_TIMEOUT = "url/SET_QUERY_TIMEOUT";
export const UPDATE_URL = "url/UPDATE_URL";
export const UPDATE_ZERO_URL = "url/UPDATE_ZERO_URL";
export const SET_ZERO_CONNECTION = "url/TOGGLE_ZERO_CONNECTION";

export function setQueryTimeout(queryTimeout) {
    return {
        type: SET_QUERY_TIMEOUT,
        queryTimeout,
    };
}

export const updateUrl = url => async (dispatch, getState) => {
    if (getState().url.url !== url) {
        dispatch(logoutUser());
    }
    dispatch({
        type: UPDATE_URL,
        url,
    });

    dispatch(checkHealth(url));
};

export const updateZeroUrl = url => ({
    type: UPDATE_ZERO_URL,
    url: url,
});

export const checkHealth = (url, onFailure) => async (dispatch, getState) => {
    dispatch(updateRefreshing(true));
    url = url || getState().url.url;
    try {
        const stub = await helpers.getDgraphClientStub(url);
        await stub.health();
        dispatch(updateConnectedState(true));
    } catch (err) {
        console.error(err);
        console.error("Unable to connect to the server at " + url);
        dispatch(updateConnectedState(false));
        onFailure && onFailure();
    } finally {
        dispatch(updateRefreshing(false));
    }
};

const loginPending = () => ({
    type: LOGIN_PENDING,
});

const loginSuccess = ({ accessToken, refreshToken }) => ({
    type: LOGIN_SUCCESS,
    accessToken,
    refreshToken,
});

const loginError = error => ({
    type: LOGIN_ERROR,
    error,
});

export const loginUser = (userid, password, refreshToken) => async (
    dispatch,
    getState,
) => {
    dispatch(updateRefreshing(true));
    dispatch(loginPending());

    await new Promise(resolve => setTimeout(resolve, 500));
    const { url } = getState().url;
    try {
        const stub = await helpers.getDgraphClientStub(url);
        await stub.login(userid, password, refreshToken);
        stub.setAutoRefresh(true);
        dispatch(loginSuccess(stub.getAuthTokens()));
    } catch (err) {
        console.error("Login Failed");
        console.error(err);
        dispatch(loginError(err));
    } finally {
        dispatch(updateRefreshing(false));
    }
};

export const logoutUser = () => async (dispatch, getState) => {
    const { url } = getState().url;
    try {
        (await helpers.getDgraphClient(url)).logout();
        dispatch({ type: DO_LOGOUT });
        dispatch(checkHealth(url));
    } catch (err) {
        console.error("Logout Failed");
        console.error(err);
        dispatch(loginError(err));
    }
};

export const setZeroConnection = value => ({
    type: SET_ZERO_CONNECTION,
    value: value,
});
