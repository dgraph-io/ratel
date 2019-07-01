// Copyright 2017-2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import { updateConnectedState, updateRefreshing } from "./connection";
import * as helpers from "lib/helpers";

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

export const loginUser = (userid, password) => async (dispatch, getState) => {
    dispatch(updateRefreshing(true));
    const { url } = getState().url;
    try {
        const stub = await helpers.getDgraphClientStub(url);
        const loginResult = await stub.login(userid, password);
    } catch (err) {
        console.error("Login Failed");
        console.error(err);
    } finally {
        dispatch(updateRefreshing(true));
    }
};
