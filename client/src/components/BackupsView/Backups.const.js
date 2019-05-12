// Copyright 2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

export const STATE_LOADING = 0;
export const STATE_SUCCESS = 1;
export const STATE_ERROR = 2;

export const MESSAGE_TYPE = { INFO: "info", ERROR: "error" };
export const MESSAGES = {
    BACKUP_IN_PROGRESS: "Backup in progress",
    BACKUP_ERROR: "Backup failed. Please try again",
    BACKUP_SUCCESS: "Backup was successful",
    RESTORE_IN_PROGRESS: "Restore in Progress",
    RESTORE_ERROR: "Restore failed. Please try again",
    RESTORE_SUCCESS: "Restore was successful",
    DELETE_IN_PROGRESS: "Deleting backup",
    DELETE_ERROR: "Delete failed. Please try again",
    DELETE_SUCCESS: "Delete was successful",
    BACKUP_LIST_EMPTY: "No backup available",
    BACKUP_DETAIL_SELECT: "Please select a backup from the list on the left",
    BACKUP_DETAIL_EMPTY: "No backup to select",
};
