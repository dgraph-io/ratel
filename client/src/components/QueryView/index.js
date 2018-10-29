import React from "react";

import VerticalPanelLayout from "../PanelLayout/VerticalPanelLayout";
import EditorPanel from "../EditorPanel";
import FrameList from "../FrameList";

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
    const canDiscardAll = frames.length > 0;

    return (
        <div className="query-view">
            <h2>Console</h2>
            <VerticalPanelLayout
                first={
                    <EditorPanel
                        canDiscardAll={canDiscardAll}
                        onClearQuery={handleClearQuery}
                        onDiscardAllFrames={handleDiscardAllFrames}
                        onRunQuery={handleRunQuery}
                        onUpdateQuery={handleUpdateQuery}
                        onUpdateAction={handleUpdateAction}
                        saveCodeMirrorInstance={saveCodeMirrorInstance}
                    />
                }
                second={
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
                }
            />
        </div>
    );
}
