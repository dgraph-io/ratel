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
import { useDispatch, useSelector } from "react-redux";
import classnames from "classnames";
import { runQuery } from "actions/frames";
import {
    updateAction,
    updateBestEffort,
    updateReadOnly,
    updateQuery,
} from "actions/query";

import Editor from "containers/Editor";

import "assets/css/EditorPanel.scss";

export default function EditorPanel() {
    const dispatch = useDispatch();
    const { action, query, bestEffort, readOnly } = useSelector(
        state => state.query,
    );

    const setReadOnly = value => dispatch(updateReadOnly(value));
    const setBestEffort = value => updateBestEffort(value);

    const onClearQuery = () => dispatch(updateQuery(""));
    const onUpdateQuery = query => dispatch(updateQuery(query));
    const onUpdateAction = action => dispatch(updateAction(action));

    const onRunQuery = (query, action) => dispatch(runQuery(query, action));

    const renderRadioBtn = (action, title, selectedAction, onUpdateAction) => (
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

    const renderCheckBtn = (title, checked, setter, disabled = false) => {
        const action = e => {
            e.stopPropagation();
            setter(!checked);
        };

        return (
            <button
                className="action actionable"
                onClick={action}
                disabled={disabled}
            >
                <label
                    className={"editor-label" + (disabled ? " text-muted" : "")}
                    onClick={e => e.stopPropagation()}
                >
                    <input
                        className="editor-type"
                        type="checkbox"
                        name="option"
                        checked={checked}
                        disabled={disabled}
                        onChange={action}
                    />
                    &nbsp;
                    {title}
                </label>
            </button>
        );
    };

    const isQueryDirty = query.trim() !== "";

    // Query options only appear if current mode is query
    let queryOptions = null;
    if (action === "query") {
        queryOptions = (
            <div className="actions">
                {renderCheckBtn("Read Only", readOnly, setReadOnly)}
                {renderCheckBtn(
                    "Best Effort",
                    bestEffort,
                    setBestEffort,
                    !readOnly,
                )}
            </div>
        );
    }

    return (
        <div className="editor-panel">
            <div className="header">
                <div className="actions">
                    {renderRadioBtn("query", "Query", action, onUpdateAction)}
                    {renderRadioBtn("mutate", "Mutate", action, onUpdateAction)}
                </div>

                {queryOptions}

                <div className="actions right">
                    <button
                        className={classnames("action", {
                            actionable: isQueryDirty,
                        })}
                        onClick={() => {
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
                        onClick={() => {
                            if (query === "") {
                                return;
                            }

                            onRunQuery(query, action);
                        }}
                    >
                        <i className="fa fa-play" /> Run
                    </button>
                </div>
            </div>

            <Editor
                onUpdateQuery={onUpdateQuery}
                onHotkeyRun={query => onRunQuery(query, action)}
                query={query}
                maxHeight="fillParent"
            />
        </div>
    );
}
