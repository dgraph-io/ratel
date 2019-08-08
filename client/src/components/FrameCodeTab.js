// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import Clipboard from "react-clipboard.js";
import Highlight from "react-highlight";

import "highlight.js/styles/atom-one-light.css";

const STATE_IDLE = 0;
const STATE_ERROR = -1;
const STATE_SUCCESS = 1;

export default class FrameCodeTab extends React.Component {
    state = {
        copyState: STATE_IDLE,
    };

    componentWillUnmount() {
        this.cancelCopyTimer();
    }

    cancelCopyTimer = () => {
        if (this._timeout) {
            clearTimeout(this._timeout);
        }
        this._timeout = null;
    };

    newCopyTimer = delay => {
        if (this._timeout) {
            clearTimeout(this._timeout);
        }
        this._timeout = setTimeout(
            () =>
                this.setState({
                    copyState: STATE_IDLE,
                }),
            delay,
        );
    };

    onCopySuccess = () => {
        this.setState({
            copyState: STATE_SUCCESS,
        });

        this.newCopyTimer(800);
    };

    onCopyError = () => {
        this.setState({
            copyState: STATE_ERROR,
        });

        this.newCopyTimer(1500);
    };

    render() {
        const { code } = this.props;
        const { copyState } = this.state;
        const json =
            typeof code === "string"
                ? code
                : JSON.stringify(code, null, 2) || "";

        return (
            <div className="frame-code-tab">
                <Clipboard
                    className="btn-clipboard"
                    option-text={() => json}
                    onSuccess={this.onCopySuccess}
                    onError={this.onCopyError}
                >
                    <span>
                        <i className="far fa-clipboard" />{" "}
                        {copyState === STATE_IDLE
                            ? "Copy Text to Clipboard"
                            : copyState === STATE_SUCCESS
                            ? "Copied!"
                            : "Error Occured!"}
                    </span>
                </Clipboard>

                {json && json.length > 16000 ? (
                    <pre>{json}</pre>
                ) : (
                    <Highlight>{json}</Highlight>
                )}
            </div>
        );
    }
}
