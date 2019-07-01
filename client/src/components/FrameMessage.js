// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";

import FrameCodeTab from "./FrameCodeTab";

const _if = (test, value, elseValue = null) => (test ? value : elseValue);

export default function FrameMessage(props) {
    // Response tabs are: result (error or success), jsonResponse, userQuery
    const [currentTab, setCurrentTab] = React.useState("result");

    const toolbarBtn = (id, iconClass, label) => (
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

    const { error, message, query, response } = props;
    const isError = !!error;

    return (
        <div className="body">
            <Tabs
                className="toolbar"
                id="frame-session-tabs"
                activeKey={currentTab}
                onSelect={setCurrentTab}
            >
                {_if(
                    isError,
                    toolbarBtn(
                        "result",
                        "fas fa-exclamation-triangle",
                        "Error",
                    ),
                    toolbarBtn("result", "fa fa-check-circle", "Message"),
                )}
                {toolbarBtn("jsonResponse", "fa fa-code", "JSON")}
                {toolbarBtn("userQuery", "fas fa-terminal", "Request")}
            </Tabs>
            {console.log(isError, error, isError && currentTab === "result")}
            {isError && currentTab === "result" && (
                <div className="text-content">
                    <pre>{`
Error Name: ${error.name}

Message: ${error.message}

URL: ${error.url}
`}</pre>
                </div>
            )}
            {_if(
                currentTab === "jsonResponse",
                <FrameCodeTab code={isError ? error : response} />,
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
