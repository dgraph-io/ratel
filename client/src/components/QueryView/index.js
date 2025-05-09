/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useSelector } from "react-redux";

import VerticalPanelLayout from "../PanelLayout/VerticalPanelLayout";
import EditorPanel from "../EditorPanel";
import FrameList from "../FrameList";
import FrameItem from "../FrameItem";
import { TAB_JSON } from "actions/frames";

import "./QueryView.scss";

export default function QueryView() {
    const {
        activeFrameId,
        tab: activeTab,
        frameResults,
        items: frames,
    } = useSelector((store) => store.frames)

    const frame = frames.find((f) => f.id === activeFrameId) || frames[0] || {}
    const tabName =
        frame.action === "mutate" || activeTab === "geo" || activeTab === "timeline"
            ? TAB_JSON
            : activeTab
    const tabResult = frame && frameResults[frame.id] && frameResults[frame.id][tabName]

    return (
        <div className="query-view">
            <h2>Console</h2>
            <VerticalPanelLayout
                first={
                    <div className="query-view-left-scrollable">
                        <EditorPanel />

                        <span className="badge badge-secondary history-label">
                            <i className="fas fa-chevron-down" style={{ fontSize: "0.75em" }} />{" "}
                            History{" "}
                            <i className="fas fa-chevron-down" style={{ fontSize: "0.75em" }} />
                        </span>
                        <FrameList activeFrameId={activeFrameId} frames={frames} />
                    </div>
                }
                second={
                    frames.length ? (
                        <FrameItem
                            activeFrameId={activeFrameId}
                            key={activeFrameId}
                            frame={frame}
                            tabResult={tabResult || {}}
                            tabName={tabName}
                            collapsed={false}
                        />
                    ) : (
                        <div className="alert alert-secondary" role="alert">
                            Please run a query or a mutation
                        </div>
                    )
                }
            />
        </div>
    )
}
