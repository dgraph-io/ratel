/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import 'core-js/stable'
import 'regenerator-runtime/runtime'

import React from 'react'
import ReactDOM from 'react-dom'

import App from './containers/App'
import AppProvider from './containers/AppProvider'

window.FontAwesomeConfig = { autoReplaceSvg: 'nest' }
require('@fortawesome/fontawesome-free/js/all.min.js')

export function render(Component) {
  return ReactDOM.render(
    <AppProvider component={Component} />,
    document.getElementById('root') || document.createElement('div'),
  )
}

render(App)

if (module.hot) {
  window.RATEL_DEV_MODE = true
  module.hot.accept('./containers/App', () => {
    const nextApp = require('./containers/App').default
    render(nextApp)
  })
}
