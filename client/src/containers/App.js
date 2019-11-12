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
import { connect } from "react-redux";

import AclPage from "../components/ACL/AclPage";
import DataExplorer from "../components/DataExplorer";
import QueryView from "../components/QueryView";
import Schema from "../components/schema/Schema";
import Sidebar from "../components/Sidebar";
import SidebarInfo from "../components/SidebarInfo";
import SidebarUpdateUrl from "../components/SidebarUpdateUrl";

import { runQuery } from "../actions/frames";
import {
    updateConnectedState,
    updateShouldPrompt,
} from "../actions/connection";
import { setActiveFrame } from "../actions/frames";
import { updateQueryAndAction } from "../actions/query";
import { clickSidebarUrl } from "../actions/ui";
import {
    checkHealth,
    loginUser,
    logoutUser,
    setQueryTimeout,
    updateUrl,
} from "../actions/url";

import "../assets/css/App.scss";

class App extends React.Component {
    async componentDidMount() {
        const {
            activeFrameId,
            clickSidebarUrl,
            frames,
            handleCheckConnection,
        } = this.props;

        if (!activeFrameId && frames.length) {
            const { id, query, action } = frames[0];
            this.handleSelectQuery(id, query, action);
        }
        handleCheckConnection(() => clickSidebarUrl("connection"));
    }

    handleUpdateConnectionAndRefresh = (url, queryTimeout) => {
        const { handleSetQueryTimeout, handleUpdateUrl } = this.props;

        handleUpdateUrl(url);
        handleSetQueryTimeout(Math.max(1, queryTimeout));
        this.props.clickSidebarUrl("");
    };

    getOverlayContent = overlayUrl => {
        if (overlayUrl === "info") {
            return <SidebarInfo />;
        }
        if (overlayUrl === "connection") {
            const {
                clickSidebarUrl,
                handleDgraphLogin,
                handleDgraphLogout,
                url,
                queryTimeout,
            } = this.props;
            return (
                <SidebarUpdateUrl
                    urlState={url}
                    queryTimeout={queryTimeout}
                    onSubmit={this.handleUpdateConnectionAndRefresh}
                    onCancel={clickSidebarUrl}
                    onLogin={handleDgraphLogin}
                    onLogout={handleDgraphLogout}
                />
            );
        }
        return null;
    };

    handleSelectQuery = (frameId, query, action) => {
        const { handleUpdateQueryAndAction, handleSetActiveFrame } = this.props;

        handleUpdateQueryAndAction(query, action);
        handleSetActiveFrame(frameId);
    };

    handleSetQuery = (query, action) => {
        const { handleUpdateQueryAndAction } = this.props;

        handleUpdateQueryAndAction(query, action);
    };

    handleRunQuery = (query, action) => {
        this.props.dispatchRunQuery(query, action);
    };

    handleExternalQuery = query => {
        // Open the console
        this.props.clickSidebarUrl("");
        this.handleRunQuery(query, "query");
        this.handleSelectQuery(null, query, "query");
    };

    render() {
        const {
            clickSidebarUrl,
            connection,
            handleUpdateConnectedState,
            mainFrameUrl,
            overlayUrl,
            url,
        } = this.props;

        let mainFrameContent;
        if (mainFrameUrl === "") {
            mainFrameContent = (
                <QueryView
                    handleRunQuery={this.handleRunQuery}
                    onSelectQuery={this.handleSelectQuery}
                    onSetQuery={this.handleSetQuery}
                    handleUpdateConnectedState={handleUpdateConnectedState}
                />
            );
        } else if (mainFrameUrl === "schema") {
            mainFrameContent = (
                <Schema
                    url={url}
                    onUpdateConnectedState={handleUpdateConnectedState}
                    onOpenGeneratedQuery={this.handleExternalQuery}
                />
            );
        } else if (mainFrameUrl === "dataexplorer") {
            mainFrameContent = (
                <DataExplorer
                    url={url}
                    onUpdateConnectedState={handleUpdateConnectedState}
                />
            );
        } else if (mainFrameUrl === "acl") {
            mainFrameContent = (
                <AclPage
                    url={url}
                    onUpdateConnectedState={handleUpdateConnectedState}
                />
            );
        }

        return [
            <Sidebar
                key="app-sidebar"
                currentMenu={overlayUrl || mainFrameUrl}
                currentOverlay={this.getOverlayContent(overlayUrl)}
                onToggleMenu={this.props.clickSidebarUrl}
                connection={connection}
                serverName={url.url}
            />,
            <div
                key="app-main-content"
                className={classnames(
                    "main-content",
                    mainFrameUrl || "console",
                )}
            >
                {overlayUrl ? (
                    <div
                        className="click-capture"
                        onClick={() => clickSidebarUrl(mainFrameUrl)}
                    />
                ) : null}
                {mainFrameContent}
            </div>,
        ];
    }
}

function mapStateToProps(state) {
    return {
        activeFrameId: state.frames.activeFrameId,
        frames: state.frames.items,
        frameResults: state.frames.frameResults,
        activeTab: state.frames.tab,
        connection: state.connection,
        queryTimeout: state.ui.queryTimeout,
        url: state.url,

        mainFrameUrl: state.ui.mainFrameUrl,
        overlayUrl: state.ui.overlayUrl,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        clickSidebarUrl(url) {
            return dispatch(clickSidebarUrl(url));
        },
        dispatchRunQuery(query, action) {
            return dispatch(runQuery(query, action));
        },
        handleDgraphLogin(userid, password) {
            return dispatch(loginUser(userid, password));
        },
        handleDgraphLogout() {
            return dispatch(logoutUser());
        },
        handleSetActiveFrame(frameId) {
            return dispatch(setActiveFrame(frameId));
        },
        handleCheckConnection(onFailure) {
            return dispatch(checkHealth(null, onFailure));
        },
        handleUpdateConnectedState(nextState) {
            dispatch(updateConnectedState(nextState));
        },
        handleUpdateShouldPrompt() {
            dispatch(updateShouldPrompt());
        },
        handleUpdateQueryAndAction(query, action) {
            dispatch(updateQueryAndAction(query, action));
        },
        handleSetQueryTimeout(queryTimeout) {
            dispatch(setQueryTimeout(queryTimeout));
        },
        handleUpdateUrl(url) {
            dispatch(updateUrl(url));
        },
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(App);
