/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

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
  fetchSavedQueries,
  createSavedQuery,
  updateSavedQuery,
  deleteSavedQuery,
  selectSavedQuery,
  openSaveModal,
  closeSaveModal,
  updateSaveForm,
  saveCurrentQuery,
} from './savedQueries'

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

// Mock fetch globally
global.fetch = jest.fn()

describe('savedQueries actions', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  describe('fetchSavedQueries', () => {
    it('dispatches FETCH_SUCCESS on successful fetch', async () => {
      const mockQueries = [
        { id: 1, name: 'Query 1', category: 'Test', action: 'query', query: '{ q1 }' },
      ]
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ enabled: true, queries: mockQueries }),
      })

      const store = mockStore({})
      await store.dispatch(fetchSavedQueries())

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: FETCH_SAVED_QUERIES_START })
      expect(actions[1]).toEqual({
        type: FETCH_SAVED_QUERIES_SUCCESS,
        payload: { enabled: true, queries: mockQueries },
      })
    })

    it('dispatches FETCH_ERROR on failed fetch', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const store = mockStore({})
      await store.dispatch(fetchSavedQueries())

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: FETCH_SAVED_QUERIES_START })
      expect(actions[1].type).toBe(FETCH_SAVED_QUERIES_ERROR)
      expect(actions[1].error).toContain('500')
    })

    it('dispatches FETCH_ERROR on network error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'))

      const store = mockStore({})
      await store.dispatch(fetchSavedQueries())

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: FETCH_SAVED_QUERIES_START })
      expect(actions[1]).toEqual({
        type: FETCH_SAVED_QUERIES_ERROR,
        error: 'Network error',
      })
    })
  })

  describe('createSavedQuery', () => {
    it('dispatches CREATE_SUCCESS and CLOSE_SAVE_MODAL on success', async () => {
      const queryData = { name: 'New Query', query: '{ new }' }
      const createdQuery = { id: 1, ...queryData }
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createdQuery),
      })

      const store = mockStore({})
      await store.dispatch(createSavedQuery(queryData))

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: CREATE_QUERY_START })
      expect(actions[1]).toEqual({ type: CREATE_QUERY_SUCCESS, query: createdQuery })
      expect(actions[2]).toEqual({ type: CLOSE_SAVE_MODAL })
    })

    it('dispatches CREATE_ERROR on failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Name is required' }),
      })

      const store = mockStore({})
      await expect(store.dispatch(createSavedQuery({}))).rejects.toThrow()

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: CREATE_QUERY_START })
      expect(actions[1].type).toBe(CREATE_QUERY_ERROR)
    })
  })

  describe('updateSavedQuery', () => {
    it('dispatches UPDATE_SUCCESS and CLOSE_SAVE_MODAL on success', async () => {
      const queryData = { name: 'Updated Query', query: '{ updated }' }
      const updatedQuery = { id: 1, ...queryData }
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedQuery),
      })

      const store = mockStore({})
      await store.dispatch(updateSavedQuery(1, queryData))

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: UPDATE_QUERY_START })
      expect(actions[1]).toEqual({ type: UPDATE_QUERY_SUCCESS, query: updatedQuery })
      expect(actions[2]).toEqual({ type: CLOSE_SAVE_MODAL })
    })

    it('dispatches UPDATE_ERROR on failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' }),
      })

      const store = mockStore({})
      await expect(store.dispatch(updateSavedQuery(999, {}))).rejects.toThrow()

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: UPDATE_QUERY_START })
      expect(actions[1].type).toBe(UPDATE_QUERY_ERROR)
    })
  })

  describe('deleteSavedQuery', () => {
    it('dispatches DELETE_SUCCESS on success', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      const store = mockStore({})
      await store.dispatch(deleteSavedQuery(1))

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: DELETE_QUERY_START, id: 1 })
      expect(actions[1]).toEqual({ type: DELETE_QUERY_SUCCESS, id: 1 })
    })

    it('dispatches DELETE_ERROR on failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Database error' }),
      })

      const store = mockStore({})
      await expect(store.dispatch(deleteSavedQuery(1))).rejects.toThrow()

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: DELETE_QUERY_START, id: 1 })
      expect(actions[1].type).toBe(DELETE_QUERY_ERROR)
    })
  })

  describe('selectSavedQuery', () => {
    it('dispatches updateQuery and updateAction', () => {
      const query = { name: 'Test', action: 'mutate', query: '{ test }' }
      const store = mockStore({})
      store.dispatch(selectSavedQuery(query))

      const actions = store.getActions()
      // Should dispatch updateQuery and updateAction from query module
      expect(actions.length).toBe(2)
      expect(actions[0].type).toBe('query/UPDATE_QUERY')
      expect(actions[0].query).toBe('{ test }')
      expect(actions[1].type).toBe('query/UPDATE_ACTION')
      expect(actions[1].action).toBe('mutate')
    })
  })

  describe('openSaveModal', () => {
    it('opens modal for new query with current editor content', () => {
      const store = mockStore({
        query: { query: '{ current }', action: 'query' },
      })
      store.dispatch(openSaveModal())

      const actions = store.getActions()
      expect(actions[0].type).toBe(OPEN_SAVE_MODAL)
      expect(actions[0].editingQuery).toBe(null)
      expect(actions[0].formData.query).toBe('{ current }')
      expect(actions[0].formData.action).toBe('query')
      expect(actions[0].formData.name).toBe('')
    })

    it('opens modal for editing with existing query data', () => {
      const existingQuery = {
        id: 1,
        name: 'Existing',
        description: 'Desc',
        category: 'Cat',
        action: 'mutate',
        query: '{ existing }',
      }
      const store = mockStore({
        query: { query: '{ current }', action: 'query' },
      })
      store.dispatch(openSaveModal(existingQuery))

      const actions = store.getActions()
      expect(actions[0].type).toBe(OPEN_SAVE_MODAL)
      expect(actions[0].editingQuery).toEqual(existingQuery)
      expect(actions[0].formData.name).toBe('Existing')
      expect(actions[0].formData.query).toBe('{ existing }')
    })
  })

  describe('closeSaveModal', () => {
    it('dispatches CLOSE_SAVE_MODAL', () => {
      const action = closeSaveModal()
      expect(action).toEqual({ type: CLOSE_SAVE_MODAL })
    })
  })

  describe('updateSaveForm', () => {
    it('dispatches UPDATE_SAVE_FORM with field and value', () => {
      const action = updateSaveForm('name', 'Test Name')
      expect(action).toEqual({
        type: UPDATE_SAVE_FORM,
        field: 'name',
        value: 'Test Name',
      })
    })
  })

  describe('saveCurrentQuery', () => {
    it('creates new query when editingQuery is null', async () => {
      const saveForm = { name: 'New', query: '{ new }' }
      const createdQuery = { id: 1, ...saveForm }
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createdQuery),
      })

      const store = mockStore({
        savedQueries: { editingQuery: null, saveForm },
      })
      await store.dispatch(saveCurrentQuery())

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: CREATE_QUERY_START })
    })

    it('updates existing query when editingQuery is set', async () => {
      const saveForm = { name: 'Updated', query: '{ updated }' }
      const updatedQuery = { id: 1, ...saveForm }
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedQuery),
      })

      const store = mockStore({
        savedQueries: { editingQuery: { id: 1 }, saveForm },
      })
      await store.dispatch(saveCurrentQuery())

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: UPDATE_QUERY_START })
    })
  })
})
