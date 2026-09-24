/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'

import PredicatesTable from './PredicatesTable'

// Dgraph's own predicates that the existing isUserPredicate filter lets
// through, so they appear in this list alongside the user's.
const schema = [
  { predicate: 'name', type: 'string' },
  { predicate: 'dgraph.drop.op', type: 'string' },
  { predicate: 'dgraph.graphql.schema', type: 'string' },
]

const renderTable = (rows = schema) =>
  render(
    <PredicatesTable
      schema={rows}
      onChangeSelectedPredicate={() => {}}
      selectedPredicate={null}
    />,
  )

test("Dgraph's own predicates are marked read-only", () => {
  renderTable()

  expect(screen.getAllByLabelText('Managed by Dgraph')).toHaveLength(2)
})

test('the marked cell explains itself on hover', () => {
  renderTable()

  const cell = screen.getByText('dgraph.drop.op')
  expect(cell).toHaveAttribute(
    'title',
    "Dgraph's own predicate. It cannot be modified or dropped.",
  )
  expect(cell).toHaveClass('system')
})

test('a user predicate is not marked', () => {
  renderTable([{ predicate: 'name', type: 'string' }])

  expect(screen.queryByLabelText('Managed by Dgraph')).toBeNull()
  const cell = screen.getByText('name')
  expect(cell).not.toHaveClass('system')
  expect(cell).not.toHaveAttribute('title')
})

// The marker is rendered by a formatter so that the row's own `name` stays a
// plain string — react-data-grid sorts on it and selects rows by it.
test('the marker does not replace the predicate name', () => {
  renderTable()

  expect(screen.getByText('dgraph.drop.op')).toBeInTheDocument()
  expect(screen.getByText('dgraph.graphql.schema')).toBeInTheDocument()
  expect(screen.getByText('name')).toBeInTheDocument()
})
