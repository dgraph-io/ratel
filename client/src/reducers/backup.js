/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { produce } from "immer"
import {
    DEFAULT_BACKUP_CONFIG,
    SAVE_BACKUP_ERROR,
    SAVE_BACKUP_RESULT,
    SAVE_START_BACKUP,
    SET_BACKUP_CONFIG,
} from "actions/backup";

const defaultState = {
    config: DEFAULT_BACKUP_CONFIG,
    backups: [],
};

export default (state = defaultState, action) =>
    produce(state, (draft) => {
        switch (action.type) {
            case SET_BACKUP_CONFIG:
                Object.assign(draft.config, action.payload);
                break;

            case SAVE_START_BACKUP:
                const { backupId, config, serverUrl, startTime } = action;
                draft.backups.push({ backupId, config, startTime, serverUrl });
                break;

            case SAVE_BACKUP_ERROR: {
                const { backupId, err } = action;
                draft.backups.find(b => b.backupId === backupId).error = err;
                break;
            }

            case SAVE_BACKUP_RESULT: {
                const { backupId, result } = action;
                draft.backups.find(b => b.backupId === backupId).result =
                    result;
                break;
            }

            default:
                return;
        }
    });
