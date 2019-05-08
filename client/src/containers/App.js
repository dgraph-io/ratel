// Copyright 2017-2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import React from "react";
import classnames from "classnames";
import { connect } from "react-redux";

import DataExplorer from "../components/DataExplorer";
import QueryView from "../components/QueryView";
import Schema from "../components/Schema";
import ServicesView from "../components/ServicesView";
import Sidebar from "../components/Sidebar";
import SidebarInfo from "../components/SidebarInfo";
import SidebarUpdateUrl from "../components/SidebarUpdateUrl";

import { runQuery } from "../actions";
import {
    refreshConnectedState,
    updateConnectedState,
    updateShouldPrompt,
} from "../actions/connection";
import { discardFrame, patchFrame, setActiveFrame } from "../actions/frames";
import {
    updateQuery,
    updateAction,
    updateQueryAndAction,
} from "../actions/query";
import { setQueryTimeout } from "../actions/ui";
import { updateUrl } from "../actions/url";

import "../assets/css/App.scss";

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            mainFrameUrl: "",
            overlayUrl: null,
        };
    }

    async componentDidMount() {
        const {
            activeFrameId,
            frames,
            handleRefreshConnectedState,
        } = this.props;
        handleRefreshConnectedState(this.openChangeUrlModal);
        if (!activeFrameId && frames.length) {
            const { id, query, action } = frames[0];
            this.handleSelectQuery(id, query, action);
        }
    }

    handleUpdateConnectionAndRefresh = (url, queryTimeout) => {
        const {
            handleRefreshConnectedState,
            handleSetQueryTimeout,
            handleUpdateShouldPrompt,
            _handleUpdateUrl,
        } = this.props;

        _handleUpdateUrl(url);
        handleSetQueryTimeout(Math.max(1, queryTimeout));
        handleUpdateShouldPrompt();
        handleRefreshConnectedState();
        this.handleToggleSidebarMenu("");
    };

    isMainFrameUrl = sidebarMenu =>
        ["", "schema", "dataexplorer", "services"].indexOf(sidebarMenu) >= 0;

    getOverlayContent = overlayUrl => {
        if (overlayUrl === "info") {
            return <SidebarInfo />;
        }
        if (overlayUrl === "connection") {
            const { url, queryTimeout } = this.props;
            return (
                <SidebarUpdateUrl
                    url={url}
                    queryTimeout={queryTimeout}
                    onSubmit={this.handleUpdateConnectionAndRefresh}
                    onCancel={() => this.handleToggleSidebarMenu("")}
                />
            );
        }
        return null;
    };

    handleToggleSidebarMenu = targetMenu => {
        if (this.isMainFrameUrl(targetMenu)) {
            this.setState({
                overlayUrl: null,
                mainFrameUrl: targetMenu,
            });
        } else {
            this.setState({
                // Second click on the same overlay button closes it.
                overlayUrl:
                    targetMenu === this.state.overlayUrl ? null : targetMenu,
            });
        }
    };

    // saveCodeMirrorInstance saves the codemirror instance initialized in the
    // <Editor /> component so that we can access it in this component. (e.g. to
    // focus).
    saveCodeMirrorInstance = codemirror => {
        this._codemirror = codemirror;
    };

    handleUpdateQuery = (val, done = () => {}) => {
        const { _handleUpdateQuery } = this.props;

        _handleUpdateQuery(val);
        done();
    };

    handleUpdateAction = action => {
        const { _handleUpdateAction } = this.props;

        _handleUpdateAction(action);
    };

    // focusCodemirror sets focus on codemirror and moves the cursor to the end.
    focusCodemirror = () => {
        const cm = this._codemirror;
        if (!cm) {
            // codeMirror instance hasn't been captured yet.
            return;
        }
        const lastlineNumber = cm.doc.lastLine();
        const lastCharPos = cm.doc.getLine(lastlineNumber).length;

        cm.focus();
        cm.setCursor({ line: lastlineNumber, ch: lastCharPos });
    };

    handleSelectQuery = (frameId, query, action) => {
        const {
            _handleUpdateQueryAndAction,
            handleSetActiveFrame,
        } = this.props;

        _handleUpdateQueryAndAction(query, action);
        handleSetActiveFrame(frameId);
        this.focusCodemirror();
    };

    handleSetQuery = (query, action) => {
        const { _handleUpdateQueryAndAction } = this.props;

        _handleUpdateQueryAndAction(query, action);
        this.focusCodemirror();
    };

    handleClearQuery = () => {
        this.handleUpdateQuery("", this.focusCodemirror);
    };

    handleRunQuery = (query, action) => {
        this.props._dispatchRunQuery(query, action);
    };

    openChangeUrlModal = () => {
        this.handleToggleSidebarMenu("connection");
    };

    handleExternalQuery = query => {
        // Open the console
        this.handleToggleSidebarMenu("");
        this.handleRunQuery(query, "query");
        this.handleSelectQuery(null, query, "query");
    };

    render() {
        const { mainFrameUrl, overlayUrl } = this.state;
        const {
            activeFrameId,
            connection,
            frames,
            framesTab,
            handleDiscardFrame,
            handleUpdateConnectedState,
            patchFrame,
            queryTimeout,
            url,
            backupList,
        } = this.props;

        let mainFrameContent;
        if (mainFrameUrl === "") {
            mainFrameContent = (
                <QueryView
                    handleClearQuery={this.handleClearQuery}
                    handleDiscardFrame={handleDiscardFrame}
                    handleRunQuery={this.handleRunQuery}
                    onSelectQuery={this.handleSelectQuery}
                    onSetQuery={this.handleSetQuery}
                    handleUpdateAction={this.handleUpdateAction}
                    handleUpdateConnectedState={handleUpdateConnectedState}
                    handleUpdateQuery={this.handleUpdateQuery}
                    activeFrameId={activeFrameId}
                    frames={frames}
                    framesTab={framesTab}
                    patchFrame={patchFrame}
                    queryTimeout={queryTimeout}
                    url={url}
                    saveCodeMirrorInstance={this.saveCodeMirrorInstance}
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
        } else if (mainFrameUrl === "services") {
            mainFrameContent = <ServicesView />;
        }

        return [
            <Sidebar
                key="app-sidebar"
                currentMenu={overlayUrl || mainFrameUrl}
                currentOverlay={this.getOverlayContent(overlayUrl)}
                onToggleMenu={this.handleToggleSidebarMenu}
                connection={connection}
                serverName={url.url}
            />,
            <div
                key="app-main-content"
                className={classnames("main-content", {
                    console: mainFrameUrl === "",
                    dataExplorer: mainFrameUrl === "dataexplorer",
                    schema: mainFrameUrl === "schema",
                })}
            >
                {overlayUrl ? (
                    <div
                        className="click-capture"
                        onClick={e => {
                            e.stopPropagation();
                            this.setState({
                                overlayUrl: null,
                            });
                        }}
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
        framesTab: state.frames.tab,
        connection: state.connection,
        queryTimeout: state.ui.queryTimeout,
        url: state.url,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        _dispatchRunQuery(query, action) {
            return dispatch(runQuery(query, action));
        },
        handleRefreshConnectedState(openChangeUrlModal) {
            dispatch(refreshConnectedState(openChangeUrlModal));
        },
        handleSetActiveFrame(frameId) {
            return dispatch(setActiveFrame(frameId));
        },
        handleDiscardFrame(frameId) {
            return dispatch(discardFrame(frameId));
        },
        handleUpdateConnectedState(nextState) {
            dispatch(updateConnectedState(nextState));
        },
        handleUpdateShouldPrompt() {
            dispatch(updateShouldPrompt());
        },
        _handleUpdateQuery(query) {
            dispatch(updateQuery(query));
        },
        handleSetQueryTimeout(queryTimeout) {
            dispatch(setQueryTimeout(queryTimeout));
        },
        _handleUpdateAction(action) {
            dispatch(updateAction(action));
        },
        _handleUpdateQueryAndAction(query, action) {
            dispatch(updateQueryAndAction(query, action));
        },
        patchFrame() {
            dispatch(patchFrame(...arguments));
        },
        _handleUpdateUrl(url) {
            dispatch(updateUrl(url));
        },
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(App);
