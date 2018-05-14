import React from "react";
import TransitionGroup from "react-transition-group/TransitionGroup";
import CSSTransition from "react-transition-group/CSSTransition";

import FrameItem from "./FrameItem";

import "../assets/css/Frames.scss";

export default function FrameList({
    frames,
    framesTab,
    onDiscardFrame,
    onSelectQuery,
    onUpdateConnectedState,
    collapseAllFrames,
    updateFrame,
    url,
}) {
    return (
        <TransitionGroup component="ul" className="frame-list">
            {frames.map(frame => {
                return (
                    <CSSTransition
                        key={frame.id}
                        classNames="frame-item"
                        timeout={{ enter: 300, exit: 300 }}
                    >
                        <FrameItem
                            frame={frame}
                            framesTab={framesTab}
                            onDiscardFrame={onDiscardFrame}
                            onSelectQuery={onSelectQuery}
                            onUpdateConnectedState={onUpdateConnectedState}
                            collapseAllFrames={collapseAllFrames}
                            updateFrame={updateFrame}
                            url={url}
                        />
                    </CSSTransition>
                );
            })}
        </TransitionGroup>
    );
}
