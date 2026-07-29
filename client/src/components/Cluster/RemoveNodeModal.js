/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import { useDispatch, useSelector } from 'react-redux'

import { updateZeroAuthToken, updateZeroUrl } from 'actions/connection'
import { sanitizeUrl } from 'lib/helpers'

import ZeroRequestResult, { fetchZeroEndpoint } from './ZeroRequestResult'

export default function RemoveNodeModal({ groupId, nodeId, onHide }) {
  const currentServer = useSelector(
    (state) => state.connection.serverHistory[0],
  )

  const [zeroUrlInput, setZeroUrl] = useState(
    currentServer.zeroUrl || 'http://localhost:6080',
  )
  const [zeroAuthTokenInput, setZeroAuthToken] = useState(
    currentServer.zeroAuthToken || '',
  )

  const dispatch = useDispatch()
  const saneZeroUrl = sanitizeUrl(zeroUrlInput)

  useEffect(() => {
    dispatch(updateZeroUrl(saneZeroUrl))
  }, [saneZeroUrl, dispatch])

  useEffect(() => {
    dispatch(updateZeroAuthToken(zeroAuthTokenInput))
  }, [zeroAuthTokenInput, dispatch])

  const [removalStarted, setRemovalStarted] = useState(false)
  const [requestResult, setRequestResult] = useState(undefined)

  const getUrl = () =>
    `${sanitizeUrl(zeroUrlInput)}/removeNode?id=${nodeId}&group=${groupId}`

  const executeRequest = async () => {
    setRemovalStarted(true)
    setRequestResult({ pending: true })
    setRequestResult(await fetchZeroEndpoint(getUrl(), zeroAuthTokenInput))
  }

  const canRetry =
    !removalStarted ||
    (requestResult && !requestResult.pending && !requestResult.ok)

  return (
    <Modal centered show={true} size='md' onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Remove node from Cluster</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Remove node <strong>#{nodeId}</strong> from group{' '}
          <strong>#{groupId}</strong>
        </p>
        <Form.Group controlId='zeroUrlInput'>
          <Form.Label>Dgraph Zero URL:</Form.Label>
          <Form.Control
            type='text'
            placeholder='http://myzero:6080'
            value={zeroUrlInput}
            onChange={(e) => setZeroUrl(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId='zeroAuthTokenInput'>
          <Form.Label>Zero Auth Token (optional):</Form.Label>
          <Form.Control
            type='password'
            autoComplete='off'
            placeholder='Token from Zero --security flag'
            value={zeroAuthTokenInput}
            onChange={(e) => setZeroAuthToken(e.target.value)}
          />
          <Form.Text className='text-muted'>
            Sent as the X-Dgraph-AuthToken header. Required when Zero is running
            with a --security token and this machine is not in its IP whitelist.
          </Form.Text>
        </Form.Group>
        <Form.Label>
          <br />
          Removal URL:
          <br />
          <strong>{getUrl()}</strong>
        </Form.Label>
        {removalStarted && <ZeroRequestResult result={requestResult} />}
      </Modal.Body>
      <Modal.Footer>
        {canRetry && (
          <Button
            onClick={() => {
              if (
                !window.confirm(
                  `Are you sure you want to remove node #${nodeId}? This operation cannot be undone`,
                )
              ) {
                return
              }
              if (
                !window.confirm(
                  `This is really dangerous. Second confirmation required.\nReally remove node #${nodeId}?`,
                )
              ) {
                return
              }
              executeRequest()
            }}
            variant='danger'
            className='pull-right'
          >
            {removalStarted ? 'Retry' : 'Remove Node'}
          </Button>
        )}
        {removalStarted && (
          <Button onClick={onHide} variant='primary' className='pull-right'>
            Close
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  )
}
