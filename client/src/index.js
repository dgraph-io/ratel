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

import { readCookie } from "./lib/helpers";

const COOKIE_NAME = "dgApril1st";

// Nothing to merge

function loadScript(content, onLoad) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.text = content;
    script.onload = onLoad;
    document.body.appendChild(script);
}

if (window.location.hostname === "play.dgraph.io" && readCookie(COOKIE_NAME)) {
    loadScript(`
    window.Countly = window.Countly || {};
    Countly.q = Countly.q || [];

    Countly.q.push(['track_sessions']);
    Countly.q.push(['track_pageview']);
    (function() {
    	var cly = document.createElement('script');
    	cly.type = 'text/javascript';
    	cly.async = true;
    	cly.src = 'https://dgraph.io/assets/js/unminified/stats/dgraph-stats.min.js';
    	cly.onload = function() {
    		Countly.init({
    			app_key: "ef1c4327cb0634bf3945b22bfce841497b54a92f",
    			url: "https://stats.dgraph.io",
    			force_post: true,
    		})
        Countly.q.push(['add_event', {
      		key:"april1st_cookie_present",
      	}]);
    	};
    	document.body.appendChild(cly);
    })();
  `);
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
