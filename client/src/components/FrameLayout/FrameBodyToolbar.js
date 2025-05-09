/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";

import { TAB_JSON, TAB_VISUAL, TAB_QUERY, TAB_GEO } from "actions/frames";
import GraphIcon from "components/GraphIcon";

export default function FrameBodyToolbar({ frame, activeTab, setActiveTab, tabResult }) {
    const isQueryFrame = frame.action === "query"
    const isError = tabResult.error || (tabResult.response && tabResult.response.error)

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
    )

    const visualTab = () => {
        if (isQueryFrame && !isError) {
            return toolbarBtn(TAB_VISUAL, <GraphIcon />, "Graph")
        }
        if (isError) {
            return toolbarBtn(
                TAB_VISUAL,
                <i className="icon fas fa-exclamation-triangle" />,
                "Error",
            )
        }
        return toolbarBtn(TAB_VISUAL, <i className="icon fa fa-check-circle" />, "Message")
    }

    return (
        <Tabs className="toolbar" id="frame-tabs" activeKey={activeTab} onSelect={setActiveTab}>
            {visualTab()}
            {toolbarBtn(TAB_JSON, <i className="icon fa fa-code" />, "JSON")}
            {toolbarBtn(TAB_QUERY, <i className="icon fas fa-terminal" />, "Request")}
            {toolbarBtn(TAB_GEO, <i className="icon fas fa-globe-americas" />, "Geo")}
        </Tabs>
    )
}
