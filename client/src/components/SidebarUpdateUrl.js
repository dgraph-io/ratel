// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import Button from "react-bootstrap/Button";

import { processUrl } from "../lib/helpers";

export default class SidebarUpdateUrl extends React.Component {
    state = {
        queryTimeout: 60,
        urlString: "",
        urlHistory: [],
        showError: false,
    };

    componentDidMount() {
        const { url } = this.props;
        if (url) {
            this.setState({
                urlString: url.url || "",
                urlHistory: url.urlHistory || [],
            });
        }
        this.setState({
            queryTimeout: url.queryTimeout || 60,
        });
    }

    handleUrlTextUpdate = event => {
        const value = event.target.value;
        this.setState({
            showError: !!(value && !value.trim()),
            urlString: value,
        });
    };

    handleQueryTimeoutUpdate = event =>
        this.setState({ queryTimeout: event.target.value });

    handleSubmit = selectedUrl => {
        const { onSubmit } = this.props;
        const { queryTimeout, urlString } = this.state;
        const newUrl = selectedUrl || urlString.trim();
        if (newUrl && onSubmit) {
            onSubmit(processUrl(newUrl), parseInt(queryTimeout) || 60);
        } else {
            this.setState({ showError: true });
        }
    };

    handleCancel = () => {
        const { onCancel } = this.props;
        onCancel && onCancel();
    };

    handleKeyPress = event => {
        if (event.key === "Enter") {
            this.handleSubmit();
        }
    };

    handleClickHistory = e =>
        this.setState({
            urlString: e.target.value,
        });

    render() {
        const { showError, urlString } = this.state;

        return (
            <form onSubmit={e => e.preventDefault()}>
                <h2>Server URL</h2>
                <hr />
                <div className="form-group">
                    <label htmlFor="serverUrlInput">
                        Enter Dgraph server URL:
                    </label>
                    <input
                        id="serverUrlInput"
                        type="text"
                        placeholder="https://dgraph.example.com/api"
                        value={urlString}
                        onChange={this.handleUrlTextUpdate}
                        onKeyPress={this.handleKeyPress}
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
                        value={urlString}
                        onChange={this.handleClickHistory}
                        onDoubleClick={e => this.handleSubmit(e.target.value)}
                        onKeyPress={this.handleKeyPress}
                        style={{
                            width: "100%",
                        }}
                    >
                        {this.state.urlHistory.map(url => (
                            <option key={url} value={url}>
                                {url}
                            </option>
                        ))}
                    </select>
                </div>
                <Button
                    variant="primary"
                    onClick={e => this.handleSubmit()}
                    disabled={!urlString.trim()}
                >
                    Update
                </Button>

                <hr />

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
                        value={this.state.queryTimeout}
                        onChange={this.handleQueryTimeoutUpdate}
                        style={{
                            padding: "5px 8px",
                            width: "100%",
                            color: "black",
                        }}
                    />
                </div>

                {/*
                <hr />

                <h3>Authentication</h3>
                <div className="form-group">
                    <label htmlFor="useridInput">Userid:</label>
                    <input
                        id="useridInput"
                        type="text"
                        placeholder="<userid>"
                        value={this.state.userid}
                        onChange={this.handleUseridChange}
                        style={{
                            padding: "5px 8px",
                            width: "100%",
                            color: "black",
                        }}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="passwordInput">Password:</label>
                    <input
                        id="passwordInput"
                        type="password"
                        placeholder="<password>"
                        value={this.state.password}
                        onChange={this.handlePasswordChange}
                        style={{
                            padding: "5px 8px",
                            width: "100%",
                            color: "black",
                        }}
                    />
                </div>
                <Button
                    variant="primary"
                    onClick={onLogin}
                    disabled={!urlString.trim()}
                >
                    Login
                </Button>
                */}
            </form>
        );
    }
}
