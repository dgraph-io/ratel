/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'

export default function SchemaDropDataModal({
  executeQuery,
  onAfterDropData,
  onCancel,
}) {
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [dropSchema, setDropSchema] = useState(false)

  async function handleDropData() {
    setLoading(true)
    setErrorMsg('')

    const command = dropSchema
      ? JSON.stringify({ drop_all: true })
      : JSON.stringify({ drop_op: 'DATA' })

    try {
      await executeQuery(command, 'alter', true)
      onAfterDropData()
    } catch (error) {
      setErrorMsg(`Could not drop all: ${error?.message}`)
    } finally {
      setLoading(false)
    }
  }

  const safetyString = dropSchema ? 'DROP ALL' : 'DROP DATA'
  const isLocked = () => inputValue.trim() !== safetyString

  const icon = <i className={'fas ' + (isLocked() ? 'fa-lock' : 'fa-unlock')} />

  return (
    <Modal show={true} onHide={onCancel}>
      <Modal.Header closeButton>
        <Modal.Title>Drop Data</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to delete all of your data?
        <br />
        You{' '}
        <strong>
          <em>will not</em>
        </strong>{' '}
        be able to restore your data once it has been deleted.
        <Form.Group controlId='formBasicCheckbox'>
          <Form.Check
            checked={dropSchema}
            onChange={() => setDropSchema(!dropSchema)}
            label='Also drop Schema and Types'
          />
        </Form.Group>
        <Form.Group>
          <Form.Text>
            To proceed, please type "{safetyString}" in the text field below.
          </Form.Text>
          <Form.Control
            type='text'
            placeholder={safetyString}
            onChange={({ target: { value } }) => setInputValue(value)}
            disabled={loading}
            value={inputValue}
          />
        </Form.Group>
        {!errorMsg ? null : (
          <div className='alert alert-danger'>{errorMsg}</div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant='danger'
          disabled={loading || isLocked()}
          onClick={() => handleDropData(dropSchema)}
        >
          {icon}
          &nbsp;
          {loading ? 'Dropping All...' : 'Drop All'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
