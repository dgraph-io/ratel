// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import { getEndpoint, updateUrlOnStartup } from "../lib/helpers";

export const UPDATE_CONNECTED_STATE = "connection/UPDATE_CONNECTED_STATE";
export const UPDATE_SHOULD_PROMPT = "connection/UPDATE_SHOULD_PROMPT";
export const UPDATE_REFRESHING = "connection/UPDATE_REFRESHING";

export function updateConnectedState(connected) {
    return {
        type: UPDATE_CONNECTED_STATE,
        connected,
    };
}

export function updateShouldPrompt() {
    return {
        type: UPDATE_SHOULD_PROMPT,
    };
}

export function updateRefreshing(refreshing) {
    return {
        type: UPDATE_REFRESHING,
        refreshing,
    };
}

function shouldPrompt(getState) {
    if (!updateUrlOnStartup()) {
        return false;
    }

    const connection = getState().connection;
    return !connection.connected && !connection.shouldPrompt;
}

/**
 * refreshConnectedState checks if the query endpoint responds and updates the
 * connected state accordingly
 */
export function refreshConnectedState(openChangeUrlModal) {
    return (dispatch, getState) => {
        dispatch(updateRefreshing(true));

        const url = getState().url;
        return fetch(getEndpoint(url, "health"), {
            method: "GET",
            mode: "cors",
            headers: {
                Accept: "application/json",
            },
            credentials: "same-origin",
        })
            .then(response => {
                const nextConnectedState = response.status === 200;
                let sp = false;
                if (!nextConnectedState) {
                    sp = shouldPrompt(getState);
                }

                dispatch(updateConnectedState(nextConnectedState));

                if (sp) {
                    openChangeUrlModal && openChangeUrlModal();
                }
            })
            .catch(e => {
                console.log(e.stack);

                const sp = shouldPrompt(getState);

                dispatch(updateConnectedState(false));

                if (sp) {
                    openChangeUrlModal && openChangeUrlModal();
                }
            });
    };
}
