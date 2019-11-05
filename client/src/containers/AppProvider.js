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

import React from "react";
import { Provider } from "react-redux";
import { compose, createStore, applyMiddleware } from "redux";
import { persistStore } from "redux-persist";
import localStorage from "redux-persist/lib/storage";
import ReduxThunk from "redux-thunk";

import { getAddrParam } from "../lib/helpers";
import { loginUser, updateUrl } from "../actions/url";
import makeRootReducer from "../reducers";

import "bootstrap/dist/css/bootstrap.css";

const config = {
    key: "root",
    storage: localStorage,
    whitelist: ["backup", "frames", "ui", "url"],
};
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
    makeRootReducer(config),
    undefined,
    composeEnhancers(applyMiddleware(ReduxThunk)),
);

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
        const addrParam = getAddrParam();
        if (addrParam) {
            store.dispatch(updateUrl(addrParam));
        }

        const state = store.getState();
        if (state && state.url && state.url.refreshToken) {
            // Send stored refreshToken to the dgraph-js client lib.
            store.dispatch(
                loginUser(undefined, undefined, state.url.refreshToken),
            );
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
