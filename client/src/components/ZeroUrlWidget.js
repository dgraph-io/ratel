/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react'
import Form from 'react-bootstrap/Form'
import { useDispatch, useSelector } from 'react-redux'

import { updateZeroAuthToken, updateZeroUrl } from 'actions/connection'

export default function ZeroUrlWidget() {
  const currentServer = useSelector(
    (state) => state.connection.serverHistory[0],
  )
  const dispatch = useDispatch()

  const [zeroUrl, setZeroUrl] = useState(currentServer.zeroUrl)
  const [zeroAuthToken, setZeroAuthToken] = useState(
    currentServer.zeroAuthToken || '',
  )

  // Reset the inputs when the active server changes while this tab stays
  // mounted — otherwise the previous server's values linger and typing
  // would write them onto the new server's record. Keyed on url alone:
  // syncing on the value fields would clobber in-progress typing, since
  // the reducer stores a sanitized form of the url.
  useEffect(() => {
    setZeroUrl(currentServer.zeroUrl)
    setZeroAuthToken(currentServer.zeroAuthToken || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentServer.url])

  return (
    <Form onSubmit={(e) => e.preventDefault()}>
      <Form.Group controlId='zeroUrl'>
        <Form.Label>Dgraph Zero URL:</Form.Label>
        <Form.Control
          type='text'
          placeholder='http://myzero:6080'
          value={zeroUrl}
          onChange={(e) => {
            setZeroUrl(e.target.value)
            dispatch(updateZeroUrl(e.target.value))
          }}
          style={{
            width: '100%',
          }}
        />
      </Form.Group>
      <Form.Group controlId='zeroAuthToken'>
        <Form.Label>Zero Auth Token (optional):</Form.Label>
        <Form.Control
          type='password'
          autoComplete='off'
          placeholder='Token from Zero --security flag'
          value={zeroAuthToken}
          onChange={(e) => {
            setZeroAuthToken(e.target.value)
            dispatch(updateZeroAuthToken(e.target.value))
          }}
          style={{
            width: '100%',
          }}
        />
        <Form.Text className='text-muted'>
          Sent as the X-Dgraph-AuthToken header on Zero admin requests (move
          tablet, remove node). Required when Zero is running with a --security
          token and this browser&apos;s machine is not in its IP whitelist.
        </Form.Text>
      </Form.Group>
    </Form>
  )
}
