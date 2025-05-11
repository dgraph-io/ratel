/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  UPDATE_ACTION,
  UPDATE_BEST_EFFORT,
  UPDATE_QUERY,
  UPDATE_QUERY_AND_ACTION,
  UPDATE_QUERY_VARS,
  UPDATE_READ_ONLY,
} from 'actions/query'
import produce from 'immer'

const defaultState = {
  query: '',
  queryVars: [],
  allQueries: { query: '', mutate: '', alter: '' },
  action: 'query',
  readOnly: false,
  bestEffort: false,
}

export default (state = defaultState, action) =>
  produce(state, (draft) => {
    draft.allQueries = draft.allQueries || {}
    draft.action = draft.action || 'query'
    draft.allQueries[draft.action] = draft.query || ''

    switch (action.type) {
      case UPDATE_QUERY:
        draft.query = action.query
        break

      case UPDATE_ACTION:
        draft.action = action.action
        draft.query = draft.allQueries[draft.action]
        break

      case UPDATE_QUERY_AND_ACTION:
        draft.action = action.action
        draft.query = action.query
        break

      case UPDATE_READ_ONLY:
        draft.readOnly = action.readOnly
        draft.bestEffort = action.readOnly
        break

      case UPDATE_BEST_EFFORT:
        draft.bestEffort = action.bestEffort
        break

      case UPDATE_QUERY_VARS:
        draft.queryVars = action.newVars
        break

      default:
        break
    }

    draft.allQueries[draft.action] = draft.query
  })
