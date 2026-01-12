/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import { runQuery } from 'actions/frames'
import { updateAction, updateQuery } from 'actions/query'

// Fetch actions
export const FETCH_SAVED_QUERIES_START = 'savedQueries/FETCH_START'
export const FETCH_SAVED_QUERIES_SUCCESS = 'savedQueries/FETCH_SUCCESS'
export const FETCH_SAVED_QUERIES_ERROR = 'savedQueries/FETCH_ERROR'

// CRUD actions
export const CREATE_QUERY_START = 'savedQueries/CREATE_START'
export const CREATE_QUERY_SUCCESS = 'savedQueries/CREATE_SUCCESS'
export const CREATE_QUERY_ERROR = 'savedQueries/CREATE_ERROR'

export const UPDATE_QUERY_START = 'savedQueries/UPDATE_START'
export const UPDATE_QUERY_SUCCESS = 'savedQueries/UPDATE_SUCCESS'
export const UPDATE_QUERY_ERROR = 'savedQueries/UPDATE_ERROR'

export const DELETE_QUERY_START = 'savedQueries/DELETE_START'
export const DELETE_QUERY_SUCCESS = 'savedQueries/DELETE_SUCCESS'
export const DELETE_QUERY_ERROR = 'savedQueries/DELETE_ERROR'

// UI actions
export const OPEN_SAVE_MODAL = 'savedQueries/OPEN_SAVE_MODAL'
export const CLOSE_SAVE_MODAL = 'savedQueries/CLOSE_SAVE_MODAL'
export const UPDATE_SAVE_FORM = 'savedQueries/UPDATE_SAVE_FORM'

// Fetch all saved queries
export function fetchSavedQueries() {
  return async (dispatch) => {
    dispatch({ type: FETCH_SAVED_QUERIES_START })

    try {
      const response = await fetch('/api/saved-queries')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()

      dispatch({
        type: FETCH_SAVED_QUERIES_SUCCESS,
        payload: data,
      })
    } catch (error) {
      dispatch({
        type: FETCH_SAVED_QUERIES_ERROR,
        error: error.message,
      })
    }
  }
}

// Create a new saved query
export function createSavedQuery(queryData) {
  return async (dispatch) => {
    dispatch({ type: CREATE_QUERY_START })

    try {
      const response = await fetch('/api/saved-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      const query = await response.json()

      dispatch({
        type: CREATE_QUERY_SUCCESS,
        query,
      })

      dispatch({ type: CLOSE_SAVE_MODAL })

      return query
    } catch (error) {
      dispatch({
        type: CREATE_QUERY_ERROR,
        error: error.message,
      })
      throw error
    }
  }
}

// Update an existing saved query
export function updateSavedQuery(id, queryData) {
  return async (dispatch) => {
    dispatch({ type: UPDATE_QUERY_START })

    try {
      const response = await fetch(`/api/saved-queries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      const query = await response.json()

      dispatch({
        type: UPDATE_QUERY_SUCCESS,
        query,
      })

      dispatch({ type: CLOSE_SAVE_MODAL })

      return query
    } catch (error) {
      dispatch({
        type: UPDATE_QUERY_ERROR,
        error: error.message,
      })
      throw error
    }
  }
}

// Delete a saved query
export function deleteSavedQuery(id) {
  return async (dispatch) => {
    dispatch({ type: DELETE_QUERY_START, id })

    try {
      const response = await fetch(`/api/saved-queries/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok && response.status !== 204) {
        const data = await response.json()
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      dispatch({
        type: DELETE_QUERY_SUCCESS,
        id,
      })
    } catch (error) {
      dispatch({
        type: DELETE_QUERY_ERROR,
        error: error.message,
      })
      throw error
    }
  }
}

// Select and run a saved query
export function selectSavedQuery(query) {
  return (dispatch) => {
    // Load query into editor
    dispatch(updateQuery(query.query))
    dispatch(updateAction(query.action))
    // Execute it
    dispatch(runQuery(query.query, query.action))
  }
}

// Load query into editor without running (for editing)
export function loadQueryToEditor(query) {
  return (dispatch) => {
    dispatch(updateQuery(query.query))
    dispatch(updateAction(query.action))
  }
}

// Open save modal (for new query or editing existing)
export function openSaveModal(editingQuery = null) {
  return (dispatch, getState) => {
    const { query } = getState()

    dispatch({
      type: OPEN_SAVE_MODAL,
      editingQuery,
      // Pre-fill form with current editor content if new, or existing query data if editing
      formData: editingQuery
        ? {
            name: editingQuery.name,
            description: editingQuery.description || '',
            category: editingQuery.category || 'General',
            action: editingQuery.action || 'query',
            query: editingQuery.query,
          }
        : {
            name: '',
            description: '',
            category: 'General',
            action: query.action || 'query',
            query: query.query || '',
          },
    })
  }
}

// Close save modal
export function closeSaveModal() {
  return { type: CLOSE_SAVE_MODAL }
}

// Update form field in save modal
export function updateSaveForm(field, value) {
  return {
    type: UPDATE_SAVE_FORM,
    field,
    value,
  }
}

// Save current query (create or update)
export function saveCurrentQuery() {
  return (dispatch, getState) => {
    const { savedQueries } = getState()
    const { editingQuery, saveForm } = savedQueries

    if (editingQuery) {
      return dispatch(updateSavedQuery(editingQuery.id, saveForm))
    } else {
      return dispatch(createSavedQuery(saveForm))
    }
  }
}
