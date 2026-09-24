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

test('the namespaced form of a system predicate is recognised too', () => {
  renderPanel({ predicate: '0-dgraph.graphql.schema', type: 'string' })

  expect(dropButton()).toBeDisabled()
  expect(updateButton()).toBeDisabled()
})

// The namespace is hex, so a tenant past namespace 9 gets a letter prefix.
test('a system predicate in a non-root namespace is recognised', () => {
  renderPanel({ predicate: 'a-dgraph.xid', type: 'string' })

  expect(dropButton()).toBeDisabled()
  expect(updateButton()).toBeDisabled()
})
