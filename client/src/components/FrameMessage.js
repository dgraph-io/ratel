// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import Tab from "react-bootstrap/lib/Tab";
import Tabs from "react-bootstrap/lib/Tabs";

import FrameCodeTab from "./FrameCodeTab";

const _if = (test, value, elseValue = null) => (test ? value : elseValue);

export default class FrameMessage extends React.Component {
    state = {
        // tabs are: result (error or success), jsonResponse, userQuery
        currentTab: "result",
    };

    openTab = currentTab => this.setState({ currentTab });

    toolbarBtn = (id, iconClass, label) => (
        <Tab
            eventKey={id}
            title={
                <span>
                    <i className={`icon ${iconClass}`} />{" "}
                    <span className="menu-label">{label}</span>
                </span>
            }
        />
    );

    render() {
        const { errorMessage, query, rawResponse, successMessage } = this.props;
        const isError = !!errorMessage;
        const { currentTab } = this.state;

        return (
            <div className="body">
                <Tabs
                    className="toolbar"
                    id="frame-session-tabs"
                    activeKey={currentTab}
                    onSelect={this.openTab}
                >
                    {_if(
                        isError,
                        this.toolbarBtn(
                            "result",
                            "fas fa-exclamation-triangle",
                            "Error",
                        ),
                        this.toolbarBtn(
                            "result",
                            "fa fa-check-circle",
                            "Message",
                        ),
                    )}
                    {this.toolbarBtn("jsonResponse", "fa fa-code", "JSON")}
                    {this.toolbarBtn("userQuery", "fas fa-terminal", "Request")}
                </Tabs>

                {_if(
                    currentTab === "result",
                    <div className="text-content">
                        {isError
                            ? JSON.stringify(errorMessage)
                            : successMessage}
                    </div>,
                )}
                {_if(
                    currentTab === "jsonResponse",
                    <FrameCodeTab code={rawResponse} />,
                )}
                {_if(
                    currentTab === "userQuery",
                    <FrameCodeTab code={query} mode="graphql" />,
                )}

                {_if(
                    isError,
                    <div className="footer error-footer">
                        <i className="fas fa-exclamation-triangle error-mark" />{" "}
                        <span className="result-message">Error occurred</span>
                    </div>,
                )}
            </div>
        );
    }
}
