// Copyright 2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

import { ADD_BACKUP } from "../actions/backups";

const defaultState = {
    backups: [],
};

export default function backup(state = defaultState, action) {
    switch (action.type) {
        case ADD_BACKUP:
            const backups = [action.backup, ...state.backups];
            return {
                ...state,
                backups: backups,
            };
        default:
            return state;
    }
}
