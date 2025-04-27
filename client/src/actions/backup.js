/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { callStartBackup } from "components/Backups/backupModel";

export const SET_BACKUP_CONFIG = "frames/SET_BACKUP_CONFIG";
export const SAVE_START_BACKUP = "frames/SAVE_START_BACKUP ";
export const SAVE_BACKUP_RESULT = "frames/SAVE_BACKUP_RESULT";
export const SAVE_BACKUP_ERROR = "frames/SAVE_BACKUP_ERROR";

export const DEFAULT_BACKUP_CONFIG = {
    backupPath: "",
    destinationType: "nfs",
    forceFull: false,
    overrideCredentials: false,
    anonymous: false,
};

export function setBackupConfig(payload) {
    return {
        type: SET_BACKUP_CONFIG,
        payload,
    };
}

export const setBackupResult = (backupId, result) => ({
    type: SAVE_BACKUP_RESULT,
    backupId,
    result,
});

export const setBackupError = (backupId, err) => ({
    type: SAVE_BACKUP_ERROR,
    backupId,
    err,
});

export const startBackup = (serverUrl, config) => async dispatch => {
    const backupId = `${serverUrl} _ ${Date.now()}`;
    dispatch({
        type: SAVE_START_BACKUP,
        backupId,
        config,
        serverUrl,
        startTime: Date.now(),
    });
    try {
        const res = await callStartBackup(config);
        dispatch(setBackupResult(backupId, res));
    } catch (err) {
        dispatch(setBackupError(backupId, err));
    }
};
