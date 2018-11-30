// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import Clipboard from "react-clipboard.js";

import Highlight from "./Highlight";

export default class FrameCodeTab extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            copyState: 0,
        };

        this._mounted = false;
        this._timeout = null;
    }

    componentDidMount() {
        this._mounted = true;
    }

    componentWillUnmount() {
        this._mounted = false;
        if (this._timeout != null) {
            clearTimeout(this._timeout);
            this._timeout = null;
        }
    }

    onCopySuccess = () => {
        this.setState({
            copyState: 1,
        });

        if (this._timeout != null) {
            clearTimeout(this._timeout);
        }
        this._timeout = setTimeout(() => {
            if (this._mounted) {
                this.setState({
                    copyState: 0,
                });
            }
        }, 800);
    };

    onCopyError = () => {
        this.setState({
            copyState: -1,
        });

        if (this._timeout != null) {
            clearTimeout(this._timeout);
        }
        this._timeout = setTimeout(() => {
            if (this._mounted) {
                this.setState({
                    copyState: 0,
                });
            }
        }, 1500);
    };

    render() {
        const { rawResponse } = this.props;
        const { copyState } = this.state;
        const json = JSON.stringify(rawResponse, null, 2);
        return (
            <div className="content-container">
                <div className="code-container">
                    <div className="code-header">
                        <div style={{ padding: "0 6px" }}>
                            <Clipboard
                                data-clipboard-text={json}
                                onSuccess={this.onCopySuccess}
                                onError={this.onCopyError}
                            >
                                {copyState === 0
                                    ? "Copy JSON Response"
                                    : copyState > 0
                                    ? "Copied!"
                                    : "Error Copying!"}
                            </Clipboard>
                        </div>
                    </div>
                    <Highlight preClass="content">{json}</Highlight>
                </div>
            </div>
        );
    }
}
