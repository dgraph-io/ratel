/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import SchemaPredicateForm from './SchemaPredicateForm'

export default class SchemaPredicateModal extends React.Component {
  constructor(props) {
    super(props)

    this.predicateForm = React.createRef()

    this.state = {
      updating: false,
      deleting: false,
      clickedSubmit: false,
      errorMsg: '',
      predicateQuery: null,
    }
  }

  async handleUpdatePredicate() {
    const { executeQuery, onAfterUpdate } = this.props

    this.setState({
      clickedSubmit: true,
      errorMsg: '',
      updating: true,
    })

    try {
      await executeQuery(this.state.predicateQuery, 'alter', true)
      onAfterUpdate()
    } catch (error) {
      this.setState({
        errorMsg: `Could not alter schema: ${error?.message}`,
      })
    } finally {
      this.setState({ updating: false })
    }
  }

  render() {
    const { predicate, onCancel } = this.props
    const { updating, clickedSubmit, errorMsg, predicateQuery } = this.state

    const predicateForm = this.predicateForm.current
    const canUpdate = predicateForm && !predicateForm.hasErrors()

    return (
      <Modal show={true} onHide={onCancel}>
        <Modal.Header closeButton>
          <Modal.Title>Add Predicate</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SchemaPredicateForm
            createMode={true}
            clickedSubmit={clickedSubmit}
            ref={this.predicateForm}
            predicate={predicate}
            onChangeQuery={(predicateQuery) =>
              this.setState({ predicateQuery })
            }
          />
          {!errorMsg ? null : (
            <div className='alert alert-danger'>{errorMsg}</div>
          )}
          {!predicateForm ? null : (
            <div className='form-group clearfix'>
              <label className='control-label col-sm-3' />
              <div className='col-sm-9' style={{ color: '#666' }}>
                Schema string:&nbsp;
                <span style={{ fontStyle: 'italic' }}>{predicateQuery}</span>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant='primary'
            onClick={() => this.handleUpdatePredicate()}
            disabled={!canUpdate || updating}
          >
            {updating ? 'Adding...' : 'Add'}
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
