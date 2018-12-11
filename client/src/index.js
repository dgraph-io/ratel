import "babel-polyfill";
import React from "react";
import ReactDOM from "react-dom";

import AppProvider from "./containers/AppProvider";
import App from "./containers/App";

window.FontAwesomeConfig = { autoReplaceSvg: "nest" };
require("@fortawesome/fontawesome-free/js/all.min.js");

export function render(Component) {
    return ReactDOM.render(
        <AppProvider component={Component} />,
        document.getElementById("root") || document.createElement("div"),
    );
}

render(App);

if (module.hot) {
    module.hot.accept("./containers/App", () => {
        const nextApp = require("./containers/App").default;
        render(nextApp);
    });
}
