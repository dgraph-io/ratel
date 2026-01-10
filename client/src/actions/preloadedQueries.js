/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { runQuery } from 'actions/frames'

export const FETCH_PRELOADED_QUERIES_START = 'preloadedQueries/FETCH_START'
export const FETCH_PRELOADED_QUERIES_SUCCESS = 'preloadedQueries/FETCH_SUCCESS'
export const FETCH_PRELOADED_QUERIES_ERROR = 'preloadedQueries/FETCH_ERROR'
export const SELECT_PRELOADED_QUERY = 'preloadedQueries/SELECT'
export const CLOSE_VARIABLE_MODAL = 'preloadedQueries/CLOSE_MODAL'
export const UPDATE_VARIABLE_VALUE = 'preloadedQueries/UPDATE_VARIABLE'

export function fetchPreloadedQueries() {
  return async (dispatch) => {
    dispatch({ type: FETCH_PRELOADED_QUERIES_START })

    try {
      const response = await fetch('/api/preloaded-queries')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()

      dispatch({
        type: FETCH_PRELOADED_QUERIES_SUCCESS,
        payload: data,
      })
    } catch (error) {
      dispatch({
        type: FETCH_PRELOADED_QUERIES_ERROR,
        error: error.message,
      })
    }
  }
}

export function selectPreloadedQuery(query) {
  return (dispatch) => {
    if (!query.variables || query.variables.length === 0) {
      // No variables - run directly
      dispatch(runQuery(query.query, query.action))
    } else {
      // Has variables - show modal
      dispatch({
        type: SELECT_PRELOADED_QUERY,
        query,
      })
    }
  }
}

export function closeVariableModal() {
  return {
    type: CLOSE_VARIABLE_MODAL,
  }
}

export function updateVariableValue(variableName, value) {
  return {
    type: UPDATE_VARIABLE_VALUE,
    variableName,
    value,
  }
}

function substituteVariables(query, variables, values) {
  let result = query
  const vars = Array.isArray(variables) ? variables : []
  vars.forEach((v) => {
    const token = `{{${v.name}}}`
    // Use split/join to avoid regex metacharacter issues and $ replacement issues
    const hasValue = Object.prototype.hasOwnProperty.call(values, v.name)
    const replacement = hasValue ? String(values[v.name] ?? '') : ''
    result = result.split(token).join(replacement)
  })
  return result
}

export function runPreloadedQuery() {
  return (dispatch, getState) => {
    const { selectedQuery, variableValues } = getState().preloadedQueries

    if (!selectedQuery) {
      return
    }

    const finalQuery = substituteVariables(
      selectedQuery.query,
      selectedQuery.variables,
      variableValues,
    )

    dispatch(runQuery(finalQuery, selectedQuery.action))
    dispatch(closeVariableModal())
  }
}
