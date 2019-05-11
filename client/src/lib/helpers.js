// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import uuid from "uuid";
import URLSearchParams from "url-search-params";

export function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
        return response;
    } else {
        const error = new Error(response.statusText);
        error.response = response;
        throw error;
    }
}

// outgoingEdges gets edges coming out from the node with the given nodeId in
// given set of edges.
export function outgoingEdges(nodeId, edgeSet) {
    return edgeSet.get({
        filter: function(edge) {
            return edge.from === nodeId;
        },
    });
}

export function isShortestPath(query) {
    return (
        query.indexOf("shortest") !== -1 &&
        query.indexOf("to") !== -1 &&
        query.indexOf("from") !== -1
    );
}

export function showTreeView(query) {
    return (
        query.indexOf("orderasc") !== -1 || query.indexOf("orderdesc") !== -1
    );
}

export function isNotEmpty(response) {
    if (!response) {
        return false;
    }
    let keys = Object.keys(response);
    if (keys.length === 0) {
        return false;
    }

    for (let i = 0; i < keys.length; i++) {
        if (keys[i] !== "extensions" && keys[i] !== "uids") {
            return keys[i].length > 0 && response[keys[i]];
        }
    }
    return false;
}

export function sortStrings(a, b) {
    const nameA = a.toLowerCase();
    const nameB = b.toLowerCase();

    return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
}

export function getEndpointBaseURL(url) {
    return url.url;
}

// getEndpoint returns a URL for the dgraph endpoint, optionally followed by
// path string. Do not prepend `path` with slash.
export function getEndpoint(url, path = "", { debug = true, timeout } = {}) {
    const baseURL = getEndpointBaseURL(url);
    const fullUrl = `${baseURL}${path}`;

    const params = [];
    if (debug) {
        params.push("debug=true");
    }
    if (timeout) {
        params.push(`timeout=${timeout}s`);
    }
    if (params.length) {
        return `${fullUrl}?${params.join("&")}`;
    }

    return fullUrl;
}

export function createCookie(name, val, days, options = {}) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
    }

    let cookie = name + "=" + val + expires + "; path=/";
    if (options.crossDomain) {
        cookie += "; domain=.dgraph.io";
    }

    document.cookie = cookie;
}

export function readCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0)
            return c.substring(nameEQ.length, c.length);
    }

    return null;
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

// childNodes returns nodes that given edges point to.
export function childNodes(edges) {
    return edges.map(function(edge) {
        return edge.to;
    });
}

/**
 * makeFrame is a factory function for creating frame object
 *
 * @params action {String} - action can be query/mutate or alter.
 * @params data {Objecg} - data for the frame
 */
export function makeFrame({ query, action, ...props }) {
    return {
        id: uuid(),
        query,
        action,
        ...props,
    };
}

// CollapseQuery replaces deeply nested blocks in a query with ellipsis.
export function collapseQuery(query) {
    const depthLimit = 3;
    let ret = "";
    let depth = 0;

    for (let i = 0; i < query.length; i++) {
        let char = query[i];

        if (char === "{") {
            depth++;

            if (depth === depthLimit) {
                ret += char;
                ret += " ... ";
                continue;
            }
        } else if (char === "}") {
            depth--;
        }

        if (depth >= depthLimit) {
            continue;
        }

        ret += char;
    }

    return ret;
}

export function executeQuery(
    url,
    query,
    { action = "query", debug = false, queryTimeout } = {},
) {
    if (action === "mutate" || action === "alter") {
        debug = false;
    }
    const endpoint = getEndpoint(url, action, {
        debug,
        timeout: action === "query" ? queryTimeout : 0,
    });

    const options = {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        headers: {
            "Content-Type": "text/plain",
        },
        body: query,
        credentials: "same-origin",
    };

    if (action === "mutate") {
        options.headers["X-Dgraph-CommitNow"] = true;
        try {
            JSON.parse(query);
            options.headers["X-Dgraph-MutationType"] = "json";
            options.headers["Content-Type"] = "application/json";
        } catch (e) {}
    }

    if (action === "alter") {
        try {
            // DropAll and DropAttr requests are sent through JSON.
            JSON.parse(query);
            options.headers["Content-Type"] = "application/json";
        } catch (e) {}
    }

    return fetch(endpoint, options)
        .then(checkStatus)
        .then(response => response.json());
}

/**
 * getSharedQuery returns a promise that resolves with the query string corresponding
 * to the given shareId. Concretely, it fetches from the database the query
 * stored with the shareId. If not found, the promise resolves with an empty string.
 *
 * @params url {Object}
 * @params shareId {String}
 * @returns {Promise}
 *
 */
export function getSharedQuery(url, shareId) {
    return fetch(getEndpoint(url, "query"), {
        method: "POST",
        mode: "cors",
        headers: {
            Accept: "application/json",
        },
        body: `{
            query(func: uid(${shareId})) {
                _share_
            }
        }`,
        credentials: "same-origin",
    })
        .then(checkStatus)
        .then(response => response.json())
        .then(function(result) {
            if (
                !result.errors &&
                result.data &&
                result.data.query &&
                result.data.query.length > 0 &&
                result.data.query[0]._share_
            ) {
                return decodeURI(result.data.query[0]._share_);
            } else {
                return "";
            }
        })
        .catch(error =>
            console.warn(
                `Got error while getting query for id: ${shareId}, err: ${
                    error.message
                }`,
            ),
        );
}

export function getAddrParam() {
    const params = new URLSearchParams(window.location.search);
    const addrParam = params.get("addr");
    if (addrParam) {
        return ensureSlash(addrParam, true);
    }

    return "";
}

export function getDefaultUrl() {
    const addrParam = getAddrParam();
    if (addrParam) {
        return addrParam;
    } else if (window.SERVER_ADDR) {
        return ensureSlash(window.SERVER_ADDR, true);
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

    return ensureSlash(
        `${parser.protocol}//${parser.host}${parser.pathname}`,
        true,
    );
}

export function ensureSlash(path, needsSlash) {
    const hasSlash = path.endsWith("/");
    if (hasSlash && !needsSlash) {
        return path.substr(path, path.length - 1);
    } else if (!hasSlash && needsSlash) {
        return `${path}/`;
    } else {
        return path;
    }
}
