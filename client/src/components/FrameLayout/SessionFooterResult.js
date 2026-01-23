/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import pluralize from 'pluralize'
import React from 'react'

export default function SessionFooterResult({ currentTab, response }) {
  const currentAction = currentTab === 'graph' ? 'Showing' : 'Found'

  return (
    <div className='row'>
      <div className='col-12'>
        <span className='result-message'>
          {currentAction} <span className='value'>{response.nodes.length}</span>{' '}
          {pluralize('node', response.nodes.length)} and{' '}
          <span className='value'>{response.edges.length}</span>{' '}
          {pluralize('edge', response.edges.length)}
        </span>
      </div>
    </div>
  )
}
