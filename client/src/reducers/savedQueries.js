/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import produce from 'immer'

import {
  FETCH_SAVED_QUERIES_START,
  FETCH_SAVED_QUERIES_SUCCESS,
  FETCH_SAVED_QUERIES_ERROR,
  CREATE_QUERY_START,
  CREATE_QUERY_SUCCESS,
  CREATE_QUERY_ERROR,
  UPDATE_QUERY_START,
  UPDATE_QUERY_SUCCESS,
  UPDATE_QUERY_ERROR,
  DELETE_QUERY_START,
  DELETE_QUERY_SUCCESS,
  DELETE_QUERY_ERROR,
  OPEN_SAVE_MODAL,
  CLOSE_SAVE_MODAL,
  UPDATE_SAVE_FORM,
} from 'actions/savedQueries'

const defaultState = {
  enabled: false,
  loading: false,
  error: null,
  queries: [],

  // Save modal state
  showSaveModal: false,
  editingQuery: null, // null = new, object = editing existing
  saveForm: {
    name: '',
    description: '',
    category: 'General',
    action: 'query',
    query: '',
  },
  saving: false,
  saveError: null,

  // Delete state
  deleting: null, // ID being deleted
}

export default (state = defaultState, action) =>
  produce(state, (draft) => {
    switch (action.type) {
      // Fetch
      case FETCH_SAVED_QUERIES_START:
        draft.loading = true
        draft.error = null
        break

      case FETCH_SAVED_QUERIES_SUCCESS:
        draft.loading = false
        draft.enabled = action.payload.enabled
        draft.queries = action.payload.queries || []
        break

      case FETCH_SAVED_QUERIES_ERROR:
        draft.loading = false
        draft.error = action.error
        break

      // Create
      case CREATE_QUERY_START:
        draft.saving = true
        draft.saveError = null
        break

      case CREATE_QUERY_SUCCESS:
        draft.saving = false
        draft.queries.push(action.query)
        // Sort by category, then name
        draft.queries.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category)
          }
          return a.name.localeCompare(b.name)
        })
        break

      case CREATE_QUERY_ERROR:
        draft.saving = false
        draft.saveError = action.error
        break

      // Update
      case UPDATE_QUERY_START:
        draft.saving = true
        draft.saveError = null
        break

      case UPDATE_QUERY_SUCCESS:
        draft.saving = false
        const updateIdx = draft.queries.findIndex(
          (q) => q.id === action.query.id,
        )
        if (updateIdx !== -1) {
          draft.queries[updateIdx] = action.query
        }
        // Re-sort
        draft.queries.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category)
          }
          return a.name.localeCompare(b.name)
        })
        break

      case UPDATE_QUERY_ERROR:
        draft.saving = false
        draft.saveError = action.error
        break

      // Delete
      case DELETE_QUERY_START:
        draft.deleting = action.id
        break

      case DELETE_QUERY_SUCCESS:
        draft.deleting = null
        draft.queries = draft.queries.filter((q) => q.id !== action.id)
        break

      case DELETE_QUERY_ERROR:
        draft.deleting = null
        draft.error = action.error
        break

      // Save modal
      case OPEN_SAVE_MODAL:
        draft.showSaveModal = true
        draft.editingQuery = action.editingQuery
        draft.saveForm = action.formData
        draft.saveError = null
        break

      case CLOSE_SAVE_MODAL:
        draft.showSaveModal = false
        draft.editingQuery = null
        draft.saveForm = {
          name: '',
          description: '',
          category: 'General',
          action: 'query',
          query: '',
        }
        draft.saveError = null
        break

      case UPDATE_SAVE_FORM:
        draft.saveForm[action.field] = action.value
        break

      default:
        break
    }
  })
