/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'
import { combineReducers, createStore } from 'redux'

import ui from 'reducers/ui'
import SystemPredicateToggle from './SystemPredicateToggle'

const renderToggle = (props = { count: 7 }) => {
  const store = createStore(combineReducers({ ui }))
  const result = render(
    <Provider store={store}>
      <SystemPredicateToggle {...props} />
    </Provider>,
  )
  return { ...result, store }
}

test('hidden by default, and says how many are hidden', () => {
  const { store } = renderToggle()

  expect(store.getState().ui.showSystemPredicates).toBe(false)
  const input = screen.getByRole('checkbox', {
    name: /System predicates \(7\)/,
  })
  expect(input).not.toBeChecked()
})

test('clicking writes the shared preference', () => {
  const { store } = renderToggle()

  fireEvent.click(screen.getByRole('checkbox'))
  expect(store.getState().ui.showSystemPredicates).toBe(true)
  expect(screen.getByRole('checkbox')).toBeChecked()

  fireEvent.click(screen.getByRole('checkbox'))
  expect(store.getState().ui.showSystemPredicates).toBe(false)
  expect(screen.getByRole('checkbox')).not.toBeChecked()
})

// Only the styling changes with state. The two pages place this differently —
// a toolbar on one, a heading baseline on the other — and a label that changed
// width would move its neighbours on every click.
test('the label does not change shape when toggled', () => {
  renderToggle()

  const label = () => screen.getByText(/System predicates/).textContent
  const before = label()
  fireEvent.click(screen.getByRole('checkbox'))
  expect(label()).toBe(before)
})

// Nothing to reveal means nothing to explain; a control that can only ever be
// a no-op is noise.
test('renders nothing when there are no system predicates', () => {
  renderToggle({ count: 0 })

  expect(screen.queryByRole('checkbox')).toBeNull()
})
