// Copyright 2017-2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from "react";
import classnames from "classnames";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { useDispatch, useSelector } from "react-redux";
import useInterval from "use-interval";

import GraphIcon from "./GraphIcon";
import SantaHat from "./SantaHat";

import { Unknown, Fetching, FetchError, OK } from "../reducers/connection";
import { checkHealth } from "../actions/connection";

import "../assets/css/Sidebar.scss";

import logo from "../assets/images/dgraph.png";

export default function Sidebar({ currentMenu, currentOverlay, onToggleMenu }) {
    const connection = useSelector(state => state.connection.currentServer);
    const dispatch = useDispatch();
    useInterval(() => dispatch(checkHealth({ unknownOnStart: false })), 2000);

    const renderButton = ({
        menuId,
        label,
        icon,
        fontAwesomeIcon,
        extraClassname,
    }) => {
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
    };

    const renderConnectionString = () => {
        const serverDisplayString = connection.url.replace(/^[a-z]*:\/\//i, "");

        let icon = null;
        let errorStyle = "";
        if (connection.health === Unknown) {
            icon = <i key="refreshing" className="fas fa-plug refreshing" />;
        } else if (connection.health === OK) {
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

    const getConnectionStatus = () => {
        if (connection.health === Unknown) {
            return "Unknown";
        }
        if (connection.health === Fetching) {
            return "Establishing connection";
        }
        if (connection.health === FetchError) {
            return "Connection Error";
        }
        if (connection.health === OK) {
            return "Connected";
        }
    };

    const renderConnectionButton = () => {
        const dgraphLogo = <img src={logo} alt="logo" className="icon logo" />;

        // Santa hat from Dec 20 to Jan 14th (Old New Year is Jan 14th)
        const now = new Date();
        const isChristmas =
            (now.getMonth() === 11 && now.getDate() >= 20) ||
            (now.getMonth() === 0 && now.getDate() < 15);

        const iconDiv = !isChristmas ? (
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

        const button = renderButton({
            extraClassname: "brand",
            menuId: "connection",
            icon: iconDiv,
            label: renderConnectionString(),
        });
        // TODO: tooltip seems broken. Probably since i've compacted the menus.
        return button;

        if (currentMenu === "connection") {
            return button;
        } else {
            return (
                <OverlayTrigger
                    placement="right"
                    overlay={
                        <Tooltip id="tooltip">
                            {renderConnectionString()}
                            <span>Status:&nbsp;</span>
                            <label>{getConnectionStatus()}</label>
                        </Tooltip>
                    }
                >
                    {button}
                </OverlayTrigger>
            );
        }
    };

    return (
        <div className="sidebar-container">
            <div className="sidebar-menu">
                <ul>
                    {renderConnectionButton()}

                    {renderButton({
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

                    {renderButton({
                        menuId: "schema",
                        fontAwesomeIcon: "fas fa-pencil-ruler",
                        label: "Schema",
                    })}

                    {renderButton({
                        menuId: "acl",
                        fontAwesomeIcon: "fas fa-unlock-alt",
                        label: "ACL",
                    })}

                    {window.RATEL_DEV_MODE &&
                        renderButton({
                            menuId: "cluster",
                            fontAwesomeIcon: "fas fa-layer-group",
                            label: <span>Cluster</span>,
                        })}

                    {renderButton({
                        menuId: "info",
                        fontAwesomeIcon: "far fa-question-circle",
                        label: "Help",
                    })}
                </ul>
            </div>
            <div
                className={classnames("sidebar-content", {
                    open: !!currentOverlay,
                })}
            >
                {currentOverlay}
            </div>
        </div>
    );
}
