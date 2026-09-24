/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'

import PredicatePropertiesPanel from './PredicatePropertiesPanel'

const renderPanel = (predicate) =>
  render(
    <PredicatePropertiesPanel
      predicate={predicate}
      executeQuery={async () => ({ data: {} })}
      onAfterDrop={() => {}}
      onUpdatePredicate={() => {}}
    />,
  )

const dropButton = () => screen.getByRole('button', { name: /^Drop$/ })
const updateButton = () => screen.getByRole('button', { name: /^Update$/ })

test('a user predicate can be dropped', () => {
  renderPanel({ predicate: 'name', type: 'string' })

  expect(dropButton()).toBeEnabled()
  expect(screen.queryByText(/Dgraph manages this predicate/)).toBeNull()
})

// Dgraph refuses both: "predicate dgraph.type is pre-defined and is not
// allowed to be modified" / "... to be dropped". Drop used to walk the user
// through two "this cannot be undone" prompts on the way to that error.
test('a system predicate can be neither dropped nor updated, and says why', () => {
  renderPanel({ predicate: 'dgraph.type', type: 'string' })

  expect(dropButton()).toBeDisabled()
  expect(updateButton()).toBeDisabled()
  expect(
    screen.getByText(/Dgraph manages this predicate\. It cannot be modified/),
  ).toBeInTheDocument()
})

test('every predicate Dgraph manages is recognised', () => {
  for (const predicate of [
    'dgraph.drop.op',
    'dgraph.graphql.schema',
    'dgraph.namespace.id',
    'dgraph.xid',
  ]) {
    const { unmount } = renderPanel({ predicate, type: 'string' })
    expect(dropButton()).toBeDisabled()
    expect(updateButton()).toBeDisabled()
    unmount()
  }
})

// A `schema {}` query returns bare names, so this panel never sees a namespace
// prefix — and "a-dgraph.type" is a predicate a user may create and change.
// Treating it as reserved would lock a predicate the server will happily alter.
test('a user predicate that looks namespaced stays editable', () => {
  renderPanel({ predicate: 'a-dgraph.type', type: 'string' })

  expect(dropButton()).toBeEnabled()
  expect(screen.queryByText(/Dgraph manages this predicate/)).toBeNull()
})
