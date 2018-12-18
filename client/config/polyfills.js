// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

if (typeof Promise === "undefined") {
    // Rejection tracking prevents a common issue where React gets into an
    // inconsistent state due to an error, but it gets swallowed by a Promise,
    // and the user has no idea what causes React's erratic future behavior.
    require("promise/lib/rejection-tracking").enable();
    window.Promise = require("promise/lib/es6-extensions.js");
}

// fetch() polyfill for making API calls.
require("whatwg-fetch");

// Object.assign() is commonly used with React.
// It will use the native implementation if it's present and isn't buggy.
Object.assign = require("object-assign");

// In tests, polyfill requestAnimationFrame since jsdom doesn't provide it yet.
// We don't polyfill it in the browser--this is user's responsibility.
if (process.env.NODE_ENV === "test") {
    require("raf").polyfill(global);
}
