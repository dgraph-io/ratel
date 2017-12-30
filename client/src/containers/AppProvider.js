import React from "react";
import { Provider } from "react-redux";
import { compose, createStore, applyMiddleware } from "redux";
import { persistStore } from "redux-persist";
import localStorage from "redux-persist/lib/storage";
import { BrowserRouter, Route } from "react-router-dom";
import thunk from "redux-thunk";
import makeRootReducer from "../reducers";
import { toggleCollapseFrame } from "../actions/frames";

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

    componentWillMount() {
        // Begin periodically persisting the store.
        persistStore(store, null, () => {
            this.setState({ rehydrated: true }, this.onRehydrated);
        });
    }

    onRehydrated = () => {
        const currentState = store.getState();
        const frameItems = currentState.frames.items;

        // Collapse all frames to avoid slow render.
        for (let i = 0; i < frameItems.length; i++) {
            const targetFrame = frameItems[i];

            store.dispatch(toggleCollapseFrame(targetFrame, true));
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
                    <div>
                        <Route path="/:shareId?" component={component} />
                    </div>
                </BrowserRouter>
            </Provider>
        );
    }
}
