/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'

import App from './containers/App'
import AppProvider from './containers/AppProvider'

// This deliberately does not import './index'. That module calls render(App)
// at module scope, so importing it mounts the app as a side effect, and the
// app's health-check retry loops then outlive the jest environment: a late
// dispatch makes React commit against a torn-down document and kills the whole
// run with "Cannot read properties of null (reading 'body')". Testing Library
// unmounts after each test, which leaves those loops with no subscriber to
// notify.

// CodeMirror reaches for the legacy createTextRange API, which jsdom lacks.
document.body.createTextRange = () => ({
  getBoundingClientRect: () => ({ right: 0 }),
  getClientRects: () => ({
    left: 0,
    length: 0,
    right: 0,
  }),
  setEnd: () => {},
  setStart: () => {},
})

test('App mounts and renders the sidebar', async () => {
  render(<AppProvider component={App} />)

  // The sidebar only appears once redux-persist has rehydrated the store, so
  // this also covers AppProvider's startup path rather than just a sync throw.
  expect(
    await screen.findByText('Console', {}, { timeout: 15000 }),
  ).toBeInTheDocument()
}, 30000)
