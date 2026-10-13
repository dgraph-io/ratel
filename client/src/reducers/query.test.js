/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  addTab,
  closeTab,
  renameTab,
  switchTab,
  updateQuery,
  updateQueryAndAction,
  updateQueryVars,
} from 'actions/query'
import reducer from 'reducers/query'

const init = (state = undefined) => reducer(state, { type: '@@INIT' })

const activeTab = (state) => state.tabs.find((t) => t.id === state.activeTabId)

describe('query reducer tabs', () => {
  it('initializes with a single empty tab', () => {
    const state = init()

    expect(state.tabs).toHaveLength(1)
    expect(state.tabs[0].name).toBe('Query 1')
    expect(state.activeTabId).toBe(state.tabs[0].id)
    expect(state.query).toBe('')
    expect(state.action).toBe('query')
  })

  it('migrates legacy persisted state without tabs', () => {
    const legacy = {
      query: '{ legacy(func: has(name)) { name } }',
      queryVars: [{ name: 'var1', value: 'val1' }],
      allQueries: { query: '{ legacy(func: has(name)) { name } }' },
      action: 'query',
      readOnly: false,
      bestEffort: false,
    }
    const state = init(legacy)

    expect(state.tabs).toHaveLength(1)
    expect(state.activeTabId).toBe(state.tabs[0].id)
    expect(state.tabs[0].query).toBe(legacy.query)
    expect(state.tabs[0].action).toBe('query')
    expect(state.tabs[0].queryVars).toEqual(legacy.queryVars)
    // Top-level fields are untouched by the migration.
    expect(state.query).toBe(legacy.query)
  })

  it('migrates legacy mutate state without crashing', () => {
    const state = reducer(
      { query: 'mutation text', action: 'mutate' },
      updateQuery('mutation text 2'),
    )

    expect(state.tabs).toHaveLength(1)
    expect(state.query).toBe('mutation text 2')
    expect(state.tabs[0].query).toBe('mutation text 2')
    expect(state.tabs[0].action).toBe('mutate')
  })

  it('adds a new empty tab and switches to it', () => {
    let state = init()
    state = reducer(state, updateQuery('{ first }'))
    state = reducer(state, addTab())

    expect(state.tabs).toHaveLength(2)
    expect(state.tabs[1].name).toBe('Query 2')
    expect(state.activeTabId).toBe(state.tabs[1].id)
    expect(state.query).toBe('')
    expect(state.action).toBe('query')
    // The tab that was left keeps its content.
    expect(state.tabs[0].query).toBe('{ first }')
  })

  it('switching tabs preserves edits in the tab being left', () => {
    let state = init()
    state = reducer(state, updateQuery('{ first }'))
    state = reducer(state, addTab())
    state = reducer(state, updateQuery('{ second }'))
    state = reducer(state, updateQueryVars([{ name: 'v', value: '1' }]))

    const [tab1, tab2] = state.tabs
    state = reducer(state, switchTab(tab1.id))

    expect(state.activeTabId).toBe(tab1.id)
    expect(state.query).toBe('{ first }')
    expect(state.queryVars).toEqual([])
    expect(state.tabs.find((t) => t.id === tab2.id).query).toBe('{ second }')
    expect(state.tabs.find((t) => t.id === tab2.id).queryVars).toEqual([
      { name: 'v', value: '1' },
    ])

    // And switching back restores the second tab's edits.
    state = reducer(state, switchTab(tab2.id))
    expect(state.query).toBe('{ second }')
    expect(state.queryVars).toEqual([{ name: 'v', value: '1' }])
  })

  it('ignores switching to an unknown tab id', () => {
    let state = init()
    state = reducer(state, updateQuery('{ keep }'))
    const before = state
    state = reducer(state, switchTab('no-such-id'))

    expect(state.activeTabId).toBe(before.activeTabId)
    expect(state.query).toBe('{ keep }')
  })

  it('closes an inactive tab without changing the active one', () => {
    let state = init()
    state = reducer(state, updateQuery('{ first }'))
    state = reducer(state, addTab())
    state = reducer(state, updateQuery('{ second }'))

    const [tab1, tab2] = state.tabs
    state = reducer(state, closeTab(tab1.id))

    expect(state.tabs).toHaveLength(1)
    expect(state.activeTabId).toBe(tab2.id)
    expect(state.query).toBe('{ second }')
  })

  it('closing the active tab activates its neighbor', () => {
    let state = init()
    state = reducer(state, updateQuery('{ first }'))
    state = reducer(state, addTab())
    state = reducer(state, updateQuery('{ second }'))
    state = reducer(state, addTab())
    state = reducer(state, updateQuery('{ third }'))

    // Make the middle tab active, then close it.
    const [, tab2, tab3] = state.tabs
    state = reducer(state, switchTab(tab2.id))
    state = reducer(state, closeTab(tab2.id))

    expect(state.tabs).toHaveLength(2)
    expect(state.activeTabId).toBe(tab3.id)
    expect(state.query).toBe('{ third }')

    // Closing the active last tab falls back to the previous neighbor.
    state = reducer(state, closeTab(tab3.id))
    expect(state.tabs).toHaveLength(1)
    expect(state.query).toBe('{ first }')
  })

  it('closing the last remaining tab resets to a single empty tab', () => {
    let state = init()
    state = reducer(state, updateQuery('{ first }'))
    state = reducer(state, updateQueryVars([{ name: 'v', value: '1' }]))
    const oldId = state.activeTabId
    state = reducer(state, closeTab(oldId))

    expect(state.tabs).toHaveLength(1)
    expect(state.tabs[0].id).not.toBe(oldId)
    expect(state.tabs[0].name).toBe('Query 1')
    expect(state.activeTabId).toBe(state.tabs[0].id)
    expect(state.query).toBe('')
    expect(state.queryVars).toEqual([])
  })

  it('ignores closing an unknown tab id', () => {
    let state = init()
    state = reducer(state, closeTab('no-such-id'))

    expect(state.tabs).toHaveLength(1)
  })

  it('renames a tab', () => {
    let state = init()
    state = reducer(state, addTab())
    const [tab1] = state.tabs
    state = reducer(state, renameTab(tab1.id, '  My Tab  '))

    expect(state.tabs[0].name).toBe('My Tab')
    // The other tab is untouched.
    expect(state.tabs[1].name).toBe('Query 2')
  })

  it('ignores renaming to an empty name', () => {
    let state = init()
    state = reducer(state, renameTab(state.tabs[0].id, '   '))

    expect(state.tabs[0].name).toBe('Query 1')
  })

  it('updateQueryAndAction updates the active tab', () => {
    let state = init()
    state = reducer(state, addTab())
    state = reducer(state, updateQueryAndAction('{ fromHistory }', 'mutate'))

    expect(state.query).toBe('{ fromHistory }')
    expect(state.action).toBe('mutate')
    expect(activeTab(state).query).toBe('{ fromHistory }')
    expect(activeTab(state).action).toBe('mutate')
    // The inactive tab is untouched.
    expect(state.tabs[0].query).toBe('')
  })

  it('keeps the active tab record in sync with live edits', () => {
    let state = init()
    state = reducer(state, updateQuery('{ live }'))

    expect(activeTab(state).query).toBe('{ live }')
  })

  it('numbers new tabs with an increasing counter', () => {
    let state = init()
    state = reducer(state, addTab())
    state = reducer(state, closeTab(state.tabs[1].id))
    state = reducer(state, addTab())

    expect(state.tabs[1].name).toBe('Query 3')
  })
})
