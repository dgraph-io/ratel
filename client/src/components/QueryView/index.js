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
    onSetQuery,
    handleUpdateAction,
    handleUpdateQuery,
    activeFrameId,
    frames,
    frameResults,
    activeTab,
    showFrame,
}) {
    const frame = frames.find(f => f.id === activeFrameId) || frames[0] || {};
    const tabName = frame.action === "mutate" ? "mutate" : activeTab;
    const tabResult =
        frame && frameResults[frame.id] && frameResults[frame.id][tabName];

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
                            onDiscardFrame={handleDiscardFrame}
                            onSelectQuery={onSelectQuery}
                        />
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
                            onDiscardFrame={handleDiscardFrame}
                            onDeleteNode={({ uid }) => {
                                // TODO: this is a simple hack for formatting -- could also use beautify or something like that
                                const query = `{\n\tdelete {\n\t\t<${uid}> * * .\n\t}\n}`;
                                onSetQuery(query, "mutate");
                            }}
                            onSelectQuery={onSelectQuery}
                            showFrame={showFrame}
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
