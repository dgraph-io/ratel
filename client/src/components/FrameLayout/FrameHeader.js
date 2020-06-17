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

import React from "react";
import { useDispatch } from "react-redux";
import classnames from "classnames";

import { discardFrame, setActiveFrame } from "../../actions/frames";
import { updateQueryAndAction } from "../../actions/query";

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
    collapsed,
    frame,
    isActive,
    isFullscreen,
    onToggleFullscreen,
}) {
    const dispatch = useDispatch();
    const selectFrame = () => {
        dispatch(updateQueryAndAction(frame.query, frame.action));
        dispatch(setActiveFrame(frame.id));
    };

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
            <div className="timing-outer" title={title} onClick={selectFrame}>
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
                active: isActive,
            })}
        >
            {frame.query ? (
                <QueryPreview
                    frameId={frame.id}
                    query={frame.query}
                    action={frame.action}
                    hasError={frame.hasError}
                    onClick={selectFrame}
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
                        onClick={() => dispatch(discardFrame(frame.id))}
                    >
                        <i className="fas fa-trash-alt" />
                    </button>
                ) : null}
            </div>
        </div>
    );
}
