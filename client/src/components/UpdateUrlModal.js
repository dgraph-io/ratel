import React from "react";
import Modal from "react-bootstrap/lib/Modal";
import Button from "react-bootstrap/lib/Button";

import { processUrl } from "../lib/helpers";

export default class UpdateUrlModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            urlString: "",
            urlHistory: [],
            show: false,
            showError: false,
        };
    }

    open = url => {
        this.setState({
            show: true,
            urlString: url.url || "",
            urlHistory: url.urlHistory || [],
        });
    };

    close = () => {
        this.setState({ show: false });
    };

    handleUrlTextUpdate = event => {
        const value = event.target.value;
        this.setState({
            showError: value && !value.trim(),
            urlString: value,
        });
    };

    handleSubmit = selectedUrl => {
        const { onSubmit } = this.props;
        const urlString = selectedUrl || this.state.urlString.trim();
        if (urlString) {
            this.close();
            onSubmit && onSubmit(processUrl(urlString));
        } else {
            this.setState({ showError: true });
        }
    };

    handleCancel = () => {
        const { onCancel } = this.props;
        this.close();
        onCancel && onCancel();
    };

    handleKeyPress = event => {
        if (event.key === "Enter") {
            this.handleSubmit();
        }
    };

    handleClickHistory = e =>
        this.setState({
            urlString: e.target.value || this.state.urlString,
        });

    render() {
        return (
            <Modal show={this.state.show} onHide={this.handleCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>Update URL</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <h4>Enter Dgraph server URL:</h4>
                    <div
                        style={{
                            margin: "15px 0",
                        }}
                    >
                        <input
                            type="text"
                            placeholder="ex. https://dgraph.example.com/api"
                            value={this.state.urlString}
                            onChange={this.handleUrlTextUpdate}
                            onKeyPress={this.handleKeyPress}
                            style={{
                                padding: "5px 8px",
                                width: "100%",
                                fontSize: "1.08em",
                            }}
                        />
                        <div className="form-group">
                            <label htmlFor="urlHistory">Recent servers:</label>
                            <select
                                id="urlHistory"
                                size={5}
                                value={this.state.urlString}
                                onChange={e => this.handleClickHistory(e)}
                                onDoubleClick={e =>
                                    this.handleSubmit(e.target.value)
                                }
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
                        {this.state.showError ? (
                            <p style={{ color: "#dc3545", marginTop: "5px" }}>
                                The URL field cannot be empty
                            </p>
                        ) : null}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.handleCancel}>Cancel</Button>
                    <Button
                        bsStyle="primary"
                        onClick={e => this.handleSubmit()}
                        disabled={!this.state.urlString.trim()}
                    >
                        Update
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}
