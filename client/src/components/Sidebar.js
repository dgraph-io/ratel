// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import classnames from "classnames";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

import GraphIcon from "./GraphIcon";
import SantaHat from "./SantaHat";

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

        const iconDiv =
            Date.now() > new Date("January 11, 2019 00:00") ? (
                dgraphLogo
            ) : (
                <div style={{ position: "relative" }}>
                    {dgraphLogo}
                    <div
                        style={{
                            position: "absolute",
                            transform: "rotateY(180deg) scale(0.45)",
                            top: -29,
                            right: -19,
                        }}
                    >
                        <SantaHat />
                    </div>
                </div>
            );

        const button = this.button({
            extraClassname: "brand",
            menuId: "connection",
            icon: iconDiv,
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
                            icon: (
                                <div
                                    style={{
                                        width: "44px",
                                        display: "inline-block",
                                    }}
                                >
                                    <GraphIcon />
                                </div>
                            ),
                            label: "Console",
                        })}

                        {this.button({
                            menuId: "schema",
                            fontAwesomeIcon: "fas fa-pencil-ruler",
                            label: "Schema",
                        })}

                        {this.button({
                            menuId: "dataexplorer",
                            fontAwesomeIcon: "fas fa-sitemap",
                            label: (
                                <span>
                                    Explorer
                                    <sup className="beta">&beta;</sup>
                                </span>
                            ),
                        })}

                        {this.button({
                            menuId: "services",
                            fontAwesomeIcon: "fas fa-database",
                            label: "Services",
                        })}

                        {this.button({
                            menuId: "info",
                            fontAwesomeIcon: "far fa-question-circle",
                            label: "Help",
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
