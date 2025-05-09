/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import classnames from "classnames";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import { useDispatch } from "react-redux";

import { discardFrame, setActiveFrame } from "actions/frames";
import { updateQueryAndAction, updateQueryVars } from "actions/query";

import SharingSettings from "./SharingSettings";
import QueryPreview from "./QueryPreview";
import "./FrameHeader.scss";

function timeToText(ns) {
    if (ns === null || ns === undefined) {
        return ""
    }
    if (ns < 1e4) {
        return ns.toFixed(0) + "ns"
    }
    const ms = ns / 1e6
    if (ms < 1000) {
        return ms.toFixed(0) + "ms"
    }
    const s = ms / 1000
    if (s <= 60) {
        return s.toFixed(1) + "s"
    }
    const secondsOnly = Math.round(s) % 60

    return `${Math.floor(s / 60)}m${secondsOnly.toLocaleString("en", {
        minimumIntegerDigits: 2,
    })}s`
}

export default function FrameHeader({
    collapsed,
    frame,
    isActive,
    isFullscreen,
    onToggleFullscreen,
}) {
    const dispatch = useDispatch()
    const selectFrame = () => {
        dispatch(updateQueryAndAction(frame.query, frame.action))
        if (frame.action === "query") {
            dispatch(updateQueryVars(frame.queryOptions?.queryVars || []))
        }
        dispatch(setActiveFrame(frame.id))
    }

    function drawLatency(serverNs, networkNs) {
        if (
            serverNs === undefined ||
            networkNs === undefined ||
            serverNs === null ||
            networkNs === null
        ) {
            return null
        }
        const ratio = serverNs / (serverNs + networkNs)

        const title = `Alpha Latency: ${timeToText(serverNs)} (${(ratio * 100).toFixed(
            0,
        )}%)\nNetwork Latency: ${timeToText(networkNs)} (${((1 - ratio) * 100).toFixed(
            0,
        )}%)\nTotal Latency: ${timeToText(serverNs + networkNs)}`

        const flexStyles = {
            server: { flexGrow: 1000 * ratio },
            network: { flexGrow: 1000 * (1 - ratio) },
        }
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
        )
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
                    <>
                        <DropdownButton
                            className="dropdown-share action"
                            title={<i className="fa fa-share" />}
                        >
                            <Dropdown.Item as={SharingSettings} query={frame.query} />
                        </DropdownButton>

                        <button className="action btn btn-link" onClick={onToggleFullscreen}>
                            {isFullscreen ? (
                                <i className="fa fa-compress" />
                            ) : (
                                <i className="fa fa-expand" />
                            )}
                        </button>
                    </>
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
    )
}
