import React from "react";
import { Provider } from "react-redux";
import { compose, createStore, applyMiddleware } from "redux";
import { persistStore } from "redux-persist";
import localStorage from "redux-persist/lib/storage";
import { BrowserRouter, Route } from "react-router-dom";
import thunk from "redux-thunk";

import { getAddrParam } from "../lib/helpers";
import { toggleCollapseFrame } from "../actions/frames";
import { updateUrl } from "../actions/url";
import makeRootReducer from "../reducers";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/css/bootstrap-theme.css";

const config = {
    key: "root",
    storage: localStorage,
    whitelist: ["frames", "url"],
};
const middleware = [thunk];
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
    makeRootReducer(config),
    undefined,
    composeEnhancers(applyMiddleware(...middleware)),
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

        const currentState = store.getState();
        currentState.frames.items.forEach(frame =>
            store.dispatch(toggleCollapseFrame(frame, true)),
        );

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
