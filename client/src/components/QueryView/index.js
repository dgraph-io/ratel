import React from "react";

import VerticalPanelLayout from "../PanelLayout/VerticalPanelLayout";
import EditorPanel from "../EditorPanel";
import FrameList from "../FrameList";
import FrameItem from "../FrameItem";

import "./QueryView.scss";

export default function QueryView({
    collapseAllFrames,
    handleClearQuery,
    handleDiscardAllFrames,
    handleDiscardFrame,
    handleRunQuery,
    handleSelectQuery,
    handleUpdateAction,
    handleUpdateConnectedState,
    handleUpdateQuery,
    frames,
    framesTab,
    saveCodeMirrorInstance,
    url,
    patchFrame,
    updateFrame,
}) {
    frames = frames || [];
    const canDiscardAll = frames.length > 0;

    return (
        <div className="query-view">
            <h2>Console</h2>
            <VerticalPanelLayout
                first={
                    <div className="query-view-left-scrollable">
                        <EditorPanel
                            canDiscardAll={canDiscardAll}
                            onClearQuery={handleClearQuery}
                            onDiscardAllFrames={handleDiscardAllFrames}
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
                            frames={frames}
                            framesTab={framesTab}
                            onDiscardFrame={handleDiscardFrame}
                            onSelectQuery={handleSelectQuery}
                            onUpdateConnectedState={handleUpdateConnectedState}
                            collapseAllFrames={collapseAllFrames}
                            patchFrame={patchFrame}
                            updateFrame={updateFrame}
                            url={url}
                        />
                    </div>
                }
                second={
                    frames.length ? (
                        <FrameItem
                            key={frames[0].id}
                            frame={frames[0]}
                            framesTab={framesTab}
                            forceCollapsed={false}
                            onDiscardFrame={handleDiscardFrame}
                            onSelectQuery={handleSelectQuery}
                            onUpdateConnectedState={handleUpdateConnectedState}
                            collapseAllFrames={collapseAllFrames}
                            patchFrame={patchFrame}
                            updateFrame={updateFrame}
                            url={url}
                        />
                    ) : (
                        <div class="alert alert-secondary" role="alert">
                            Please run a query or a mutation
                        </div>
                    )
                }
            />
        </div>
    );
}
