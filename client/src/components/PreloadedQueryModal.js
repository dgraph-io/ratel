/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'

import {
  closeVariableModal,
  updateVariableValue,
  runPreloadedQuery,
} from 'actions/preloadedQueries'

import './PreloadedQueryModal.scss'

export default function PreloadedQueryModal() {
  const dispatch = useDispatch()
  const { showVariableModal, selectedQuery, variableValues } = useSelector(
    (state) => state.preloadedQueries,
  )

  const [errors, setErrors] = useState({})

  if (!showVariableModal || !selectedQuery) {
    return null
  }

  const validate = () => {
    const newErrors = {}
    selectedQuery.variables.forEach((v) => {
      if (v.required && !variableValues[v.name]) {
        newErrors[v.name] = `${v.label || v.name} is required`
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRun = () => {
    if (!validate()) {
      return
    }
    dispatch(runPreloadedQuery())
  }

  const handleCancel = () => {
    setErrors({})
    dispatch(closeVariableModal())
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleRun()
    }
  }

  return (
    <Modal
      show={true}
      onHide={handleCancel}
      className='preloaded-query-modal'
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <i className='fas fa-file-code' /> {selectedQuery.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedQuery.description && (
          <p className='text-muted mb-3'>{selectedQuery.description}</p>
        )}

        <Form onKeyDown={handleKeyDown}>
          {selectedQuery.variables.map((variable) => (
            <Form.Group key={variable.name} className='mb-3'>
              <Form.Label>
                {variable.label || variable.name}
                {variable.required && <span className='text-danger'>*</span>}
              </Form.Label>
              <Form.Control
                type={
                  variable.type === 'int' || variable.type === 'float'
                    ? 'number'
                    : 'text'
                }
                placeholder={variable.placeholder || ''}
                value={variableValues[variable.name] || ''}
                onChange={(e) =>
                  dispatch(updateVariableValue(variable.name, e.target.value))
                }
                isInvalid={!!errors[variable.name]}
                autoFocus={
                  selectedQuery.variables.indexOf(variable) === 0
                }
              />
              {variable.description && (
                <Form.Text className='text-muted'>
                  {variable.description}
                </Form.Text>
              )}
              <Form.Control.Feedback type='invalid'>
                {errors[variable.name]}
              </Form.Control.Feedback>
            </Form.Group>
          ))}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant='primary' onClick={handleRun}>
          <i className='fa fa-play' /> Run Query
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
