// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";

import VerticalPanelLayout from "../PanelLayout/VerticalPanelLayout";
import EditorPanel from "../EditorPanel";
import FrameList from "../FrameList";
import FrameItem from "../FrameItem";

import "./QueryView.scss";

export default function QueryView({
    handleClearQuery,
    handleDiscardFrame,
    handleRunQuery,
    onSelectQuery,
    handleUpdateAction,
    handleUpdateConnectedState,
    handleUpdateQuery,
    activeFrameId,
    frames,
    framesTab,
    saveCodeMirrorInstance,
    patchFrame,
    queryTimeout,
    url,
}) {
    return (
        <div className="query-view">
            <h2>Console</h2>
            <VerticalPanelLayout
                first={
                    <div className="query-view-left-scrollable">
                        <EditorPanel
                            onClearQuery={handleClearQuery}
                            onRunQuery={handleRunQuery}
                            onUpdateQuery={handleUpdateQuery}
                            onUpdateAction={handleUpdateAction}
                            saveCodeMirrorInstance={saveCodeMirrorInstance}
                        />

                        <span className="badge badge-secondary history-label">
                            <i
                                className="fas fa-chevron-down"
                                style={{ fontSize: "0.75em" }}
                            />{" "}
                            History{" "}
                            <i
                                className="fas fa-chevron-down"
                                style={{ fontSize: "0.75em" }}
                            />
                        </span>
                        <FrameList
                            activeFrameId={activeFrameId}
                            frames={frames}
                            framesTab={framesTab}
                            onDiscardFrame={handleDiscardFrame}
                            onSelectQuery={onSelectQuery}
                            onUpdateConnectedState={handleUpdateConnectedState}
                            patchFrame={patchFrame}
                            queryTimeout={queryTimeout}
                            url={url}
                        />
                    </div>
                }
                second={
                    frames.length ? (
                        <FrameItem
                            activeFrameId={activeFrameId}
                            key={activeFrameId}
                            frame={
                                frames.find(f => f.id === activeFrameId) ||
                                frames[0]
                            }
                            framesTab={framesTab}
                            collapsed={false}
                            onDiscardFrame={handleDiscardFrame}
                            onSelectQuery={onSelectQuery}
                            onUpdateConnectedState={handleUpdateConnectedState}
                            patchFrame={patchFrame}
                            url={url}
                        />
                    ) : (
                        <div className="alert alert-secondary" role="alert">
                            Please run a query or a mutation
                        </div>
                    )
                }
            />
        </div>
    );
}
