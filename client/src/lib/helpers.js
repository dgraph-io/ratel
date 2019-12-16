// Copyright 2017-2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as dgraph from "dgraph-js-http";
import memoizeOne from "memoize-one";

export function createCookie(name, val, days, options = {}) {
    const cookie = [`${name}=${val}`, "path=/"];
    if (options.crossDomain) {
        cookie.push("domain=.dgraph.io");
    }

    if (days) {
        const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        cookie.push(`expires=${date.toUTCString()}`);
    }

    document.cookie = cookie.join("; ");
}

export function readCookie(name) {
    const nameEQ = name + "=";
    const matchedStr = document.cookie
        .split(";")
        .map(str => str.trim())
        .find(str => str.startsWith(nameEQ));

    return matchedStr ? matchedStr.substring(nameEQ.length) : null;
}

export function eraseCookie(name, options) {
    createCookie(name, "", -1, options);
}

export function humanizeTime(time) {
    if (time > 1000) {
        // Time is in ms, lets convert it to seconds for displaying.
        return (time / 1000).toFixed(1) + "s";
    }
    return time.toFixed(0) + "ms";
}

export function serverLatency(latencyObj) {
    let totalLatency = 0;
    // Server returns parsing, processing and encoding latencies in ns separately.
    for (let latency in latencyObj) {
        if (latencyObj.hasOwnProperty(latency)) {
            totalLatency += parseFloat(latencyObj[latency]);
        }
    }

    totalLatency /= Math.pow(10, 6);

    let lat;
    if (totalLatency < 1) {
        lat = Math.round(totalLatency * 1000) + "μs";
    } else if (totalLatency > 1000) {
        lat = Math.round(totalLatency / 1000) + "s";
    } else {
        lat = Math.round(totalLatency) + "ms";
    }
    return lat;
}

const createDgraphClient = memoizeOne(async url => {
    const stub = new dgraph.DgraphClientStub(url);
    try {
        await stub.detectApiVersion();
    } catch (err) {
        // Ignore error, it's probably a bad URL
    }

    return {
        client: new dgraph.DgraphClient(stub),
        stub,
    };
});

export const getDgraphClient = async url =>
    (await createDgraphClient(url)).client;

export const getDgraphClientStub = async url =>
    (await createDgraphClient(url)).stub;

const createDgraphCluster = memoizeOne(async url => {
    const client = await getDgraphClient(url);
    return new dgraph.DgraphCluster(client);
});

export async function executeQuery(
    url,
    query,
    { action = "query", debug = false, queryTimeout } = {},
) {
    if (action === "mutate" || action === "alter") {
        debug = false;
    }
    if (action === "alter") {
        return executeAlter(url, query);
    }

    const client = await getDgraphClient(url);

    if (action === "query") {
        client.setQueryTimeout(queryTimeout);
        return client.newTxn().query(query, { debug });
    } else if (action === "mutate") {
        return client.newTxn().mutate({ mutation: query, commitNow: true });
    } else if (action === "getstate") {
        return client.getState();
    } else if (action === "gethealth") {
        return client.getHealth(query);
    }
    console.error("Unknown Method: ", action);
    throw new Error("Unknown Method: " + action);
}

export async function executeAlter(url, schema) {
    const client = await getDgraphClient(url);
    return client.alter({ schema });
}

export async function executeClusterAction(url, query, action) {
    const cluster = await createDgraphCluster(url);

    switch (action) {
        case "getinstancehealth":
            return cluster.getInstanceHealth();
        case "getclusterhealth":
            return cluster.getClusterHealth();
        case "getstate":
            return cluster.getState();
        default:
            console.error("Unknown Method: ", action);
            throw new Error("Unknown Method: " + action);
    }
}

export function getAddrParam() {
    const addrParam = new URLSearchParams(window.location.search).get("addr");
    return addrParam ? ensureSlash(addrParam) : "";
}

export function getDefaultUrl() {
    const addrParam = getAddrParam();
    if (addrParam) {
        return addrParam;
    } else if (window.SERVER_ADDR) {
        return ensureSlash(window.SERVER_ADDR);
    } else {
        let port = ":8080";
        const hostname = window.location.hostname;
        if (hostname !== "localhost" && hostname !== "127.0.0.1") {
            port = window.location.port ? ":" + window.location.port : "";
        }

        return `${window.location.protocol}//${hostname}${port}/`;
    }
}

export function updateUrlOnStartup() {
    return !window.SERVER_ADDR && !getAddrParam();
}

export function processUrl(url) {
    // Add http if a scheme is not specified.
    if (!/^[a-zA-Z][a-zA-Z+.-]*?:\/\//i.test(url)) {
        url = "http://" + url;
    }

    const parser = document.createElement("a");
    parser.href = url;

    // Required for IE.
    if (!parser.host) {
        // eslint-disable-next-line
        parser.href = parser.href;
    }

    return ensureSlash(`${parser.protocol}//${parser.host}${parser.pathname}`);
}

function ensureSlash(path) {
    if (!path.endsWith("/")) {
        return `${path}/`;
    } else {
        return path;
    }
}
