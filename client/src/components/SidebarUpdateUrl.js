// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import Button from "react-bootstrap/Button";

import SidebarLoginControl from "./SidebarLoginControl";

import { processUrl } from "../lib/helpers";

export default function SidebarUpdateUrl({
    onCancel,
    onLogin,
    onLogout,
    onSubmit,
    urlState,
}) {
    const {
        queryTimeout = 60,
        url = "http://localhost:8080",
        urlHistory = [],
    } = urlState;

    const [queryTimeoutState, setQueryTimeout] = React.useState(queryTimeout);
    const [urlInput, setUrlInput] = React.useState(url);
    const [urlHistoryState] = React.useState(urlHistory);
    const [showError, setShowError] = React.useState(false);

    const handleUrlTextUpdate = event => {
        const value = event.target.value;
        setShowError(value && !value.trim());
        setUrlInput(value);
    };

    const handleQueryTimeoutUpdate = event =>
        setQueryTimeout(event.target.value);

    const handleSubmit = selectedUrl => {
        const newUrl = selectedUrl || urlInput.trim();
        if (newUrl) {
            onSubmit(processUrl(newUrl), parseInt(queryTimeoutState) || 60);
        } else {
            setShowError(true);
        }
    };

    const handleKeyPress = event => {
        if (event.key === "Enter") {
            handleSubmit();
        }
    };

    return (
        <form onSubmit={e => e.preventDefault()}>
            <h2>Server URL</h2>
            <hr />
            <div className="form-group">
                <label htmlFor="serverUrlInput">Enter Dgraph server URL:</label>
                <input
                    id="serverUrlInput"
                    type="text"
                    placeholder="https://dgraph.example.com/api"
                    value={urlInput}
                    onChange={handleUrlTextUpdate}
                    onKeyPress={handleKeyPress}
                    style={{
                        padding: "5px 8px",
                        width: "100%",
                        color: "black",
                    }}
                />
                {showError ? (
                    <p style={{ color: "#dc3545", marginTop: "5px" }}>
                        The URL field cannot be empty
                    </p>
                ) : null}
            </div>
            <div className="form-group">
                <label htmlFor="urlHistory">Recent servers:</label>
                <select
                    id="urlHistory"
                    size={5}
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onDoubleClick={e => {
                        setUrlInput(e.target.value);
                        handleSubmit(e.target.value);
                    }}
                    onKeyPress={handleKeyPress}
                    style={{
                        width: "100%",
                    }}
                >
                    {urlHistoryState.map(url => (
                        <option key={url} value={url}>
                            {url}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label htmlFor="queryTimeoutInput">
                    Query timeout (seconds):
                </label>
                <input
                    id="queryTimeoutInput"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="<timeout in seconds>"
                    value={queryTimeoutState}
                    onChange={handleQueryTimeoutUpdate}
                    style={{
                        padding: "5px 8px",
                        width: "100%",
                        color: "black",
                    }}
                />
            </div>

            <br />

            <Button
                variant="primary"
                onClick={e => handleSubmit()}
                disabled={!urlInput.trim()}
                title="Update"
            >
                Update
            </Button>

            <hr />
            <h3>Authentication</h3>

            <SidebarLoginControl
                onLogin={onLogin}
                onLogout={onLogout}
                urlState={urlState}
            />
        </form>
    );
}
