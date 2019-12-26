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
import { useDispatch, useSelector } from "react-redux";
import screenfull from "screenfull";

import {
    setResultsTab,
    TAB_VISUAL,
    TAB_QUERY,
    TAB_JSON,
    TAB_GEO,
    TAB_TIMELINE,
} from "../actions/frames";
import FrameBodyToolbar from "./FrameLayout/FrameBodyToolbar";
import FrameCodeTab from "./FrameCodeTab";
import FrameErrorMessage from "./FrameLayout/FrameErrorMessage";
import FrameMessage from "./FrameLayout/FrameMessage";
import FrameHeader from "./FrameLayout/FrameHeader";
import FrameHistoric from "./FrameLayout/FrameHistoric";
import FrameSession from "./FrameLayout/FrameSession";
import FrameLoading from "./FrameLoading";
import GeoView from "components/ConsolePage/GeoView";

export default function FrameItem({
    activeFrameId,
    collapsed,
    frame,
    onDeleteNode,
    onDiscardFrame,
    onSelectQuery,
    tabResult,
}) {
    const [isFullscreen, setFullscreen] = React.useState(
        screenfull.isFullscreen,
    );

    const dispatch = useDispatch();
    const activeTab = useSelector(store => store.frames.tab);
    const setActiveTab = tab => dispatch(setResultsTab(tab));

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

    const renderContent = () => {
        if (activeTab === TAB_QUERY) {
            return <FrameCodeTab code={frame.query} />;
        }
        if (activeTab === TAB_GEO) {
            return <GeoView results={tabResult} />;
        }
        if (activeTab === TAB_TIMELINE) {
            return <FrameCodeTab code={tabResult.response} />;
        }
        if (!tabResult.completed) {
            if (!tabResult.canExecute && !tabResult.executionStart) {
                return <FrameHistoric />;
            } else {
                return <FrameLoading />;
            }
        }
        switch (activeTab) {
            case TAB_VISUAL:
                if (frame.action !== "query") {
                    return <FrameMessage frame={frame} tabResult={tabResult} />;
                }
                return frame.action === "query" && !tabResult.error ? (
                    <FrameSession
                        frame={frame}
                        tabResult={tabResult}
                        onDeleteNode={onDeleteNode}
                    />
                ) : (
                    <FrameErrorMessage error={tabResult.error} />
                );

            case TAB_JSON:
            default:
                return <FrameCodeTab code={tabResult.response} />;
        }
    };

    const renderFrameBody = () => (
        <div className="body">
            <FrameBodyToolbar
                activeTab={activeTab}
                frame={frame}
                setActiveTab={setActiveTab}
                tabResult={tabResult}
            />
            {renderContent()}
        </div>
    );

    return (
        <li
            className={classnames("frame-item", {
                fullscreen: isFullscreen,
                collapsed,
            })}
            ref={frameRef}
        >
            <FrameHeader
                frame={frame}
                isActive={activeFrameId === frame.id}
                isFullscreen={isFullscreen}
                collapsed={collapsed}
                onToggleFullscreen={handleToggleFullscreen}
                onDiscardFrame={onDiscardFrame}
                onSelectQuery={onSelectQuery}
            />
            {!collapsed ? renderFrameBody() : null}
        </li>
    );
}
