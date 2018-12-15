import React from "react";
import Button from "react-bootstrap/lib/Button";

import { processUrl } from "../lib/helpers";

export default class SidebarUpdateUrl extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            urlString: "",
            urlHistory: [],
            showError: false,
        };
    }

    componentDidMount() {
        const { url } = this.props;
        if (url) {
            this.setState({
                urlString: url.url || "",
                urlHistory: url.urlHistory || [],
            });
        }
    }

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
            onSubmit && onSubmit(processUrl(urlString));
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
            urlString: e.target.value || this.state.urlString,
        });

    render() {
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
                        value={this.state.urlString}
                        onChange={this.handleUrlTextUpdate}
                        onKeyPress={this.handleKeyPress}
                        style={{
                            padding: "5px 8px",
                            width: "100%",
                            color: "black",
                        }}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="urlHistory">Recent servers:</label>
                    <select
                        id="urlHistory"
                        size={5}
                        value={this.state.urlString}
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
                {this.state.showError ? (
                    <p style={{ color: "#dc3545", marginTop: "5px" }}>
                        The URL field cannot be empty
                    </p>
                ) : null}
                <Button variant="default" onClick={this.handleCancel}>
                    Cancel
                </Button>
                &nbsp;
                <Button
                    variant="primary"
                    onClick={e => this.handleSubmit()}
                    disabled={!this.state.urlString.trim()}
                >
                    Update
                </Button>
            </form>
        );
    }
}
