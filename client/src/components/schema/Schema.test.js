/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'
import { combineReducers, createStore } from 'redux'

import ui from 'reducers/ui'
import Schema, { Schema as UnconnectedSchema } from './Schema'

// Schema fetches on mount; without this the suite would need a Dgraph server.
jest.mock('lib/helpers', () => ({
  executeQuery: jest.fn().mockResolvedValue({ data: {} }),
  getDgraphClient: jest.fn().mockResolvedValue({
    newTxn: () => ({
      query: jest.fn().mockResolvedValue({
        data: {
          schema: [
            { predicate: 'dgraph.type', type: 'string', list: true },
            { predicate: 'name', type: 'string' },
            { predicate: 'dgraph.drop.op', type: 'string' },
          ],
          types: [],
        },
      }),
    }),
  }),
}))

const renderSchema = () => {
  const store = createStore(combineReducers({ ui }))
  const result = render(
    <Provider store={store}>
      <Schema onOpenGeneratedQuery={() => {}} />
    </Provider>,
  )
  return { ...result, store }
}

test('the toggle counts the system predicates in the fetched schema', async () => {
  renderSchema()

  await waitFor(() =>
    expect(
      screen.getByRole('checkbox', { name: /System predicates \(2\)/ }),
    ).toBeInTheDocument(),
  )
})

// The grid cannot be driven here: react-data-grid virtualises and has no
// height under jsdom, so it renders no rows at all once the row set changes.
// These reach the guard directly instead of through a click.
describe('clearing the details pane when its row is hidden', () => {
  const withSelection = (name, showSystemPredicates) => {
    const instance = new UnconnectedSchema({ showSystemPredicates })
    instance.state = { ...instance.state, selectedPredicateName: name }
    instance.setState = (patch) => Object.assign(instance.state, patch)
    return instance
  }

  it('clears a system predicate when the preference is turned off', () => {
    const instance = withSelection('dgraph.type', false)
    instance.componentDidUpdate({ showSystemPredicates: true })

    expect(instance.state.selectedPredicateName).toBeNull()
  })

  it('leaves a user predicate selected', () => {
    const instance = withSelection('name', false)
    instance.componentDidUpdate({ showSystemPredicates: true })

    expect(instance.state.selectedPredicateName).toBe('name')
  })

  it('leaves the selection alone when the preference is turned on', () => {
    const instance = withSelection('dgraph.type', true)
    instance.componentDidUpdate({ showSystemPredicates: false })

    expect(instance.state.selectedPredicateName).toBe('dgraph.type')
  })
})
