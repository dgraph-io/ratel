/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { persistCombineReducers } from 'redux-persist'

import backup from './backup'
import cluster from './cluster'
import connection from './connection'
import frames from './frames'
import savedQueries from './savedQueries'
import query from './query'
import ui from './ui'

export default function makeRootReducer(config) {
  return persistCombineReducers(config, {
    backup,
    cluster,
    connection,
    frames,
    savedQueries,
    query,
    ui,
  })
}
