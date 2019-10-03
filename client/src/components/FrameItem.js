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
import classnames from "classnames";
import screenfull from "screenfull";

import FrameHeader from "./FrameLayout/FrameHeader";
import FrameSession from "./FrameLayout/FrameSession";
import FrameLoading from "./FrameLoading";
import FrameMessage from "./FrameMessage";

export default function FrameItem({
    activeFrameId,
    collapsed,
    frame,
    onDeleteNode,
    onDiscardFrame,
    onSelectQuery,
    showFrame,
    tabName,
    tabResult,
}) {
    if (!collapsed) {
        showFrame(frame.id);
    }

    const [isFullscreen, setFullscreen] = React.useState(
        screenfull.isFullscreen,
    );

    const frameRef = React.createRef();

    React.useEffect(() => {
        const callback = () => setFullscreen(screenfull.isFullscreen);
        document.addEventListener(screenfull.raw.fullscreenchange, callback);

        return () =>
            document.removeEventListener(
                screenfull.raw.fullscreenchange,
                callback,
            );
    });

    const handleToggleFullscreen = () => {
        if (!screenfull.enabled) {
            return;
        }

        if (isFullscreen) {
            screenfull.exit();
            setFullscreen(false);
        } else {
            screenfull.request(frameRef.current);
            setFullscreen(true);
        }
    };

    const { response, error } = tabResult || {};

    const renderContent = () => {
        if (!frame.completed) {
            return <FrameLoading />;
        }
        return response ? (
            <FrameSession
                activeTab={tabName}
                frame={frame}
                tabResult={tabResult}
                onDeleteNode={onDeleteNode}
            />
        ) : (
            <FrameMessage
                error={error}
                query={frame.query}
                response={response}
            />
        );
    };

    return (
        <li
            className={classnames("frame-item", {
                fullscreen: isFullscreen,
                collapsed,
            })}
            ref={frameRef}
        >
            <FrameHeader
                activeFrameId={activeFrameId}
                frame={frame}
                isFullscreen={isFullscreen}
                collapsed={collapsed}
                onToggleFullscreen={handleToggleFullscreen}
                onDiscardFrame={onDiscardFrame}
                onSelectQuery={onSelectQuery}
            />
            {!collapsed ? renderContent() : null}
        </li>
    );
}
