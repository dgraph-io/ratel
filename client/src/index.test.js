// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import jsdom from "jsdom";
import React from "react";

import AppProvider from "./containers/AppProvider";
import App from "./containers/App";

import { render } from "./index";

const document = new jsdom.JSDOM("<!doctype html><html><body></body></html>");
global.document = document;
global.window = document.defaultView;
global.document.body.createTextRange = () => ({
    getBoundingClientRect: () => ({ right: 0 }),
    getClientRects: () => ({
        left: 0,
        length: 0,
        right: 0,
    }),
    setEnd: () => {},
    setStart: () => {},
});

test("Creating AppProvider should not throw errors", () => {
    expect(<AppProvider component={App} />).toBeTruthy();
});

test("Rendering App should not throw errors", done => {
    render(App);
    setTimeout(done, 2);
});
