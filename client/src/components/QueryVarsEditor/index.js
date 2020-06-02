// Copyright 2020 Dgraph Labs, Inc. and Contributors
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

import { updateQueryVars } from "actions/query";
import "./index.scss";

export default function QueryVarsEditor() {
    const { queryVars } = useSelector(state => state.query);
    const dispatch = useDispatch();

    const deleteVar = indx =>
        dispatch(
            updateQueryVars([
                ...queryVars.slice(0, indx),
                ...queryVars.slice(indx + 1, queryVars.length),
            ]),
        );

    const spawnVar = val =>
        dispatch(updateQueryVars([[true, val], ...queryVars]));

    const editVar = (indx, newValue) =>
        dispatch(
            updateQueryVars([
                ...queryVars.slice(0, indx),
                [queryVars[indx][0], newValue],
                ...queryVars.slice(indx + 1, queryVars.length),
            ]),
        );

    const setChecked = (indx, isChecked) =>
        dispatch(
            updateQueryVars([
                ...queryVars.slice(0, indx),
                [isChecked, queryVars[indx][1]],
                ...queryVars.slice(indx + 1, queryVars.length),
            ]),
        );

    const dropAllVars = () => dispatch(updateQueryVars([]));

    const summary = () => {
        if (!queryVars.length) {
            return "";
        }
        const checked = queryVars.filter(q => q[0]).length;
        return `   ${checked} / ${queryVars.length}`;
    };

    return (
        <div className="query-vars-editor">
            <button
                className="add-btn"
                title="Add Query Variable"
                onClick={() => spawnVar(`var: ${queryVars.length + 1}`)}
            >
                <i className="fas fa-plus-circle" /> Variable
            </button>
            <span className="count">{summary()}</span>

            {queryVars.length > 1 && (
                <button
                    className="drop-all-btn"
                    title="Remove All Variables"
                    onClick={dropAllVars}
                >
                    <i className="fas fa-trash-alt" /> remove all
                </button>
            )}
            <div className="vars">
                {queryVars.map(([checked, val], i) => (
                    <div className="var" key={i}>
                        <div className="controls">
                            <button
                                className="delete"
                                onClick={() => deleteVar(i)}
                            >
                                <i className="fas fa-trash-alt" />
                            </button>
                            <input
                                type="checkbox"
                                className="checkbox-send"
                                checked={checked}
                                onChange={() => setChecked(i, !checked)}
                            />
                        </div>
                        <div className="content">
                            <input
                                className="edit-var"
                                type="text"
                                value={val}
                                onChange={e => editVar(i, e.target.value)}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
