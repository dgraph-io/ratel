/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import { useDispatch, useSelector } from 'react-redux'

import { updateZeroUrl } from 'actions/connection'
import { humanizeBytes, sanitizeUrl } from 'lib/helpers'
import { getSpace } from 'lib/utils'

import ZeroRequestResult, { fetchZeroEndpoint } from './ZeroRequestResult'

export default function MoveTabletModal({ fromGroup, tablet, groups, onHide }) {
  const currentServer = useSelector(
    (state) => state.connection.serverHistory[0],
  )

  const [zeroUrlInput, setZeroUrl] = useState(
    currentServer.zeroUrl || 'http://localhost:6080',
  )

  const [targetGroup, setTargetGroup] = useState(
    Object.keys(groups)[0] !== fromGroup
      ? Object.keys(groups)[0]
      : Object.keys(groups)[1],
  )
  const [actionStarted, setActionStarted] = useState(false)
  const [requestResult, setRequestResult] = useState(undefined)

  const dispatch = useDispatch()
  const saneZeroUrl = sanitizeUrl(zeroUrlInput)

  useEffect(() => {
    dispatch(updateZeroUrl(saneZeroUrl))
  }, [saneZeroUrl, dispatch])

  // /moveTablet?tablet=name&group=2
  // tablet keys are in format "namespace-predicate", strip the namespace prefix
  const tabletName = tablet.replace(/^\d+-/, '')
  const getUrl = () =>
    `${sanitizeUrl(zeroUrlInput)}/moveTablet?tablet=${encodeURIComponent(
      tabletName,
    )}&group=${targetGroup}`

  const executeRequest = async () => {
    setActionStarted(true)
    setRequestResult({ pending: true })
    setRequestResult(
      await fetchZeroEndpoint(getUrl(), currentServer.zeroAuthToken),
    )
  }

  const humanizeGroupSize = (group) => {
    const space = Object.values(group.tablets || {}).reduce(
      (acc, t) => acc + parseInt(getSpace(t) || 0),
      0,
    )
    return space ? ` (${humanizeBytes(space)})` : ''
  }

  const canRetry =
    !actionStarted ||
    (requestResult && !requestResult.pending && !requestResult.ok)

  return (
    <Modal centered show={true} size='md' onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Move Tablet to a different Group</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Move tablet <strong>{tablet}</strong> from group{' '}
          <strong>#{fromGroup}</strong>
        </p>

        <Form.Group controlId='targetGroupInput'>
          <Form.Label>New Group:</Form.Label>
          <Form.Control
            as='select'
            onChange={(e) => setTargetGroup(e.target.value)}
            value={targetGroup}
          >
            {Object.keys(groups).map((k) => (
              <option key={k} value={k} disabled={k === fromGroup}>
                {k}
                {humanizeGroupSize(groups[k])}
                {k === fromGroup ? ' (current group of this tablet)' : ''}
              </option>
            ))}
          </Form.Control>
        </Form.Group>
        <hr />
        <Form.Group controlId='zeroUrlInput'>
          <Form.Label>Dgraph Zero URL:</Form.Label>
          <Form.Control
            type='text'
            placeholder='http://myzero:6080'
            value={zeroUrlInput}
            onChange={(e) => setZeroUrl(e.target.value)}
          />
        </Form.Group>
        <Form.Label>
          <br />
          Command URL:
          <br />
          <strong>{getUrl()}</strong>
        </Form.Label>
        {actionStarted && <ZeroRequestResult result={requestResult} />}
      </Modal.Body>
      <Modal.Footer>
        {canRetry && (
          <Button
            onClick={() => {
              if (
                !window.confirm(
                  `Are you sure you want to move tablet ${tablet} to group ${targetGroup}?`,
                )
              ) {
                return
              }

              executeRequest()
            }}
            variant='secondary'
            className='pull-right'
            disabled={!targetGroup || fromGroup === targetGroup}
          >
            {actionStarted ? 'Retry' : 'Move Tablet'}
          </Button>
        )}
        {actionStarted && (
          <Button onClick={onHide} variant='primary' className='pull-right'>
            Close
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  )
}
