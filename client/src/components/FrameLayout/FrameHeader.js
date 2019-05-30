// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import classnames from "classnames";

import QueryPreview from "./QueryPreview";
import "./FrameHeader.scss";

function timeToText(ns) {
    if (ns === null || ns === undefined) {
        return "";
    }
    if (ns < 1e4) {
        return ns.toFixed(0) + "ns";
    }
    const ms = ns / 1e6;
    if (ms < 1000) {
        return ms.toFixed(0) + "ms";
    }
    const s = ms / 1000;
    if (s <= 60) {
        return s.toFixed(1) + "s";
    }
    const secondsOnly = Math.round(s) % 60;

    return `${Math.floor(s / 60)}m${secondsOnly.toLocaleString("en", {
        minimumIntegerDigits: 2,
    })}s`;
}

export default function FrameHeader({
    activeFrameId,
    frame,
    isFullscreen,
    onDiscardFrame,
    onSelectQuery,
    onToggleFullscreen,
    collapsed,
}) {
    const onClick = () => onSelectQuery(frame.id, frame.query, frame.action);

    function drawLatency(serverNs, networkNs) {
        if (
            serverNs === undefined ||
            networkNs === undefined ||
            serverNs === null ||
            networkNs === null
        ) {
            return null;
        }
        const ratio = serverNs / (serverNs + networkNs);

        const title = `Server Latency: ${timeToText(serverNs)} (${(
            ratio * 100
        ).toFixed(0)}%)\nNetwork Latency: ${timeToText(networkNs)} (${(
            (1 - ratio) *
            100
        ).toFixed(0)}%)\nTotal Latency: ${timeToText(serverNs + networkNs)}`;

        const flexStyles = {
            server: { flexGrow: 1000 * ratio },
            network: { flexGrow: 1000 * (1 - ratio) },
        };
        return (
            <div className="timing-outer" title={title} onClick={onClick}>
                <div className="progress">
                    <div className="server-bar" style={flexStyles.server} />
                    <div className="network-bar" style={flexStyles.network} />
                </div>
                <div className="text-wrapper">
                    <div className="server-text" style={flexStyles.server}>
                        {timeToText(serverNs)}
                    </div>
                    <div className="network-text" style={flexStyles.network}>
                        {timeToText(networkNs)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={classnames("frame-header", {
                active: frame.id === activeFrameId,
            })}
        >
            {frame.query ? (
                <QueryPreview
                    frameId={frame.id}
                    query={frame.query}
                    action={frame.action}
                    hasError={frame.hasError}
                    onClick={onClick}
                />
            ) : null}

            {drawLatency(frame.serverLatencyNs, frame.networkLatencyNs)}

            <div className="actions">
                {collapsed ? null : (
                    <button
                        className="action btn btn-link"
                        onClick={onToggleFullscreen}
                    >
                        {isFullscreen ? (
                            <i className="fa fa-compress" />
                        ) : (
                            <i className="fa fa-expand" />
                        )}
                    </button>
                )}

                {!isFullscreen ? (
                    <button
                        className="action btn btn-link"
                        onClick={() => onDiscardFrame(frame.id)}
                    >
                        <i className="fas fa-trash" />
                    </button>
                ) : null}
            </div>
        </div>
    );
}
