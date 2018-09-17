import React from "react";
import classnames from "classnames";

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
    render() {
        const { currentOverlay } = this.props;
        return (
            <div className="sidebar-container">
                <div className="sidebar-menu">
                    <ul>
                        {this.button({
                            extraClassname: "brand",
                            menuId: "",
                            icon: (
                                <img
                                    src={logo}
                                    alt="logo"
                                    className="icon logo"
                                />
                            ),
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
