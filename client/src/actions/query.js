/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

export const UPDATE_QUERY = 'query/UPDATE_QUERY'
export const UPDATE_ACTION = 'query/UPDATE_ACTION'
export const UPDATE_QUERY_AND_ACTION = 'query/UPDATE_QUERY_AND_ACTION'
export const UPDATE_QUERY_VARS = 'query/UPDATE_QUERY_VARS'
export const UPDATE_READ_ONLY = 'query/UPDATE_READ_ONLY'
export const UPDATE_BEST_EFFORT = 'query/UPDATE_BEST_EFFORT'

export function updateQuery(query) {
  return {
    type: UPDATE_QUERY,
    query,
  }
}

export function updateAction(action) {
  return {
    type: UPDATE_ACTION,
    action,
  }
}

export function updateQueryAndAction(query, action) {
  return {
    type: UPDATE_QUERY_AND_ACTION,
    query,
    action,
  }
}

export function updateReadOnly(readOnly) {
  return {
    type: UPDATE_READ_ONLY,
    readOnly,
  }
}

export function updateBestEffort(bestEffort) {
  return {
    type: UPDATE_BEST_EFFORT,
    bestEffort,
  }
}

export const updateQueryVars = (newVars) => ({
  type: UPDATE_QUERY_VARS,
  newVars,
})
