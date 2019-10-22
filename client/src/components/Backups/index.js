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

import "./index.scss";
import AutosizeGrid from "../AutosizeGrid";

export default function BackupsView(props) {
    const alertDiv =
        Math.floor(Date.now() / 1000) % 3 > 0 ? null : (
            <div className="col-sm-12">
                <div className="alert alert-danger" role="alert">
                    "Bad Timing"
                </div>
            </div>
        );

    const renderToolbar = () => {
        return (
            <div className="btn-toolbar" key="buttonsDiv">
                <button className="btn btn-primary btn-sm">
                    Add Predicate
                </button>
                &nbsp;
                <button className="btn btn-primary btn-sm">Add Type</button>
                &nbsp;
                <button className="btn btn-default btn-sm" disabled={true}>
                    {"Refresh List"}
                </button>
            </div>
        );
    };

    const renderBackupsTable = () => {
        const columns = [
            {
                key: "timestamp",
                name: "Timestamp",
                resizable: true,
            },
            {
                key: "dest",
                name: "Destination",
                resizable: true,
            },
        ];
        const rows = [];
        return (
            <AutosizeGrid
                className="backups-table"
                columns={columns}
                rowGetter={idx => idx >= 0 && rows[idx]}
                rowsCount={rows.length}
                rowSelection={{
                    showCheckbox: false,
                    selectBy: {
                        keys: {
                            rowKey: "timestamp",
                            values: ["// TODO"],
                        },
                    },
                }}
            />
        );
    };

    return (
        <div className="backups-view">
            <h2>Backups</h2>

            {renderToolbar()}
            {renderBackupsTable()}
        </div>
    );
}
