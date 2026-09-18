/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'

/*
 * Stops a render error in one panel from taking the whole of Ratel with it.
 *
 * Without a boundary anywhere in the tree, any uncaught throw during render
 * unmounts the entire app and leaves a blank page — and because the query and
 * frame list are persisted, reloading replays whatever caused it, so the only
 * way out is clearing browser storage and losing all query history. That is
 * what #381 was: one deleted character in a geo query.
 *
 * Pass a resetKey that changes when the user has plausibly moved on — the
 * active tab, the query being viewed — or the panel stays broken after they
 * fix the thing that broke it, since a boundary has no reason of its own to
 * retry rendering.
 */
export default class ErrorBoundary extends React.Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    // Nothing collects these centrally yet, so the console is where a bug
    // report's stack trace has to come from.
    console.error('Error while rendering:', error, errorInfo?.componentStack)
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render() {
    const { error } = this.state
    if (!error) {
      return this.props.children
    }

    return (
      <React.Fragment>
        <div className='text-content'>
          <p>
            <strong>Something went wrong displaying this result.</strong>
          </p>
          <p>
            The rest of Ratel is still working — switch tabs or change the query
            to carry on. If the query looks incomplete, finishing it will
            usually clear this.
          </p>
          <hr />
          <p>
            <strong>Error:</strong> {error.message || String(error)}
          </p>
          {error.stack ? <pre>{error.stack}</pre> : null}
        </div>

        <div className='footer error-footer'>
          <i className='fas fa-exclamation-triangle error-mark' />{' '}
          <span className='result-message'>Error occurred</span>
        </div>
      </React.Fragment>
    )
  }
}
