/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'

// Calls a Dgraph Zero admin endpoint (e.g. /moveTablet, /removeNode),
// attaching the X-Dgraph-AuthToken header when a token is configured.
// Returns a result object for <ZeroRequestResult />.
export async function fetchZeroEndpoint(url, authToken) {
  const headers = {}
  if (authToken) {
    headers['X-Dgraph-AuthToken'] = authToken
  }
  try {
    const res = await fetch(url, { headers })
    const text = await res.text()
    return { ok: res.ok, status: res.status, text }
  } catch (err) {
    return { ok: false, text: err.message || String(err) }
  }
}

export default function ZeroRequestResult({ result }) {
  if (!result) {
    return null
  }

  const backgroundColor = result.pending
    ? 'rgba(30, 96, 119, 0.25)'
    : result.ok
      ? 'rgba(30, 119, 60, 0.25)'
      : 'rgba(119, 30, 30, 0.25)'

  return (
    <div style={{ backgroundColor, borderRadius: '4px', padding: '8px' }}>
      {result.pending ? (
        'Sending request...'
      ) : (
        <>
          <strong>
            {result.status ? `HTTP ${result.status}` : 'Request failed'}
          </strong>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              marginBottom: 0,
            }}
          >
            {result.text}
          </pre>
        </>
      )}
    </div>
  )
}
