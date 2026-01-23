/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'

// CollapseQuery replaces deeply nested blocks in a query with ellipsis.
export function collapseQuery(query) {
  const depthLimit = 3
  let ret = ''
  let depth = 0

  for (let i = 0; i < query.length; i++) {
    const char = query[i]

    if (char === '{') {
      depth++

      if (depth === depthLimit) {
        ret += char
        ret += ' ... '
        continue
      }
    } else if (char === '}') {
      depth--
    }

    if (depth >= depthLimit) {
      continue
    }

    ret += char
  }

  return ret
}

export default function QueryPreview({
  frameId,
  action,
  hasError,
  onClick,
  query,
}) {
  return (
    <div className='query-row' onClick={onClick}>
      <i
        className={
          action === 'query'
            ? 'fa fa-search query-icon'
            : 'far fa-edit query-icon'
        }
      />
      {!hasError ? null : (
        <React.Fragment>
          <i className='extra-icon fas fa-circle' style={{ color: '#fff' }} />
          <i className='extra-icon fas fa-times-circle' />
        </React.Fragment>
      )}{' '}
      <span className='preview'>{collapseQuery(query)}</span>
    </div>
  )
}
