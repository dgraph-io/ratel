/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import '@testing-library/jest-dom'
import { fireEvent, render, screen, within } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'

import ClusterPage from './ClusterPage'

// A store stub rather than the real one: ClusterPage only reads two slices, and
// its mount dispatches polling thunks that would otherwise reach the network.
const storeWith = (state) => ({
  getState: () => state,
  subscribe: () => () => {},
  dispatch: () => {},
})

const group = (tablets, members = {}) => ({ members, tablets })

const tablet = (space) => (space === undefined ? {} : { space })

const renderCluster = (groups) =>
  render(
    <Provider
      store={storeWith({
        cluster: {
          isAuthorized: true,
          instanceHealth: [],
          clusterState: { groups },
        },
        connection: { serverHistory: [{ url: 'http://localhost:8080' }] },
      })}
    >
      <ClusterPage />
    </Provider>,
  )

const groupBox = (n) => screen.getByTitle(`Group #${n}`).closest('.group')

const singleGroup = {
  1: group({
    '0-name': tablet('2200000'),
    '0-location': tablet('890000'),
    '0-dgraph.type': tablet('400000'),
    '0-dgraph.drop.op': tablet(),
    '0-dgraph.graphql.schema': tablet(),
  }),
}

test('system predicates are collapsed, and only user tablets are counted', () => {
  renderCluster(singleGroup)

  expect(screen.getByText('Tablets (2)')).toBeInTheDocument()
  expect(screen.getByText('0-name')).toBeInTheDocument()
  expect(screen.getByText('0-location')).toBeInTheDocument()

  // Collapsed, so the system rows are absent rather than merely hidden.
  expect(screen.queryByText('0-dgraph.type')).toBeNull()
  expect(screen.queryByText('0-dgraph.drop.op')).toBeNull()
})

test('the toggle reports how many system predicates there are and their size', () => {
  renderCluster(singleGroup)

  // 400000 bytes across the three, only one of which reports a size.
  expect(
    screen.getByRole('button', {
      name: /Show 3 system predicates \(390\.6kB\)/,
    }),
  ).toBeInTheDocument()
})

test('expanding reveals the system predicates and explains them', () => {
  renderCluster(singleGroup)

  fireEvent.click(screen.getByRole('button', { name: /Show 3 system/ }))

  expect(screen.getByText('0-dgraph.type')).toBeInTheDocument()
  expect(screen.getByText('0-dgraph.drop.op')).toBeInTheDocument()
  expect(
    screen.getByText(/cannot be moved between groups or dropped/),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: /Hide 3 system/ }),
  ).toBeInTheDocument()
})

test('a system predicate offers no move button even when expanded', () => {
  renderCluster({
    1: singleGroup[1],
    // A second group is what makes the move button appear at all.
    2: group({ '0-other': tablet('100') }),
  })

  fireEvent.click(screen.getByRole('button', { name: /Show 3 system/ }))

  const systemRow = screen.getByText('0-dgraph.type').closest('.tablet')
  expect(within(systemRow).queryByTitle('Move to another group')).toBeNull()
  expect(within(systemRow).getByText('system')).toBeInTheDocument()

  const userRow = screen.getByText('0-name').closest('.tablet')
  expect(
    within(userRow).getByTitle('Move to another group'),
  ).toBeInTheDocument()
})

test('each group toggles independently', () => {
  renderCluster({
    1: group({ '0-name': tablet('100'), '0-dgraph.type': tablet() }),
    2: group({ '0-other': tablet('100'), '0-dgraph.drop.op': tablet() }),
  })

  const [first, second] = [groupBox(1), groupBox(2)]

  fireEvent.click(within(first).getByRole('button', { name: /Show 1 system/ }))

  expect(within(first).getByText('0-dgraph.type')).toBeInTheDocument()
  // Group #2 stays collapsed: the toggle is per group, not per page.
  expect(within(second).queryByText('0-dgraph.drop.op')).toBeNull()
  expect(
    within(second).getByRole('button', { name: /Show 1 system/ }),
  ).toBeInTheDocument()
})

test('a group with no system predicates shows no toggle', () => {
  renderCluster({ 1: group({ '0-name': tablet('100') }) })

  expect(screen.queryByRole('button', { name: /system predicate/ })).toBeNull()
})

test('the toggle is singular for a single system predicate', () => {
  renderCluster({ 1: group({ '0-dgraph.type': tablet() }) })

  expect(
    screen.getByRole('button', { name: /Show 1 system predicate$/ }),
  ).toBeInTheDocument()
})
