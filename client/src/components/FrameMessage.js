// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import classnames from "classnames";

import FrameCodeTab from "./FrameCodeTab";

const _if = (test, value, elseValue = null) => (test ? value : elseValue);

export default class FrameMessage extends React.Component {
    state = {
        // tabs are: result (error or success), jsonResponse, userQuery
        currentTab: "result",
    };

    openTab = currentTab =>
        this.setState({
            currentTab,
        });

    render() {
        const { errorMessage, successMessage, rawResponse, query } = this.props;
        const isError = !!errorMessage;
        const { currentTab } = this.state;

        console.log(isError, rawResponse, query);

        return (
            <div className="body">
                <ul className="toolbar">
                    {_if(
                        isError,
                        <li>
                            <button
                                className={classnames("sidebar-nav-item", {
                                    active: currentTab === "result",
                                })}
                                onClick={() => this.openTab("result")}
                            >
                                <i className="icon fas fa-exclamation-triangle" />
                                <span className="menu-label">Error</span>
                            </button>
                        </li>,
                        <li>
                            <button
                                className={classnames("sidebar-nav-item", {
                                    active: currentTab === "result",
                                })}
                                onClick={() => this.openTab("result")}
                            >
                                <i className="icon fa fa-check-circle" />
                                <span className="menu-label">Message</span>
                            </button>
                        </li>,
                    )}
                    <li>
                        <button
                            className={classnames("sidebar-nav-item", {
                                active: currentTab === "jsonResponse",
                            })}
                            onClick={() => this.openTab("jsonResponse")}
                        >
                            <i className="icon fa fa-code" />

                            <span className="menu-label">JSON</span>
                        </button>
                    </li>
                    <li>
                        <button
                            className={classnames("sidebar-nav-item", {
                                active: currentTab === "userQuery",
                            })}
                            onClick={() => this.openTab("userQuery")}
                        >
                            <i className="icon fa fa-code" />

                            <span className="menu-label">Query</span>
                        </button>
                    </li>
                </ul>

                {_if(
                    currentTab === "result",
                    <div className="text-content">
                        {isError ? errorMessage : successMessage}
                    </div>,
                )}
                {_if(
                    currentTab === "jsonResponse",
                    <FrameCodeTab code={rawResponse} />,
                )}
                {_if(currentTab === "userQuery", <FrameCodeTab code={query} />)}

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
