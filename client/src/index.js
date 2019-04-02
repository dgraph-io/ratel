// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import ReactDOM from "react-dom";

import AppProvider from "./containers/AppProvider";
import App from "./containers/App";

import jquery from "jquery";

import { createCookie, readCookie } from "./lib/helpers";

const COOKIE_NAME = "dgApril1st";

function loadScript(url, onLoad) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = url;
    script.onload = onLoad;
    document.body.appendChild(script);
}

const now = new Date();
if (now.getMonth() === 3 && now.getDay() === 1 && !readCookie(COOKIE_NAME)) {
    var linkCss = document.createElement("link");
    linkCss.rel = "stylesheet";
    linkCss.type = "text/css";
    linkCss.href =
        "https://gitcdn.xyz/repo/pi0/clippyjs/master/assets/clippy.css";
    document.body.appendChild(linkCss);

    loadScript("https://unpkg.com/jquery@3.2.1", function() {
        loadScript("https://unpkg.com/clippyjs@latest", onLoadedClippy);
    });
}

function onLoadedClippy() {
    const now = new Date();
    if (now.getMonth() !== 3 || now.getDay() !== 1 || readCookie(COOKIE_NAME)) {
        return;
    }

    createCookie(COOKIE_NAME, "1", 10);
    window.clippy.load("Clippy", agent => {
        agent.delay = time => {
            agent._addToQueue(function(complete) {
                this._onQueueEmpty();
                window.setTimeout(complete, time);
            }, agent);
        };

        agent.show();
        agent.animate();
        agent.delay(5000);
        agent.animate();
        agent.speak(
            "Hello, My name is Graphy. I'm here to tell you exciting news",
        );
        agent.delay(4000);
        agent.closeBalloon();
        agent.speak(
            "Dgraph 3000 is coming this month. It will be a complete rewrite of Dgraph.",
        );
        agent.delay(4000);
        agent.closeBalloon();
        agent.speak("Our new language of choice is Microsoft Visual Basic!");
        agent.delay(4000);
        agent.closeBalloon();
        agent.speak(
            "We are very excited to switch to Microsoft Visual Basic and Windows!",
        );
        agent.delay(4000);
        agent.closeBalloon();
        agent.speak(
            "To ease your upgrade we bought you a license key for the Windows 98 Server Edition. Click me to get your copy",
            1,
        );
        const onClick = () => {
            window.open(
                "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "_blank",
            );
            agent.closeBalloon();
            agent.hide();
        };
        window.$(agent._el).click(onClick);
        agent._balloon._balloon.click(onClick);
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
