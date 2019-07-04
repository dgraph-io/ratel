// Copyright 2017-2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import { updateConnectedState, updateRefreshing } from "./connection";
import * as helpers from "lib/helpers";

export const LOGIN_ERROR = "url/LOGIN_ERROR";
export const LOGIN_PENDING = "url/LOGIN_PENDING";
export const LOGIN_SUCCESS = "url/LOGIN_SUCCESS";
export const DO_LOGOUT = "url/DO_LOGOUT";
export const SET_QUERY_TIMEOUT = "url/SET_QUERY_TIMEOUT";
export const UPDATE_URL = "url/UPDATE_URL";

export function setQueryTimeout(queryTimeout) {
    return {
        type: SET_QUERY_TIMEOUT,
        queryTimeout,
    };
}

export const updateUrl = url => async (dispatch, getState) => {
    dispatch(logoutUser());
    dispatch({
        type: UPDATE_URL,
        url,
    });

    checkHealth(url)(dispatch, getState);
};

export const checkHealth = (url, onFailure) => async (dispatch, getState) => {
    dispatch(updateRefreshing(true));
    url = url || getState().url.url;
    try {
        const stub = await helpers.getDgraphClientStub(url);
        await stub.health();
        dispatch(updateConnectedState(true));
    } catch (err) {
        console.error(err);
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

export const loginUser = (userid, password) => async (dispatch, getState) => {
    dispatch(updateRefreshing(true));
    dispatch(loginPending());

    await new Promise(resolve => setTimeout(resolve, 500));
    const { url } = getState().url;
    try {
        const stub = await helpers.getDgraphClientStub(url);
        await stub.login(userid, password);
        dispatch(loginSuccess(stub.getAuthTokens()));
    } catch (err) {
        console.error("Login Failed");
        console.error(err);
        dispatch(loginError(err));
    } finally {
        dispatch(updateRefreshing(false));
    }
};

export const logoutUser = () => ({
    type: DO_LOGOUT,
});
