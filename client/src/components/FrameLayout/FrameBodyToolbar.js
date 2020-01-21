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
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";

import { TAB_JSON, TAB_VISUAL, TAB_QUERY, TAB_TIMELINE } from "actions/frames";
import GraphIcon from "components/GraphIcon";

export default function FrameBodyToolbar({
    frame,
    activeTab,
    setActiveTab,
    tabResult,
}) {
    const isQueryFrame = frame.action === "query";
    const isError =
        tabResult.error || (tabResult.response && tabResult.response.error);

    const toolbarBtn = (id, icon, label) => (
        <Tab
            eventKey={id}
            title={
                <span>
                    <div className="icon-container">{icon}</div>
                    <span className="menu-label">{label}</span>
                </span>
            }
        />
    );

    const visualTab = () => {
        if (isQueryFrame && !isError) {
            return toolbarBtn(TAB_VISUAL, <GraphIcon />, "Graph");
        }
        if (isError) {
            return toolbarBtn(
                TAB_VISUAL,
                <i className="icon fas fa-exclamation-triangle" />,
                "Error",
            );
        }
        return toolbarBtn(
            TAB_VISUAL,
            <i className="icon fa fa-check-circle" />,
            "Message",
        );
    };

    return (
        <Tabs
            className="toolbar"
            id="frame-tabs"
            activeKey={activeTab}
            onSelect={setActiveTab}
        >
            {visualTab()}
            {toolbarBtn(TAB_JSON, <i className="icon fa fa-code" />, "JSON")}
            {toolbarBtn(
                TAB_QUERY,
                <i className="icon fas fa-terminal" />,
                "Request",
            )}
            {toolbarBtn(
                TAB_TIMELINE,
                <i className="icon far fa-clock" />,
                "Timeline",
            )}
        </Tabs>
    );
}
