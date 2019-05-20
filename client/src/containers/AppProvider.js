// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import { Provider } from "react-redux";
import { compose, createStore, applyMiddleware } from "redux";
import { persistStore } from "redux-persist";
import localStorage from "redux-persist/lib/storage";
import { BrowserRouter, Route } from "react-router-dom";
import ReduxThunk from "redux-thunk";

import { getAddrParam } from "../lib/helpers";
import { updateUrl } from "../actions/url";
import makeRootReducer from "../reducers";

import "bootstrap/dist/css/bootstrap.css";

const config = {
    key: "root",
    storage: localStorage,
    whitelist: ["frames", "url", "ui"],
};
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
    makeRootReducer(config),
    undefined,
    composeEnhancers(applyMiddleware(ReduxThunk)),
);

export default class AppProvider extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            rehydrated: false,
            // ready is a boolean denoting if the app is ready to render.
            ready: false,
        };
    }

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

        this.setState({ ready: true });
    };

    render() {
        const { component } = this.props;
        const { rehydrated, ready } = this.state;

        if (!rehydrated || !ready) {
            return <div>Loading...</div>;
        }

        return (
            <Provider store={store}>
                <BrowserRouter>
                    <Route path="/" component={component} />
                </BrowserRouter>
            </Provider>
        );
    }
}
