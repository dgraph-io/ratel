/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'

import {
  closeSaveModal,
  updateSaveForm,
  saveCurrentQuery,
} from 'actions/savedQueries'

import './SaveQueryModal.scss'

export default function SaveQueryModal() {
  const dispatch = useDispatch()
  const { showSaveModal, editingQuery, saveForm, saving, saveError, queries } =
    useSelector((state) => state.savedQueries)

  if (!showSaveModal) {
    return null
  }

  const isEditing = editingQuery !== null

  // Get unique categories from existing queries for suggestions
  const existingCategories = [
    ...new Set(queries.map((q) => q.category).filter(Boolean)),
  ].sort()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await dispatch(saveCurrentQuery())
    } catch (err) {
      // Error is handled by reducer
    }
  }

  const handleCancel = () => {
    dispatch(closeSaveModal())
  }

  const handleChange = (field) => (e) => {
    dispatch(updateSaveForm(field, e.target.value))
  }

  const isValid = saveForm.name.trim() && saveForm.query.trim()

  return (
    <Modal
      show={true}
      onHide={handleCancel}
      className='save-query-modal'
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <i className='fas fa-bookmark' />{' '}
          {isEditing ? 'Edit Saved Query' : 'Save Query'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {saveError && <Alert variant='danger'>{saveError}</Alert>}

          <Form.Group className='mb-3'>
            <Form.Label>
              Name <span className='text-danger'>*</span>
            </Form.Label>
            <Form.Control
              type='text'
              placeholder='e.g., Get all users'
              value={saveForm.name}
              onChange={handleChange('name')}
              autoFocus
            />
          </Form.Group>

          <Form.Group className='mb-3'>
            <Form.Label>Category</Form.Label>
            <Form.Control
              type='text'
              list='category-suggestions'
              placeholder='e.g., Users, Admin, Reports'
              value={saveForm.category}
              onChange={handleChange('category')}
            />
            <datalist id='category-suggestions'>
              {existingCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
            <Form.Text className='text-muted'>
              Used to group queries in the dropdown
            </Form.Text>
          </Form.Group>

          <Form.Group className='mb-3'>
            <Form.Label>Description</Form.Label>
            <Form.Control
              as='textarea'
              rows={2}
              placeholder='Optional description of what this query does'
              value={saveForm.description}
              onChange={handleChange('description')}
            />
          </Form.Group>

          <Form.Group className='mb-3'>
            <Form.Label>Type</Form.Label>
            <div>
              <Form.Check
                inline
                type='radio'
                id='type-query'
                label='Query'
                checked={saveForm.action === 'query'}
                onChange={() => dispatch(updateSaveForm('action', 'query'))}
              />
              <Form.Check
                inline
                type='radio'
                id='type-mutate'
                label='Mutation'
                checked={saveForm.action === 'mutate'}
                onChange={() => dispatch(updateSaveForm('action', 'mutate'))}
              />
            </div>
          </Form.Group>

          <Form.Group className='mb-3'>
            <Form.Label>
              Query <span className='text-danger'>*</span>
            </Form.Label>
            <Form.Control
              as='textarea'
              rows={6}
              className='query-textarea'
              value={saveForm.query}
              onChange={handleChange('query')}
              placeholder='{ ... }'
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type='submit' variant='primary' disabled={!isValid || saving}>
            {saving ? (
              <>
                <i className='fas fa-spinner fa-spin' /> Saving...
              </>
            ) : (
              <>
                <i className='fas fa-save' /> {isEditing ? 'Update' : 'Save'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
