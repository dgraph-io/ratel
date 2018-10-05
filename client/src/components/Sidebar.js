import React from "react";
import classnames from "classnames";
import OverlayTrigger from "react-bootstrap/lib/OverlayTrigger";
import Tooltip from "react-bootstrap/lib/Tooltip";

import "../assets/css/Sidebar.scss";

import logo from "../assets/images/dgraph.png";

export default class Sidebar extends React.Component {
    button({ menuId, label, icon, fontAwesomeIcon, extraClassname }) {
        const { currentMenu, onToggleMenu } = this.props;
        const className = currentMenu === menuId ? "link active" : "link";
        return (
            <li className={extraClassname || ""}>
                <a
                    href={"#" + menuId}
                    className={className}
                    onClick={e => {
                        e.preventDefault();
                        onToggleMenu(menuId);
                    }}
                >
                    {icon || <i className={"icon " + fontAwesomeIcon} />}
                    <label>{label}</label>
                </a>
            </li>
        );
    }

    renderConnectionString = () => {
        const { connection, serverName } = this.props;
        const serverDisplayString = (serverName || "No URL").replace(
            /^[a-z]*:\/\//i,
            "",
        );

        let icon = null;
        let errorStyle = "";
        if (connection.refreshing) {
            icon = <i key="refreshing" className="fas fa-plug refreshing" />;
        } else if (connection.connected) {
            icon = <i key="connected" className="fas fa-circle connected" />;
        } else {
            errorStyle = "error";
            icon = (
                <i
                    key="disconnected"
                    className="fas fa-exclamation-triangle disconnected"
                />
            );
        }

        return (
            <div className={"connection-string " + errorStyle}>
                {icon}
                <span className="server-name">
                    &nbsp;
                    {serverDisplayString}
                </span>
            </div>
        );
    };

    renderConnectionButton = () => {
        const dgraphLogo = <img src={logo} alt="logo" className="icon logo" />;
        const button = this.button({
            extraClassname: "brand",
            menuId: "connection",
            icon: dgraphLogo,
            label: this.renderConnectionString(),
        });

        if (this.props.currentMenu === "connection") {
            return button;
        } else {
            return (
                <OverlayTrigger
                    placement="right"
                    overlay={
                        <Tooltip id="tooltip">
                            {this.renderConnectionString()}
                            <span>Status:&nbsp;</span>
                            <label>{this.getConnectionStatus()}</label>
                        </Tooltip>
                    }
                >
                    {button}
                </OverlayTrigger>
            );
        }
    };

    getConnectionStatus = () => {
        const { connection } = this.props;
        if (connection.refreshing) {
            return "Establishing connection";
        } else if (connection.connected) {
            return "Connected";
        } else {
            return "Disconnected";
        }
    };

    render() {
        const { currentOverlay } = this.props;

        return (
            <div className="sidebar-container">
                <div className="sidebar-menu">
                    <ul>
                        {this.renderConnectionButton()}

                        {this.button({
                            menuId: "",
                            fontAwesomeIcon: "fas fa-terminal",
                            label: "Console",
                        })}

                        {this.button({
                            menuId: "schema",
                            fontAwesomeIcon: "fas fa-pencil-ruler",
                            label: "Schema",
                        })}

                        {this.button({
                            menuId: "info",
                            fontAwesomeIcon: "far fa-question-circle",
                            label: "Help",
                        })}
                        {this.button({
                            menuId: "feedback",
                            fontAwesomeIcon: "far fa-comments",
                            label: "Feedback",
                        })}
                    </ul>
                </div>
                <div
                    className={classnames("sidebar-content", {
                        open: Boolean(currentOverlay),
                    })}
                >
                    {currentOverlay}
                </div>
            </div>
        );
    }
}
