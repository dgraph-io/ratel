// Copyright 2017-2020 Dgraph Labs, Inc. and Contributors
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
import JSONbigint from "json-bigint";

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

export function serverLatency(latencyObj) {
    let totalLatency = 0;
    // Server returns parsing, processing and encoding latencies in ns separately.
    for (let latency in latencyObj) {
        if (latencyObj.hasOwnProperty(latency)) {
            totalLatency += parseFloat(latencyObj[latency]);
        }
    }

    totalLatency /= 1e6;

    if (totalLatency < 1) {
        return Math.round(totalLatency * 1000) + "μs";
    } else if (totalLatency > 1000) {
        return Math.round(totalLatency / 1000) + "s";
    } else {
        return Math.round(totalLatency) + "ms";
    }
}

export function humanizeBytes(space) {
    let n = parseInt(space);
    let unitIdx = 0;
    const units = ["B", "kB", "MB", "GB", "TB"];
    while (n > 1024 * 0.9 && unitIdx < units.length - 1) {
        unitIdx++;
        n /= 1024;
    }
    return `${Number(n).toFixed(1)}${units[unitIdx]}`;
}

let dgraphServerUrl = getDefaultUrl();
const clientStubOptions = { headers: {} };

const createDgraphClient = memoizeOne(async url => {
    const stub = new dgraph.DgraphClientStub(
        url,
        {
            jsonParser: JSONbigint.parse.bind(JSONbigint),
        },
        clientStubOptions,
    );
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

export function setCurrentServerUrl(url) {
    dgraphServerUrl = url;
    createDgraphClient(url);
}

export async function setCurrentServerQueryTimeout(timeout) {
    (await createDgraphClient(dgraphServerUrl)).client.setQueryTimeout(timeout);
}

export function setCurrentServerSlashApiKey(slashApiKey) {
    clientStubOptions.headers["X-Auth-Token"] = slashApiKey;
}

export function setCurrentServerAuthToken(authToken) {
    clientStubOptions.headers["X-Dgraph-AuthToken"] = authToken;
    clientStubOptions.headers["Authorization"] = authToken;
}

export const getDgraphClient = async () =>
    (await createDgraphClient(dgraphServerUrl)).client;

export const getDgraphClientStub = async () =>
    (await createDgraphClient(dgraphServerUrl)).stub;

export async function executeQuery(
    query,
    {
        action = "query",
        debug = false,
        readOnly = false,
        bestEffort = false,
        queryVars = undefined,
    } = {},
) {
    if (action === "mutate" || action === "alter") {
        debug = false;
    }
    if (action === "alter") {
        return executeAlter(query);
    }

    const client = await getDgraphClient();

    if (action === "query") {
        return client
            .newTxn({ readOnly, bestEffort })
            .queryWithVars(query, queryVars, { debug });
    } else if (action === "mutate") {
        return client.newTxn().mutate({ mutation: query, commitNow: true });
    }
    console.error("Unknown Method: ", action);
    throw new Error("Unknown Method: " + action);
}

// TODO: this code should be part of dgraph-js-http
export async function executeAdminGql(query, variables) {
    const client = await getDgraphClientStub();
    return await client.callAPI("admin", {
        method: "POST",
        headers: { ...clientStubOptions.headers, "Content-Type": "application/json" },
        body: JSON.stringify({
            query,
            variables,
            operationName: null,
        }),
    });
}

export async function executeAlter(schema) {
    const client = await getDgraphClient();
    return client.alter({ schema });
}

export function getHashParams() {
    const params = [...new URLSearchParams(window.location.hash)];
    if (!params.length) {
        return {};
    }
    params[0][0] = params[0][0].slice(1);
    return params.reduce(
        (acc, [key, value]) => Object.assign(acc, { [key]: value }),
        {},
    );
}

export function getAddrParam() {
    return (
        getHashParams().addr ||
        new URLSearchParams(window.location.search).get("addr") ||
        ""
    );
}

export function getDefaultUrl() {
    const addrParam = getAddrParam();
    if (addrParam) {
        return addrParam;
    }
    if (window.SERVER_ADDR) {
        return window.SERVER_ADDR;
    }

    const hostname = window.location.hostname;
    let port = ":8080";
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
        port = window.location.port ? ":" + window.location.port : "";
    }

    return `${window.location.protocol}//${hostname}${port}`;
}

export function sanitizeUrl(url) {
    // Add http if a scheme is not specified.
    if (!/^[a-zA-Z][a-zA-Z+.-]*?:\/\//i.test(url)) {
        url = "http://" + url;
    }

    const parser = document.createElement("a");
    parser.href = url;

    return ensureNoSlash(
        `${parser.protocol}//${parser.host}${parser.pathname}`,
    );
}

function ensureNoSlash(path) {
    if (path.endsWith("/")) {
        return path.substring(0, path.length - 1);
    }
    return path;
}
