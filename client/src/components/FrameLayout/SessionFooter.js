/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'

import SessionFooterProperties from './SessionFooterProperties'
import SessionFooterResult from './SessionFooterResult'

// TODO: this component isn't used at the moment. Maybe delete.

export default function SessionFooter({
  response,
  currentTab,
  hoveredNode,
  selectedNode,
}) {
  return (
    <div className='footer'>
      {selectedNode || hoveredNode ? (
        <SessionFooterProperties entity={selectedNode || hoveredNode} />
      ) : (
        <SessionFooterResult currentTab={currentTab} response={response} />
      )}
    </div>
  )
}
