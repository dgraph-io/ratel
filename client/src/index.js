import React from "react";
import ReactDOM from "react-dom";
import Raven from "raven-js";

import AppProvider from "./containers/AppProvider";
import App from "./containers/App";

// Configure raven for error reporting.
if (process.env.NODE_ENV === "production") {
    Raven.config(
        "https://1621cc56d5ee47ceabe32d9b0ac4ed7e@sentry.io/166278",
    ).install();
}

function render(Component) {
    return ReactDOM.render(
        <AppProvider component={Component} />,
        document.getElementById("root"),
    );
}

render(App);

if (module.hot) {
    module.hot.accept("./containers/App", () => {
        const nextApp = require("./containers/App").default;
        render(nextApp);
    });
}
