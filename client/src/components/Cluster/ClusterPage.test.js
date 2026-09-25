/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import '@testing-library/jest-dom'
import { fireEvent, render, screen, within } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'
import { applyMiddleware, combineReducers, createStore } from 'redux'
import ReduxThunk from 'redux-thunk'

import ui from 'reducers/ui'
import ClusterPage from './ClusterPage'

// ClusterPage dispatches these on mount and every 10s. Left real, thunk would
// run them and reach for a Dgraph server, so the suite would depend on one
// being up.
jest.mock('actions/cluster', () => ({
  getClusterState: () => ({ type: 'test/noop' }),
  getInstanceHealth: () => ({ type: 'test/noop' }),
}))

// Held outside the reducers so every action returns the same object. Handing
// back a fresh one each time would change currentServer's identity, and the
// refresh effect keyed on it would re-run on every dispatch.
const CONNECTION = { serverHistory: [{ url: 'http://localhost:8080' }] }

const storeWith = (groups) => {
  const cluster = {
    isAuthorized: true,
    instanceHealth: [],
    clusterState: { groups },
  }
  return createStore(
    combineReducers({
      ui,
      cluster: () => cluster,
      connection: () => CONNECTION,
    }),
    applyMiddleware(ReduxThunk),
  )
}

const group = (tablets, members = {}) => ({ members, tablets })
const tablet = (space) => (space === undefined ? {} : { space })

const renderCluster = (groups) => {
  const store = storeWith(groups)
  const result = render(
    <Provider store={store}>
      <ClusterPage />
    </Provider>,
  )
  return { ...result, store }
}

const groupBox = (n) => screen.getByTitle(`Group #${n}`).closest('.group')
const toggle = () => screen.getByRole('checkbox', { name: /System predicates/ })

const singleGroup = {
  1: group({
    '0-name': tablet('2200000'),
    '0-location': tablet('890000'),
    '0-dgraph.type': tablet('400000'),
    '0-dgraph.drop.op': tablet(),
    '0-dgraph.graphql.schema': tablet(),
  }),
}

test('system tablets are hidden, and only user tablets are counted', () => {
  renderCluster(singleGroup)

  expect(screen.getByText('Tablets (2)')).toBeInTheDocument()
  expect(screen.getByText('0-name')).toBeInTheDocument()
  expect(screen.queryByText('0-dgraph.type')).toBeNull()
})

test('the toggle says how many are hidden', () => {
  renderCluster(singleGroup)

  expect(
    screen.getByRole('checkbox', { name: /System predicates \(3\)/ }),
  ).toBeInTheDocument()
})

test('toggling reveals them and explains them', () => {
  renderCluster(singleGroup)

  fireEvent.click(toggle())

  expect(screen.getByText('0-dgraph.type')).toBeInTheDocument()
  expect(screen.getByText('0-dgraph.drop.op')).toBeInTheDocument()
  expect(
    screen.getByText(/cannot be moved between groups or dropped/),
  ).toBeInTheDocument()
})

// The heading describes the list under it, so it has to follow the toggle.
test('the tablet count follows what is on screen', () => {
  renderCluster(singleGroup)

  expect(screen.getByText('Tablets (2)')).toBeInTheDocument()
  fireEvent.click(toggle())
  expect(screen.getByText('Tablets (5)')).toBeInTheDocument()
  fireEvent.click(toggle())
  expect(screen.getByText('Tablets (2)')).toBeInTheDocument()
})

// One preference, not one per group: an operator who wants them in view wants
// them in view everywhere, and the schema page reads the same flag.
test('the preference applies to every group at once', () => {
  const { store } = renderCluster({
    1: group({ '0-name': tablet('100'), '0-dgraph.type': tablet() }),
    2: group({ '0-other': tablet('100'), '0-dgraph.drop.op': tablet() }),
  })

  fireEvent.click(toggle())

  expect(within(groupBox(1)).getByText('0-dgraph.type')).toBeInTheDocument()
  expect(within(groupBox(2)).getByText('0-dgraph.drop.op')).toBeInTheDocument()
  expect(store.getState().ui.showSystemPredicates).toBe(true)
})

test('the count covers every group', () => {
  renderCluster({
    1: group({ '0-name': tablet('100'), '0-dgraph.type': tablet() }),
    2: group({ '0-other': tablet('100'), '0-dgraph.drop.op': tablet() }),
  })

  expect(
    screen.getByRole('checkbox', { name: /System predicates \(2\)/ }),
  ).toBeInTheDocument()
})

test('a system tablet offers no move button when shown', () => {
  renderCluster({
    1: singleGroup[1],
    // A second group is what makes the move button appear at all.
    2: group({ '0-other': tablet('100') }),
  })

  fireEvent.click(toggle())

  const systemRow = screen.getByText('0-dgraph.type').closest('.tablet')
  expect(within(systemRow).queryByTitle('Move to another group')).toBeNull()
  expect(within(systemRow).getByText('system')).toBeInTheDocument()

  const userRow = screen.getByText('0-name').closest('.tablet')
  expect(
    within(userRow).getByTitle('Move to another group'),
  ).toBeInTheDocument()
})

test('a cluster with no system tablets shows no toggle', () => {
  renderCluster({ 1: group({ '0-name': tablet('100') }) })

  expect(
    screen.queryByRole('checkbox', { name: /system predicates/i }),
  ).toBeNull()
})

// A schema grows over time, and .groups is a stretch flex row: without a
// bounded scroll region one large group sets the height of every sibling.
test('a group keeps its tablet list in a bounded scroll region', () => {
  const many = Object.fromEntries(
    Array.from({ length: 300 }, (_, i) => [`0-pred_${i}`, { space: '1000' }]),
  )
  const { container } = renderCluster({ 1: group(many), 2: group(many) })

  const lists = container.querySelectorAll('.group .tablet-list')
  expect(lists).toHaveLength(2)
  // The rows live inside it, so the cap applies to them.
  expect(lists[0].querySelectorAll('.tablet').length).toBe(300)
})
