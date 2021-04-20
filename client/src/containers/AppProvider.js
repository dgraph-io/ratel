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

import React from "react";
import produce from "immer";
import { Provider } from "react-redux";
import { compose, createStore, applyMiddleware } from "redux";
import { createTransform, persistStore } from "redux-persist";
import localStorage from "redux-persist/lib/storage";
import ReduxThunk from "redux-thunk";

import { getAddrParam, getHashParams } from "lib/helpers";
import { runQuery, setResultsTab } from "actions/frames";
import {
    loginUser,
    setSlashApiKey,
    setAuthToken,
    updateUrl,
} from "actions/connection";
import {
    migrateToServerConnection,
    migrateToHaveZeroUrl,
} from "actions/migration";
import { updateAction, updateQuery } from "actions/query";
import makeRootReducer from "reducers";

import {
    setCurrentServerQueryTimeout,
    setCurrentServerSlashApiKey,
    setCurrentServerUrl,
} from "lib/helpers";

import "bootstrap/dist/css/bootstrap.css";

const eraseApiKeys = createTransform(
    state =>
        produce(state, draft => {
            draft.serverHistory.forEach(rec => {
                delete rec.slashApiKey;
            });
        }),
    undefined,
    { whitelist: ["connection"] },
);

const config = {
    key: "root",
    storage: localStorage,
    whitelist: ["backup", "frames", "connection", "query", "ui"],
    transforms: [eraseApiKeys],
};
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
    makeRootReducer(config),
    undefined,
    composeEnhancers(applyMiddleware(ReduxThunk)),
);

store.subscribe(() => {
    const state = store.getState();
    if (!state.connection?.serverHistory) {
        console.warning(
            "Redux State is not ready. Waiting for connection.serverHistory",
        );
        return;
    }
    setCurrentServerUrl(state.connection.serverHistory[0].url);
    setCurrentServerQueryTimeout(
        state.connection.serverHistory[0].queryTimeout || 20,
    );
    setCurrentServerSlashApiKey(state.connection.serverHistory[0].slashApiKey);
});

export default class AppProvider extends React.Component {
    state = {
        rehydrated: false,
        // ready is a boolean denoting if the app is ready to render.
        ready: false,
    };

    componentDidMount() {
        // Begin periodically persisting the store.
        persistStore(store, null, () => {
            this.setState({ rehydrated: true }, this.onRehydrated);
        });
    }

    onRehydrated = () => {
        const state = store.getState();

        store.dispatch(
            migrateToServerConnection({
                mainUrl: store.url?.url,
                urlHistory: store.url?.urlHistory,
            }),
        );
        store.dispatch(migrateToHaveZeroUrl());

        const addrParam = getAddrParam();
        if (addrParam) {
            store.dispatch(updateUrl(addrParam));
        }

        const hashParams = getHashParams();
        if (hashParams.addr) {
            store.dispatch(updateUrl(hashParams.addr));
        }
        if (hashParams.slashApiKey) {
            store.dispatch(
                setSlashApiKey(
                    hashParams.addr || addrParam,
                    hashParams.slashApiKey,
                ),
            );
        }
        if (hashParams.authToken) {
            store.dispatch(
                setAuthToken(
                    hashParams.addr || addrParam,
                    hashParams.authToken,
                ),
            );
        }
        if (hashParams.query) {
            store.dispatch(updateAction("query"));
            store.dispatch(updateQuery(hashParams.query));
            store.dispatch(runQuery(hashParams.query));
        }
        // Remove noise from the address bar
        window.location.hash = "";

        if (state?.connection?.serverHistory[0].refreshToken) {
            // Send stored refreshToken to the dgraph-js client lib.
            store.dispatch(
                loginUser(
                    undefined,
                    undefined,
                    undefined,
                    state.connection.serverHistory[0].refreshToken,
                ),
            );
        }

        if (state?.frames) {
            // HACK: setResultsTab will validate the tab name.
            store.dispatch(setResultsTab(state.frames.tab));
        }

        this.setState({ ready: true });
    };

    render() {
        const Component = this.props.component;
        const { rehydrated, ready } = this.state;

        if (!rehydrated || !ready) {
            return <div>Loading...</div>;
        }

        return (
            <Provider store={store}>
                <Component />
            </Provider>
        );
    }
}
