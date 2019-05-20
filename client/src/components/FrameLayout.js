// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import ReactDOM from "react-dom";
import screenfull from "screenfull";
import classnames from "classnames";

import FrameHeader from "./FrameLayout/FrameHeader";

export default class FrameLayout extends React.Component {
    state = {
        isFullscreen: false,
    };

    _frameRef = React.createRef();

    componentDidMount() {
        // Sync fullscreen exit in case exited by ESC.
        // IDEA: This is not efficient as there will be as many event listeners as
        // there are frames.
        document.addEventListener(
            screenfull.raw.fullscreenchange,
            this.syncFullscreenExit,
        );
    }

    componentWillUnmount() {
        document.removeEventListener(
            screenfull.raw.fullscreenchange,
            this.syncFullscreenExit,
        );
    }

    /**
     * sycnFullscreenExit checks if fullscreen, and updates the state to false if not.
     * used as a callback to fullscreen change event. Needed becasue a user might
     * exit fullscreen by pressing ESC.
     */
    syncFullscreenExit = () => {
        const isFullscreen = screenfull.isFullscreen;

        if (!isFullscreen) {
            this.setState({ isFullscreen: false });
        }
    };

    handleToggleFullscreen = () => {
        if (!screenfull.enabled) {
            return;
        }

        const { isFullscreen } = this.state;

        if (isFullscreen) {
            screenfull.exit();
            this.setState({ isFullscreen: false });
        } else {
            const frameEl = ReactDOM.findDOMNode(this._frameRef.current);
            screenfull.request(frameEl);
            this.setState({ isFullscreen: true });
        }
    };

    render() {
        const {
            activeFrameId,
            children,
            onDiscardFrame,
            onSelectQuery,
            frame,
            collapsed,
        } = this.props;
        const { isFullscreen } = this.state;

        return (
            <li
                className={classnames("frame-item", {
                    fullscreen: isFullscreen,
                    collapsed,
                })}
                ref={this._frameRef}
            >
                <FrameHeader
                    activeFrameId={activeFrameId}
                    frame={frame}
                    isFullscreen={isFullscreen}
                    collapsed={collapsed}
                    onToggleFullscreen={this.handleToggleFullscreen}
                    onDiscardFrame={onDiscardFrame}
                    onSelectQuery={onSelectQuery}
                />
                {!collapsed ? children : null}
            </li>
        );
    }
}
