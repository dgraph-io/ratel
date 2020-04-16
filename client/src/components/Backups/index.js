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
import { useDispatch, useSelector } from "react-redux";

import "./index.scss";
import { saveBackupStart, setBackupConfig } from "actions/backup";
import AutosizeGrid from "../AutosizeGrid";
import ConfirmBackupModal from "./ConfirmBackupModal";
import StartBackupModal from "./StartBackupModal";

import { getBackupPayload, startBackup } from "./backupModel.js";
import { DEFAULT_BACKUP_CONFIG } from "actions/backup";

export default function BackupsView(props) {
    const [backupModal, setBackupModal] = useState(false);
    const [confirmModal, setConfirmModal] = useState(false);

    const dgraphUrl = useSelector(state => state.url.url);

    const backupConfig =
        useSelector(state => state.backup && state.backup.config) ||
        DEFAULT_BACKUP_CONFIG;

    const backupsList =
        useSelector(state => state.backup && state.backup.backups) || [];
    const dispatch = useDispatch();

    async function onStartBackup(backupConfig) {
        dispatch(saveBackupStart(dgraphUrl, backupConfig));
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
                key: "startTime",
                name: "Start Time",
                resizable: true,
                formatter: ({ value }) => new Date(value).toLocaleString(),
            },
            {
                key: "dest",
                name: "Destination",
                resizable: true,
            },
            {
                key: "flags",
                name: "Settings",
                resizable: true,
            },
        ];

        const data = backupsList
            .filter(({ serverUrl }) => serverUrl === dgraphUrl)
            .map(({ config, startTime }) => ({
                startTime,
                dest: getBackupPayload(config),
                flags: [
                    `${config.forceFull ? "full" : ""}`,
                    `${
                        config.overrideCredentials &&
                        config.destinationType !== "nfs"
                            ? "with credentials"
                            : ""
                    }`,
                    `${
                        config.overrideCredentials &&
                        config.destinationType !== "nfs" &&
                        config.anonymous
                            ? "public bucket"
                            : ""
                    }`,
                ]
                    .filter(val => !!val)
                    .join(", "),
            }));

        return (
            <AutosizeGrid
                className="backups-table"
                columns={columns}
                rowGetter={idx => idx >= 0 && data[idx]}
                rowsCount={data.length}
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
                        setBackupModal(false);
                        setConfirmModal(true);
                    }}
                />
            )}
            {confirmModal && (
                <ConfirmBackupModal
                    backupConfig={backupConfig}
                    dgraphUrl={dgraphUrl}
                    onCancel={() => setConfirmModal(false)}
                    onStartBackup={() => {
                        onStartBackup(backupConfig);
                        setBackupModal(false);
                        setConfirmModal(false);
                    }}
                />
            )}
        </div>
    );
}
