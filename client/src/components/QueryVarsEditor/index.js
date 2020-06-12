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
import { extractVars } from "lib/parsers/queryVars";
import "./index.scss";

const findNewVars = (userVars, detectedVars) => {
    const user = new Set(userVars.map(x => x[1].split(":")?.[0]));
    return detectedVars.filter(x => !user.has(x[0]));
};

function sampleFor(typeName) {
    const sampleDict = {
        bool: "true",
        datetime: "2020-06-11T19:59:05",
        float: "36.6",
        int: "1023",
        string: "some text",
    };
    return sampleDict[typeName.toLowerCase()] || "100";
}

export default function QueryVarsEditor() {
    const { queryVars, query } = useSelector(state => state.query);
    const dispatch = useDispatch();

    const vars = extractVars(query);
    const newVars = findNewVars(queryVars, vars);

    const deleteVar = indx =>
        dispatch(
            updateQueryVars([
                ...queryVars.slice(0, indx),
                ...queryVars.slice(indx + 1, queryVars.length),
            ]),
        );

    const spawnVar = val =>
        dispatch(updateQueryVars([[true, val], ...queryVars]));

    const smartSpawnVars = () =>
        dispatch(
            updateQueryVars([
                ...newVars.map(x => [true, `${x[0]}: ${sampleFor(x[1])}`]),
                ...queryVars,
            ]),
        );

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
                className="btn"
                title="Add Query Variable"
                onClick={() => {
                    if (newVars.length) {
                        smartSpawnVars();
                    } else {
                        spawnVar(`var: ${queryVars.length + 1}`);
                    }
                }}
            >
                {newVars.length ? (
                    <span className="text-primary">
                        <i className="fas fa-lightbulb" /> Add {newVars.length}{" "}
                        {newVars.length === 1 ? "variable" : "variables"}
                    </span>
                ) : (
                    <>
                        <i className="fas fa-plus-circle" /> Variable
                    </>
                )}
            </button>
            <span className="count">{summary()}</span>

            {queryVars.length > 0 && (
                <button
                    className="btn btn-drop-all"
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
