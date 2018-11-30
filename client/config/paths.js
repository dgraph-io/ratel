// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

const path = require("path");
const fs = require("fs");
const url = require("url");

// Make sure any symlinks in the project folder are resolved:
// https://github.com/facebookincubator/create-react-app/issues/637
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

const envPublicUrl = process.env.PUBLIC_URL;
const envCdnUrl = process.env.CDN_URL;

function ensureSlash(path, needsSlash) {
    const hasSlash = path.endsWith("/");
    if (hasSlash && !needsSlash) {
        return path.substr(path, path.length - 1);
    } else if (!hasSlash && needsSlash) {
        return `${path}/`;
    } else {
        return path;
    }
}

const getPublicUrl = appPackageJson =>
    envPublicUrl || require(appPackageJson).publicUrl;

const getCdnUrl = appPackageJson =>
    ensureSlash(envCdnUrl || require(appPackageJson).cdnUrl, true);

// We use `PUBLIC_URL` environment variable or "publicUrl" field to infer
// "public path" at which the app is served.
function getServedPath(appPackageJson) {
    const publicUrl = getPublicUrl(appPackageJson);
    const servedUrl =
        envPublicUrl || (publicUrl ? url.parse(publicUrl).pathname : "/");
    return ensureSlash(servedUrl, true);
}

// config after eject: we're in ./config/
module.exports = {
    dotenv: resolveApp(".env"),
    appBuild: resolveApp("build"),
    appPublic: resolveApp("public"),
    appHtml: resolveApp("public/index.html"),
    loaderHtml: resolveApp("public/loader.html"),
    appIndexJs: resolveApp("src/index.js"),
    appPackageJson: resolveApp("package.json"),
    appSrc: resolveApp("src"),
    yarnLockFile: resolveApp("yarn.lock"),
    testsSetup: resolveApp("src/setupTests.js"),
    appNodeModules: resolveApp("node_modules"),
    publicUrl: getPublicUrl(resolveApp("package.json")),
    cdnUrl: getCdnUrl(resolveApp("package.json")),
    servedPath: getServedPath(resolveApp("package.json")),
};
