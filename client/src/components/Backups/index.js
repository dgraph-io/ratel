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

import React, { useState } from "react";
import { useSelector } from "react-redux";

import "./index.scss";
import AutosizeGrid from "../AutosizeGrid";
import StartBackupModal from "./StartBackupModal";

import { startBackup } from "lib/helpers";

export default function BackupsView(props) {
    const [backupModal, setBackupModal] = useState(true);
    const [backupConfig, setBackupConfig] = useState({
        destinationType: "nfs",
        backupPath: "",
    });

    const dgraphUrl = useSelector(state => state.url.url);

    async function onStartBackup(backupConfig) {
        console.log(await startBackup(dgraphUrl, backupConfig));
    }

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
                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setBackupModal(true)}
                >
                    Create Backup
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
            {backupModal && (
                <StartBackupModal
                    backupConfig={backupConfig}
                    dgraphUrl={dgraphUrl}
                    onCancel={() => setBackupModal(false)}
                    onStartBackup={() => {
                        onStartBackup(backupConfig);
                        setBackupModal(false);
                    }}
                    setBackupConfig={setBackupConfig}
                />
            )}
        </div>
    );
}
