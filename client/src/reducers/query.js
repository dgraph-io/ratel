/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ADD_TAB,
  CLOSE_TAB,
  RENAME_TAB,
  SWITCH_TAB,
  UPDATE_ACTION,
  UPDATE_BEST_EFFORT,
  UPDATE_QUERY,
  UPDATE_QUERY_AND_ACTION,
  UPDATE_QUERY_VARS,
  UPDATE_READ_ONLY,
} from 'actions/query'
import produce from 'immer'
import uuid from 'uuid'

const makeTab = (name, fields = {}) => ({
  id: uuid(),
  name,
  query: '',
  action: 'query',
  queryVars: [],
  allQueries: { query: '', mutate: '', alter: '' },
  ...fields,
})

const defaultState = {
  query: '',
  queryVars: [],
  allQueries: { query: '', mutate: '', alter: '' },
  action: 'query',
  readOnly: false,
  bestEffort: false,
  tabs: [],
  activeTabId: null,
  tabCounter: 0,
}

// Saves the live top-level editor fields into the currently active tab.
const saveActiveTab = (draft) => {
  const tab = draft.tabs.find((t) => t.id === draft.activeTabId)
  if (!tab) {
    return
  }
  tab.query = draft.query
  tab.action = draft.action
  tab.queryVars = draft.queryVars
  tab.allQueries = draft.allQueries
}

// Loads a tab's fields into the live top-level editor fields.
const loadTab = (draft, tab) => {
  draft.activeTabId = tab.id
  draft.query = tab.query || ''
  draft.action = tab.action || 'query'
  draft.queryVars = tab.queryVars || []
  draft.allQueries = tab.allQueries || {
    query: '',
    mutate: '',
    alter: '',
    [draft.action]: draft.query,
  }
}

export default (state = defaultState, action) =>
  produce(state, (draft) => {
    draft.allQueries = draft.allQueries || {}
    draft.action = draft.action || 'query'
    draft.allQueries[draft.action] = draft.query || ''

    // Migration: legacy persisted state (or a fresh store) has no tabs.
    // Hydrate a single tab from the current top-level query fields.
    if (!Array.isArray(draft.tabs) || draft.tabs.length === 0) {
      draft.tabCounter = 1
      draft.tabs = [
        makeTab('Query 1', {
          query: draft.query || '',
          action: draft.action,
          queryVars: draft.queryVars || [],
          allQueries: draft.allQueries,
        }),
      ]
      draft.activeTabId = draft.tabs[0].id
    } else if (!draft.tabs.some((t) => t.id === draft.activeTabId)) {
      draft.activeTabId = draft.tabs[0].id
    }
    draft.tabCounter = draft.tabCounter || draft.tabs.length

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

      case ADD_TAB: {
        saveActiveTab(draft)
        draft.tabCounter += 1
        const tab = makeTab(`Query ${draft.tabCounter}`)
        draft.tabs.push(tab)
        loadTab(draft, tab)
        break
      }

      case SWITCH_TAB: {
        const target = draft.tabs.find((t) => t.id === action.id)
        if (target && target.id !== draft.activeTabId) {
          saveActiveTab(draft)
          loadTab(draft, target)
        }
        break
      }

      case CLOSE_TAB: {
        const index = draft.tabs.findIndex((t) => t.id === action.id)
        if (index === -1) {
          break
        }
        if (draft.tabs.length === 1) {
          // Closing the last tab resets to a single empty tab.
          draft.tabCounter = 1
          const tab = makeTab('Query 1')
          draft.tabs = [tab]
          loadTab(draft, tab)
          break
        }
        const wasActive = action.id === draft.activeTabId
        draft.tabs.splice(index, 1)
        if (wasActive) {
          const neighbor = draft.tabs[Math.min(index, draft.tabs.length - 1)]
          loadTab(draft, neighbor)
        }
        break
      }

      case RENAME_TAB: {
        const tab = draft.tabs.find((t) => t.id === action.id)
        const name = (action.name || '').trim()
        if (tab && name) {
          tab.name = name
        }
        break
      }

      default:
        break
    }

    draft.allQueries[draft.action] = draft.query
    // Keep the active tab's record in sync with the live fields so that
    // persisted tabs are always accurate.
    saveActiveTab(draft)
  })
