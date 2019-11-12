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

import { updateAction, updateQuery } from "actions/query";
import { discardFrame } from "actions/frames";

import VerticalPanelLayout from "../PanelLayout/VerticalPanelLayout";
import EditorPanel from "../EditorPanel";
import FrameList from "../FrameList";
import FrameItem from "../FrameItem";
import { TAB_JSON } from "actions/frames";

import "./QueryView.scss";

export default function QueryView({
    handleRunQuery,
    onSelectQuery,
    onSetQuery,
}) {
    const {
        activeFrameId,
        tab: activeTab,
        frameResults,
        items: frames,
    } = useSelector(store => store.frames);

    const dispatch = useDispatch();

    const frame = frames.find(f => f.id === activeFrameId) || frames[0] || {};
    const tabName = frame.action === "mutate" ? TAB_JSON : activeTab;
    const tabResult =
        frame && frameResults[frame.id] && frameResults[frame.id][tabName];

    return (
        <div className="query-view">
            <h2>Console</h2>
            <VerticalPanelLayout
                first={
                    <div className="query-view-left-scrollable">
                        <EditorPanel
                            onClearQuery={() => dispatch(updateQuery(""))}
                            onRunQuery={handleRunQuery}
                            onUpdateQuery={query =>
                                dispatch(updateQuery(query))
                            }
                            onUpdateAction={action =>
                                dispatch(updateAction(action))
                            }
                        />

                        <span className="badge badge-secondary history-label">
                            <i
                                className="fas fa-chevron-down"
                                style={{ fontSize: "0.75em" }}
                            />{" "}
                            History{" "}
                            <i
                                className="fas fa-chevron-down"
                                style={{ fontSize: "0.75em" }}
                            />
                        </span>
                        <FrameList
                            activeFrameId={activeFrameId}
                            frames={frames}
                            onDiscardFrame={frameId =>
                                dispatch(discardFrame(frameId))
                            }
                            onSelectQuery={onSelectQuery}
                        />
                    </div>
                }
                second={
                    frames.length ? (
                        <FrameItem
                            activeFrameId={activeFrameId}
                            key={activeFrameId}
                            frame={frame}
                            tabResult={tabResult || {}}
                            tabName={tabName}
                            collapsed={false}
                            onDiscardFrame={frameId =>
                                dispatch(discardFrame(frameId))
                            }
                            onDeleteNode={({ uid }) => {
                                // TODO: this is a simple hack for formatting -- could also use beautify or something like that
                                const query = `{\n\tdelete {\n\t\t<${uid}> * * .\n\t}\n}`;
                                onSetQuery(query, "mutate");
                            }}
                            onSelectQuery={onSelectQuery}
                        />
                    ) : (
                        <div className="alert alert-secondary" role="alert">
                            Please run a query or a mutation
                        </div>
                    )
                }
            />
        </div>
    );
}
