import React from "react";
import classnames from "classnames";

import SidebarInfo from "./SidebarInfo";
import SidebarFeedback from "./SidebarFeedback";

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
                    {icon || <i className={"icon far " + fontAwesomeIcon} />}
                    <label>{label}</label>
                </a>
            </li>
        );
    }
    render() {
        const { currentMenu } = this.props;
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
                            menuId: "info",
                            fontAwesomeIcon: "fa-question-circle",
                            label: "Help",
                        })}
                        {this.button({
                            menuId: "feedback",
                            fontAwesomeIcon: "fa-comments",
                            label: "Feedback",
                        })}
                    </ul>
                </div>
                <div
                    className={classnames("sidebar-content", {
                        open: Boolean(currentMenu),
                    })}
                >
                    {currentMenu === "info" ? <SidebarInfo /> : null}
                    {currentMenu === "feedback" ? <SidebarFeedback /> : null}
                </div>
            </div>
        );
    }
}
