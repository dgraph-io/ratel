import React from "react";
import classnames from "classnames";
import { connect } from "react-redux";
import URLSearchParams from "url-search-params";

import DataExplorer from "../components/DataExplorer";
import QueryView from "../components/QueryView";
import Schema from "../components/Schema";
import Sidebar from "../components/Sidebar";
import SidebarInfo from "../components/SidebarInfo";
import SidebarFeedback from "../components/SidebarFeedback";
import SidebarUpdateUrl from "../components/SidebarUpdateUrl";

import { runQuery, runQueryByShareId } from "../actions";
import {
    refreshConnectedState,
    updateConnectedState,
    updateShouldPrompt,
} from "../actions/connection";
import {
    discardFrame,
    discardAllFrames,
    toggleCollapseFrame,
    patchFrame,
    updateFrame,
} from "../actions/frames";
import {
    updateQuery,
    updateAction,
    updateQueryAndAction,
} from "../actions/query";
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
        const { handleRefreshConnectedState, location } = this.props;

        handleRefreshConnectedState(this.openChangeUrlModal);

        const queryParams = new URLSearchParams(location.search);
        const shareId = queryParams && queryParams.get("shareId");
        if (shareId) {
            this.onRunSharedQuery(shareId);
        }
    }

    handeUpdateUrlAndRefresh = url => {
        const {
            handleRefreshConnectedState,
            handleUpdateShouldPrompt,
            _handleUpdateUrl,
        } = this.props;

        _handleUpdateUrl(url);
        handleUpdateShouldPrompt();
        handleRefreshConnectedState();
        this.handleToggleSidebarMenu("");
    };

    isMainFrameUrl = sidebarMenu =>
        ["", "schema", "dataexplorer"].indexOf(sidebarMenu) >= 0;

    getOverlayContent = overlayUrl => {
        if (overlayUrl === "info") {
            return <SidebarInfo />;
        }
        if (overlayUrl === "feedback") {
            return <SidebarFeedback />;
        }
        if (overlayUrl === "connection") {
            const { url } = this.props;
            return (
                <SidebarUpdateUrl
                    url={url}
                    onSubmit={this.handeUpdateUrlAndRefresh}
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

    handleSelectQuery = (query, action) => {
        const { _handleUpdateQueryAndAction } = this.props;

        _handleUpdateQueryAndAction(query, action);
        this.focusCodemirror();
    };

    handleClearQuery = () => {
        this.handleUpdateQuery("", this.focusCodemirror);
    };

    collapseAllFrames = () => {
        const { frames, handleCollapseFrame } = this.props;

        frames.forEach(handleCollapseFrame);
    };

    handleRunQuery = (query, action) => {
        this.collapseAllFrames();
        this.props._dispatchRunQuery(query, action);
    };

    handleDiscardAllFrames = () => {
        const { _handleDiscardAllFrames } = this.props;

        _handleDiscardAllFrames();
    };

    onRunSharedQuery = shareId => {
        const { handleRunSharedQuery } = this.props;

        handleRunSharedQuery(shareId);
    };

    openChangeUrlModal = () => {
        this.handleToggleSidebarMenu("connection");
    };

    handleExternalQuery = query => {
        // Open the console
        this.handleToggleSidebarMenu("");
        this.handleRunQuery(query, "query");
        this.handleSelectQuery(query, "query");
    };

    render() {
        const { mainFrameUrl, overlayUrl } = this.state;
        const {
            handleDiscardFrame,
            handleUpdateConnectedState,
            frames,
            framesTab,
            connection,
            url,
            patchFrame,
            updateFrame,
        } = this.props;

        let mainFrameContent;
        if (mainFrameUrl === "") {
            mainFrameContent = (
                <QueryView
                    collapseAllFrames={this.collapseAllFrames}
                    handleClearQuery={this.handleClearQuery}
                    handleDiscardAllFrames={this.handleDiscardAllFrames}
                    handleDiscardFrame={handleDiscardFrame}
                    handleRunQuery={this.handleRunQuery}
                    handleSelectQuery={this.handleSelectQuery}
                    handleUpdateAction={this.handleUpdateAction}
                    handleUpdateConnectedState={handleUpdateConnectedState}
                    handleUpdateQuery={this.handleUpdateQuery}
                    frames={frames}
                    framesTab={framesTab}
                    patchFrame={patchFrame}
                    updateFrame={updateFrame}
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
        frames: state.frames.items,
        framesTab: state.frames.tab,
        connection: state.connection,
        url: state.url,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        _dispatchRunQuery(query, action) {
            return dispatch(runQuery(query, action));
        },
        _handleDiscardAllFrames() {
            return dispatch(discardAllFrames());
        },
        handleRefreshConnectedState(openChangeUrlModal) {
            dispatch(refreshConnectedState(openChangeUrlModal));
        },
        handleRunSharedQuery(shareId) {
            return dispatch(runQueryByShareId(shareId));
        },
        handleDiscardFrame(frameID) {
            dispatch(discardFrame(frameID));
        },
        handleCollapseFrame(frame) {
            dispatch(toggleCollapseFrame(frame, true));
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
        _handleUpdateAction(action) {
            dispatch(updateAction(action));
        },
        _handleUpdateQueryAndAction(query, action) {
            dispatch(updateQueryAndAction(query, action));
        },
        patchFrame() {
            dispatch(patchFrame(...arguments));
        },
        updateFrame(frame) {
            dispatch(updateFrame(frame));
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
