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
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import classnames from "classnames";

import { runQuery } from "actions/frames";
import {
    updateAction,
    updateBestEffort,
    updateReadOnly,
    updateQuery,
    updateQueryVars,
} from "actions/query";

import Editor from "containers/Editor";
import QueryVarsEditor from "components/QueryVarsEditor";

import "assets/css/EditorPanel.scss";

export default function EditorPanel() {
    const dispatch = useDispatch();
    const { action, query, queryVars, bestEffort, readOnly } = useSelector(
        state => state.query,
    );

    const setReadOnly = value => dispatch(updateReadOnly(value));
    const setBestEffort = value => dispatch(updateBestEffort(value));

    const onClearQuery = () => {
        dispatch(updateQuery(""));
        dispatch(updateQueryVars([]));
    };
    const onUpdateQuery = query => dispatch(updateQuery(query));
    const onUpdateAction = action => dispatch(updateAction(action));

    const onRunCurrentQuery = () =>
        dispatch(
            runQuery(query, action, {
                bestEffort,
                readOnly,
                queryVars: action === "query" ? queryVars : undefined,
            }),
        );

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

    const isQueryDirty = query.trim() !== "";
    const hasQueryVars = action === "query" && queryVars?.length;

    // Query options only appear if current mode is query
    const queryOptions = action === "query" && (
        <DropdownButton
            id="query-sliders-dropdown"
            className="action actionable"
            title={<i className="fas fa-sliders-h" />}
        >
            <Dropdown.Item onClick={() => setReadOnly(!readOnly)}>
                <input type="checkbox" checked={readOnly} /> Read Only
            </Dropdown.Item>
            <Dropdown.Item
                onClick={() => setBestEffort(!bestEffort)}
                disabled={!readOnly}
            >
                <input type="checkbox" checked={bestEffort} /> Best Effort
            </Dropdown.Item>
        </DropdownButton>
    );

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
                            actionable: isQueryDirty || hasQueryVars,
                        })}
                        onClick={() => onClearQuery()}
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

                            onRunCurrentQuery();
                        }}
                    >
                        <i className="fa fa-play" /> Run
                    </button>
                </div>
            </div>

            <Editor
                onUpdateQuery={onUpdateQuery}
                onHotkeyRun={onRunCurrentQuery}
                query={query}
                maxHeight="fillParent"
            />
            {action === "query" && <QueryVarsEditor />}
        </div>
    );
}
