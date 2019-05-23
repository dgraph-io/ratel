// Copyright 2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

export const ADD_BACKUP = "backups/ADD";

export function addBackup(backup) {
    return {
        type: ADD_BACKUP,
        backup,
    };
}
