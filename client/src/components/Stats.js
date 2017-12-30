import React from "react";

// TODO - Later have one css file per component.
import "../assets/css/App.scss";

export default class Stats extends React.Component {
    render() {
        const display = (
            <span>
                {this.props.server !== "" && (
                    <span>
                        <span>Server Latency: </span>
                        <b>{this.props.server}</b>,{" "}
                    </span>
                )}
                {this.props.rendering !== "" && (
                    <span>
                        <span>Rendering: </span>
                        <b>{this.props.rendering}</b>
                    </span>
                )}
            </span>
        );
        return (
            <div style={{ marginTop: "5px" }} className="App-stats">
                <span>
                    {this.props.server !== "" || this.props.rendering !== ""
                        ? display
                        : ""}
                </span>
            </div>
        );
    }
}
