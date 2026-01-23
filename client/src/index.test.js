/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import jsdom from 'jsdom'
import React from 'react'

import App from './containers/App'
import AppProvider from './containers/AppProvider'

import { render } from './index'

const document = new jsdom.JSDOM('<!doctype html><html><body></body></html>')
global.document = document
global.window = document.defaultView
global.document.body.createTextRange = () => ({
  getBoundingClientRect: () => ({ right: 0 }),
  getClientRects: () => ({
    left: 0,
    length: 0,
    right: 0,
  }),
  setEnd: () => {},
  setStart: () => {},
})

test('Creating AppProvider should not throw errors', () => {
  expect(<AppProvider component={App} />).toBeTruthy()
})

test('Rendering App should not throw errors', (done) => {
  render(App)
  setTimeout(done, 2)
})
