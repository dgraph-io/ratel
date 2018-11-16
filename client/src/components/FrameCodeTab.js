import React from "react";
import Clipboard from "react-clipboard.js";

import Editor from "containers/Editor";

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
            typeof code === "string" ? code : JSON.stringify(code, null, 2);

        return (
            <div className="frame-code-tab">
                <Clipboard
                    className="btn-clipboard"
                    data-clipboard-text={json}
                    onSuccess={this.onCopySuccess}
                    onError={this.onCopyError}
                >
                    <i className="far fa-clipboard" />{" "}
                    {copyState === STATE_IDLE
                        ? "Copy Text to Clipboard"
                        : copyState === STATE_SUCCESS
                            ? "Copied!"
                            : "Error Occured!"}
                </Clipboard>

                <Editor query={json} mode="javascript" readOnly="nocursor" />
            </div>
        );
    }
}
