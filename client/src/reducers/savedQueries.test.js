/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import reducer from './savedQueries'
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

describe('savedQueries reducer', () => {
  const initialState = {
    enabled: false,
    loading: false,
    error: null,
    queries: [],
    showSaveModal: false,
    editingQuery: null,
    saveForm: {
      name: '',
      description: '',
      category: 'General',
      action: 'query',
      query: '',
    },
    saving: false,
    saveError: null,
    deleting: null,
  }

  it('should return the initial state', () => {
    expect(reducer(undefined, {})).toEqual(initialState)
  })

  describe('fetch queries', () => {
    it('should handle FETCH_SAVED_QUERIES_START', () => {
      const action = { type: FETCH_SAVED_QUERIES_START }
      const state = reducer(initialState, action)
      expect(state.loading).toBe(true)
      expect(state.error).toBe(null)
    })

    it('should handle FETCH_SAVED_QUERIES_SUCCESS', () => {
      const queries = [
        { id: 1, name: 'Query 1', category: 'Test', action: 'query', query: '{ q1 }' },
        { id: 2, name: 'Query 2', category: 'Test', action: 'mutate', query: '{ q2 }' },
      ]
      const action = {
        type: FETCH_SAVED_QUERIES_SUCCESS,
        payload: { enabled: true, queries },
      }
      const state = reducer({ ...initialState, loading: true }, action)
      expect(state.loading).toBe(false)
      expect(state.enabled).toBe(true)
      expect(state.queries).toEqual(queries)
    })

    it('should handle FETCH_SAVED_QUERIES_ERROR', () => {
      const action = {
        type: FETCH_SAVED_QUERIES_ERROR,
        error: 'Network error',
      }
      const state = reducer({ ...initialState, loading: true }, action)
      expect(state.loading).toBe(false)
      expect(state.error).toBe('Network error')
    })
  })

  describe('create query', () => {
    it('should handle CREATE_QUERY_START', () => {
      const action = { type: CREATE_QUERY_START }
      const state = reducer(initialState, action)
      expect(state.saving).toBe(true)
      expect(state.saveError).toBe(null)
    })

    it('should handle CREATE_QUERY_SUCCESS', () => {
      const newQuery = { id: 1, name: 'New Query', category: 'Test', action: 'query', query: '{ new }' }
      const action = { type: CREATE_QUERY_SUCCESS, query: newQuery }
      const state = reducer({ ...initialState, saving: true }, action)
      expect(state.saving).toBe(false)
      expect(state.queries).toContainEqual(newQuery)
    })

    it('should sort queries after CREATE_QUERY_SUCCESS', () => {
      const existingState = {
        ...initialState,
        queries: [
          { id: 1, name: 'Zebra', category: 'B', action: 'query', query: '{ z }' },
        ],
        saving: true,
      }
      const newQuery = { id: 2, name: 'Apple', category: 'A', action: 'query', query: '{ a }' }
      const action = { type: CREATE_QUERY_SUCCESS, query: newQuery }
      const state = reducer(existingState, action)
      expect(state.queries[0].name).toBe('Apple')
      expect(state.queries[1].name).toBe('Zebra')
    })

    it('should handle CREATE_QUERY_ERROR', () => {
      const action = { type: CREATE_QUERY_ERROR, error: 'Failed to create' }
      const state = reducer({ ...initialState, saving: true }, action)
      expect(state.saving).toBe(false)
      expect(state.saveError).toBe('Failed to create')
    })
  })

  describe('update query', () => {
    it('should handle UPDATE_QUERY_START', () => {
      const action = { type: UPDATE_QUERY_START }
      const state = reducer(initialState, action)
      expect(state.saving).toBe(true)
      expect(state.saveError).toBe(null)
    })

    it('should handle UPDATE_QUERY_SUCCESS', () => {
      const existingState = {
        ...initialState,
        queries: [
          { id: 1, name: 'Original', category: 'Test', action: 'query', query: '{ orig }' },
        ],
        saving: true,
      }
      const updatedQuery = { id: 1, name: 'Updated', category: 'Test', action: 'query', query: '{ updated }' }
      const action = { type: UPDATE_QUERY_SUCCESS, query: updatedQuery }
      const state = reducer(existingState, action)
      expect(state.saving).toBe(false)
      expect(state.queries[0].name).toBe('Updated')
      expect(state.queries[0].query).toBe('{ updated }')
    })

    it('should handle UPDATE_QUERY_ERROR', () => {
      const action = { type: UPDATE_QUERY_ERROR, error: 'Failed to update' }
      const state = reducer({ ...initialState, saving: true }, action)
      expect(state.saving).toBe(false)
      expect(state.saveError).toBe('Failed to update')
    })
  })

  describe('delete query', () => {
    it('should handle DELETE_QUERY_START', () => {
      const action = { type: DELETE_QUERY_START, id: 1 }
      const state = reducer(initialState, action)
      expect(state.deleting).toBe(1)
    })

    it('should handle DELETE_QUERY_SUCCESS', () => {
      const existingState = {
        ...initialState,
        queries: [
          { id: 1, name: 'Query 1', category: 'Test', action: 'query', query: '{ q1 }' },
          { id: 2, name: 'Query 2', category: 'Test', action: 'query', query: '{ q2 }' },
        ],
        deleting: 1,
      }
      const action = { type: DELETE_QUERY_SUCCESS, id: 1 }
      const state = reducer(existingState, action)
      expect(state.deleting).toBe(null)
      expect(state.queries.length).toBe(1)
      expect(state.queries[0].id).toBe(2)
    })

    it('should handle DELETE_QUERY_ERROR', () => {
      const action = { type: DELETE_QUERY_ERROR, error: 'Failed to delete' }
      const state = reducer({ ...initialState, deleting: 1 }, action)
      expect(state.deleting).toBe(null)
      expect(state.error).toBe('Failed to delete')
    })
  })

  describe('save modal', () => {
    it('should handle OPEN_SAVE_MODAL for new query', () => {
      const formData = {
        name: '',
        description: '',
        category: 'General',
        action: 'query',
        query: '{ current_editor_query }',
      }
      const action = { type: OPEN_SAVE_MODAL, editingQuery: null, formData }
      const state = reducer(initialState, action)
      expect(state.showSaveModal).toBe(true)
      expect(state.editingQuery).toBe(null)
      expect(state.saveForm).toEqual(formData)
    })

    it('should handle OPEN_SAVE_MODAL for editing existing query', () => {
      const existingQuery = { id: 1, name: 'Existing', description: 'Desc', category: 'Cat', action: 'query', query: '{ existing }' }
      const formData = {
        name: 'Existing',
        description: 'Desc',
        category: 'Cat',
        action: 'query',
        query: '{ existing }',
      }
      const action = { type: OPEN_SAVE_MODAL, editingQuery: existingQuery, formData }
      const state = reducer(initialState, action)
      expect(state.showSaveModal).toBe(true)
      expect(state.editingQuery).toEqual(existingQuery)
      expect(state.saveForm).toEqual(formData)
    })

    it('should handle CLOSE_SAVE_MODAL', () => {
      const openState = {
        ...initialState,
        showSaveModal: true,
        editingQuery: { id: 1 },
        saveForm: { name: 'Test', description: '', category: 'Test', action: 'query', query: '{ test }' },
        saveError: 'Some error',
      }
      const action = { type: CLOSE_SAVE_MODAL }
      const state = reducer(openState, action)
      expect(state.showSaveModal).toBe(false)
      expect(state.editingQuery).toBe(null)
      expect(state.saveForm).toEqual(initialState.saveForm)
      expect(state.saveError).toBe(null)
    })

    it('should handle UPDATE_SAVE_FORM', () => {
      const action = { type: UPDATE_SAVE_FORM, field: 'name', value: 'New Name' }
      const state = reducer(initialState, action)
      expect(state.saveForm.name).toBe('New Name')
    })

    it('should handle multiple UPDATE_SAVE_FORM calls', () => {
      let state = reducer(initialState, { type: UPDATE_SAVE_FORM, field: 'name', value: 'My Query' })
      state = reducer(state, { type: UPDATE_SAVE_FORM, field: 'category', value: 'Custom' })
      state = reducer(state, { type: UPDATE_SAVE_FORM, field: 'action', value: 'mutate' })
      expect(state.saveForm.name).toBe('My Query')
      expect(state.saveForm.category).toBe('Custom')
      expect(state.saveForm.action).toBe('mutate')
    })
  })
})
