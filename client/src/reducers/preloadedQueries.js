/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import produce from 'immer'

import {
  FETCH_PRELOADED_QUERIES_START,
  FETCH_PRELOADED_QUERIES_SUCCESS,
  FETCH_PRELOADED_QUERIES_ERROR,
  SELECT_PRELOADED_QUERY,
  CLOSE_VARIABLE_MODAL,
  UPDATE_VARIABLE_VALUE,
} from 'actions/preloadedQueries'

const defaultState = {
  enabled: false,
  loading: false,
  error: null,
  queries: [],
  selectedQuery: null,
  showVariableModal: false,
  variableValues: {},
}

export default (state = defaultState, action) =>
  produce(state, (draft) => {
    switch (action.type) {
      case FETCH_PRELOADED_QUERIES_START:
        draft.loading = true
        draft.error = null
        break

      case FETCH_PRELOADED_QUERIES_SUCCESS:
        draft.loading = false
        draft.enabled = action.payload.enabled
        draft.queries = action.payload.queries || []
        break

      case FETCH_PRELOADED_QUERIES_ERROR:
        draft.loading = false
        draft.error = action.error
        break

      case SELECT_PRELOADED_QUERY:
        draft.selectedQuery = action.query
        draft.showVariableModal = true
        // Initialize variable values with defaults
        draft.variableValues = {}
        if (action.query?.variables) {
          action.query.variables.forEach((v) => {
            draft.variableValues[v.name] = v.default || ''
          })
        }
        break

      case CLOSE_VARIABLE_MODAL:
        draft.showVariableModal = false
        draft.selectedQuery = null
        draft.variableValues = {}
        break

      case UPDATE_VARIABLE_VALUE:
        draft.variableValues[action.variableName] = action.value
        break

      default:
        break
    }
  })
