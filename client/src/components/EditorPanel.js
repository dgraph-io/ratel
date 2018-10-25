import React from "react";
import { connect } from "react-redux";
import classnames from "classnames";

import Editor from "../containers/Editor";

import "../assets/css/EditorPanel.scss";

class EditorPanel extends React.Component {
    renderRadioBtn = (action, title, selectedAction, onUpdateAction) => (
        <button
            className="action actionable"
            onClick={() => onUpdateAction(action)}
        >
            <label className="editor-label">
                <input
                    className="editor-type"
                    type="radio"
                    name="action"
                    value={action}
                    checked={selectedAction === action}
                    onChange={() => onUpdateAction(action)}
                />
                &nbsp;
                {title}
            </label>
        </button>
    );

    render() {
        const {
            canDiscardAll,
            query,
            action,
            onRunQuery,
            onUpdateQuery,
            onClearQuery,
            onDiscardAllFrames,
            onUpdateAction,
            saveCodeMirrorInstance,
        } = this.props;

        const isQueryDirty = query.trim() !== "";

        return (
            <div className="editor-panel">
                <div className="header">
                    <div className="actions">
                        {this.renderRadioBtn(
                            "query",
                            "Query",
                            action,
                            onUpdateAction,
                        )}
                        {this.renderRadioBtn(
                            "mutate",
                            "Mutate",
                            action,
                            onUpdateAction,
                        )}
                    </div>

                    <div className="actions right">
                        <button
                            className={classnames("action clear-btn", {
                                actionable: canDiscardAll,
                            })}
                            onClick={e => {
                                e.preventDefault();

                                if (
                                    window.confirm(
                                        "Are you sure? This will close all frames.",
                                    )
                                ) {
                                    onDiscardAllFrames();
                                }
                            }}
                        >
                            <i className="fa fa-trash" /> Close all
                        </button>
                        <button
                            className={classnames("action", {
                                actionable: isQueryDirty,
                            })}
                            onClick={e => {
                                e.preventDefault();
                                if (query === "") {
                                    return;
                                }
                                onClearQuery();
                            }}
                        >
                            <i className="fa fa-times" /> Clear
                        </button>
                        <button
                            className={classnames("action", {
                                actionable: isQueryDirty,
                            })}
                            onClick={e => {
                                e.preventDefault();
                                if (query === "") {
                                    return;
                                }

                                onRunQuery(query, this.props.action);
                            }}
                        >
                            <i className="fa fa-play" /> Run
                        </button>
                    </div>
                </div>

                <Editor
                    onUpdateQuery={onUpdateQuery}
                    onHotkeyRun={query => onRunQuery(query, this.props.action)}
                    query={query}
                    saveCodeMirrorInstance={saveCodeMirrorInstance}
                    maxHeight="fillParent"
                />
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        query: state.query.query,
        action: state.query.action,
    };
}

export default connect(mapStateToProps)(EditorPanel);
