// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import ReactDOM from "react-dom";

import clippy from "clippyjs";

import AppProvider from "./containers/AppProvider";
import App from "./containers/App";

import { createCookie, readCookie } from "./lib//helpers";

const COOKIE_NAME = "dgApril1st";

const today = new Date();
if (
    today.getMonth() === 3 &&
    today.getDay() === 1 &&
    !readCookie(COOKIE_NAME)
) {
    createCookie(COOKIE_NAME, "1", 365);
    clippy.load("Merlin", agent => {
        agent.show();
        agent.animate();
        agent.delay(5000);
        agent.speak(
            "Hello, My name is Graphy. I'm here to tell you exciting news",
        );
        agent.delay(4000);
        agent.closeBalloon();
        agent.speak(
            "Dgraph 2000 is coming this month. It will be a complete rewrite of Dgraph.",
        );
        agent.delay(4000);
        agent.closeBalloon();
        agent.speak("Our new language of choice is Microsoft Visual Basic!");
        agent.delay(4000);
        agent.closeBalloon();
        agent.speak(
            "We are excited to switch to Microsoft Visual Basic and Windows!",
        );
        agent.delay(4000);
        agent.closeBalloon();
        agent.speak(
            "To ease your upgrade we bought you a license key for the Windows 98 Server Edition. Click me to get your copy",
            1,
        );

        window.$(agent._el).click(() => {
            window.open(
                "https://www.google.com/search?q=actually+funny+april+fools+pranks",
                "_blank",
            );
            agent.closeBalloon();
            agent.hide();
        });
    });
}

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
