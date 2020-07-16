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

import produce from "immer";
import {
    DEFAULT_BACKUP_CONFIG,
    SAVE_BACKUP_ERROR,
    SAVE_BACKUP_RESULT,
    SAVE_START_BACKUP,
    SET_BACKUP_CONFIG,
} from "../actions/backup";

const defaultState = {
    config: DEFAULT_BACKUP_CONFIG,
    backups: [],
};

export default (state = defaultState, action) =>
    produce(state, draft => {
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
                draft.backups.find(
                    b => b.backupId === backupId,
                ).result = result;
                break;
            }

            default:
                return;
        }
    });
