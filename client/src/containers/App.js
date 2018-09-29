import React from "react";
import { connect } from "react-redux";
import URLSearchParams from "url-search-params";

import PanelLayout from "../components/PanelLayout";
import Schema from "../components/Schema";
import Sidebar from "../components/Sidebar";
import SidebarInfo from "../components/SidebarInfo";
import SidebarFeedback from "../components/SidebarFeedback";
import EditorPanel from "../components/EditorPanel";
import FrameList from "../components/FrameList";
import UpdateUrlModal from "../components/UpdateUrlModal";

import { createCookie, readCookie, eraseCookie } from "../lib/helpers";
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

        this.modal = React.createRef();
        this.panelLayout = React.createRef();

        this.state = {
            // IDEA: Make this state a part of <Sidebar /> to avoid rerendering whole <App />.
            overlayUrl: null,
            mainFrameUrl: "",
            // queryExecutionCounter is used to determine when the NPS score survey
            // should be shown.
            queryExecutionCounter: 0,
        };
    }

    async componentDidMount() {
        const {
            handleRunQuery,
            handleRefreshConnectedState,
            location,
        } = this.props;

        handleRefreshConnectedState(this.openChangeUrlModal);

        const queryParams = new URLSearchParams(location.search);
        const shareId = queryParams && queryParams.get("shareId");
        if (shareId) {
            this.onRunSharedQuery(shareId);
        }

        // If playQuery cookie is set, run the query and erase the cookie.
        // The cookie is used to communicate the query string between docs and play.
        const playQuery = readCookie("playQuery");
        if (playQuery) {
            const queryString = decodeURI(playQuery);
            await handleRunQuery(queryString);
            eraseCookie("playQuery", { crossDomain: true });
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
    };

    isMainFrameUrl = sidebarMenu => ["", "schema"].indexOf(sidebarMenu) >= 0;

    getOverlayContent = overlayUrl => {
        if (overlayUrl === "info") {
            return <SidebarInfo />;
        }
        if (overlayUrl === "feedback") {
            return <SidebarFeedback />;
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

    handleUpdateAction = event => {
        const { _handleUpdateAction } = this.props;

        _handleUpdateAction(event.target.value);
    };

    // focusCodemirror sets focus on codemirror and moves the cursor to the end.
    focusCodemirror = () => {
        const cm = this._codemirror;
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
        const { _handleRunQuery } = this.props;

        // First, collapse all frames in order to prevent slow rendering.
        // FIXME: This won't be necessary if visualization took up less resources.
        // TODO: Compare benchmarks between d3.js and vis.js and make migration if needed.
        this.collapseAllFrames();
        this.panelLayout.current.scrollSecondToTop();

        _handleRunQuery(query, action, () => {
            const { queryExecutionCounter } = this.state;

            if (queryExecutionCounter === 7) {
                if (!readCookie("nps-survery-done")) {
                    try {
                        /* global delighted */
                        delighted.survey();
                        createCookie("nps-survery-done", true, 180);
                    } catch (error) {
                        console.log("Failed to call delighted.js", error);
                    }
                }
            } else if (queryExecutionCounter < 7) {
                this.setState({
                    queryExecutionCounter: queryExecutionCounter + 1,
                });
            }
        });
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
        this.modal.current.open(this.props.url);
    };

    render() {
        const { mainFrameUrl, overlayUrl } = this.state;
        const {
            handleRefreshConnectedState,
            handleDiscardFrame,
            handleUpdateConnectedState,
            handleUpdateShouldPrompt,
            frames,
            framesTab,
            connection,
            url,
            updateFrame,
        } = this.props;

        const canDiscardAll = frames.length > 0;

        let mainFrameContent;
        if (mainFrameUrl === "") {
            mainFrameContent = (
                <PanelLayout
                    ref={this.panelLayout}
                    first={
                        <EditorPanel
                            canDiscardAll={canDiscardAll}
                            onDiscardAllFrames={this.handleDiscardAllFrames}
                            onRunQuery={this.handleRunQuery}
                            onClearQuery={this.handleClearQuery}
                            saveCodeMirrorInstance={this.saveCodeMirrorInstance}
                            connection={connection}
                            url={url}
                            onUpdateQuery={this.handleUpdateQuery}
                            onUpdateAction={this.handleUpdateAction}
                            onUpdateConnectedState={handleUpdateConnectedState}
                            onRefreshConnectedState={
                                handleRefreshConnectedState
                            }
                            openChangeUrlModal={this.openChangeUrlModal}
                        />
                    }
                    second={
                        <FrameList
                            frames={frames}
                            framesTab={framesTab}
                            onDiscardFrame={handleDiscardFrame}
                            onSelectQuery={this.handleSelectQuery}
                            onUpdateConnectedState={handleUpdateConnectedState}
                            collapseAllFrames={this.collapseAllFrames}
                            updateFrame={updateFrame}
                            url={url}
                        />
                    }
                />
            );
        } else if (mainFrameUrl === "schema") {
            mainFrameContent = (
                <div className="row justify-content-md-center">
                    <div className="col-sm-12">
                        <Schema
                            url={url}
                            onUpdateConnectedState={handleUpdateConnectedState}
                        />
                    </div>
                </div>
            );
        }

        return (
            <div className="app-layout">
                <Sidebar
                    currentMenu={overlayUrl || mainFrameUrl}
                    currentOverlay={this.getOverlayContent(overlayUrl)}
                    onToggleMenu={this.handleToggleSidebarMenu}
                />
                <div className="main-content">
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
                </div>
                <UpdateUrlModal
                    ref={this.modal}
                    onSubmit={this.handeUpdateUrlAndRefresh}
                    onCancel={handleUpdateShouldPrompt}
                />
            </div>
        );
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
        _handleRunQuery(query, action, done = () => {}) {
            dispatch(runQuery(query, action));

            // FIXME: This callback is a remnant from previous implementation in which
            // `runQuery` returned a thunk. Remove if no longer relevant.
            done();
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
