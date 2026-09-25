/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'

import PredicatesTable from './PredicatesTable'

// Order matters: react-data-grid virtualises and the grid has no height under
// jsdom, so only the first few rows reach the DOM. Anything an assertion needs
// to find — or needs to prove is absent — has to be near the front, or the
// test passes because the row was never rendered rather than because it was
// filtered.
const schema = [
  // Pre-v1.1 internal. Not "dgraph."-prefixed, so nothing downstream would
  // recognise it as a system predicate.
  { predicate: '_predicate_', type: 'string' },
  { predicate: 'name', type: 'string' },
  { predicate: 'dgraph.drop.op', type: 'string' },
  // Hidden by the old hardcoded list, so this one proves the filter is now the
  // prefix rather than that list.
  { predicate: 'dgraph.type', type: 'string' },
]

const renderTable = (props = {}) =>
  render(
    <PredicatesTable
      schema={schema}
      onChangeSelectedPredicate={() => {}}
      selectedPredicate={null}
      {...props}
    />,
  )

test("Dgraph's own predicates are hidden unless asked for", () => {
  renderTable()

  expect(screen.getByText('name')).toBeInTheDocument()
  for (const hidden of ['dgraph.drop.op', 'dgraph.type']) {
    expect(screen.queryByText(hidden)).toBeNull()
  }
})

test('showSystemPredicates reveals all of them, not just some', () => {
  renderTable({ showSystemPredicates: true })

  // dgraph.type included: the previous filter hid it unconditionally, so a
  // "show system predicates" control would have been lying about it.
  for (const shown of ['name', 'dgraph.drop.op', 'dgraph.type']) {
    expect(screen.getByText(shown)).toBeInTheDocument()
  }
})

test('the revealed rows are marked read-only', () => {
  renderTable({ showSystemPredicates: true })

  expect(screen.getAllByLabelText('Managed by Dgraph')).toHaveLength(2)

  const cell = screen.getByText('dgraph.drop.op')
  expect(cell).toHaveAttribute(
    'title',
    "Dgraph's own predicate. It cannot be modified or dropped.",
  )
  expect(cell).toHaveClass('system')
})

test('a user predicate is never marked', () => {
  renderTable({ showSystemPredicates: true })

  const cell = screen.getByText('name')
  expect(cell).not.toHaveClass('system')
  expect(cell).not.toHaveAttribute('title')
})

// The marker is rendered by a formatter so that the row's own `name` stays a
// plain string — react-data-grid sorts on it and selects rows by it.
test('the marker does not replace the predicate name', () => {
  renderTable({ showSystemPredicates: true })

  expect(screen.getByText('dgraph.drop.op')).toBeInTheDocument()
  expect(screen.getByText('name')).toBeInTheDocument()
})

// The preference reveals what Dgraph owns, not everything the filter excludes.
// A legacy internal has no "dgraph." prefix, so it would render unmarked and
// the properties panel would offer a live Update and Drop for it.
test('legacy internals stay hidden even when system predicates are shown', () => {
  renderTable({ showSystemPredicates: true })

  expect(screen.queryByText('_predicate_')).toBeNull()
})

test('legacy internals are hidden by default too', () => {
  renderTable()

  expect(screen.queryByText('_predicate_')).toBeNull()
})
