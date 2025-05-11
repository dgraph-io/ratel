/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'
import Button from 'react-bootstrap/Button'

import { getPredicateQuery } from 'lib/dgraph-syntax'
import SchemaPredicateForm from './SchemaPredicateForm'

export default class PredicatePropertiesPanel extends React.Component {
  predicateForm = React.createRef()

  state = {
    updating: false,
    deleting: false,
    errorMsg: '',
    predicateQuery: null,
  }

  async handleUpdatePredicate() {
    const { executeQuery, onAfterUpdate } = this.props

    this.setState({
      errorMsg: '',
      updating: true,
    })

    try {
      await executeQuery(this.state.predicateQuery, 'alter')
      onAfterUpdate()
    } catch (errorMessage) {
      this.setState({
        errorMsg: `Could not alter predicate: ${errorMessage}`,
      })
    } finally {
      this.setState({ updating: false })
    }
  }

  async handleDropPredicate() {
    const { executeQuery, onAfterDrop, predicate } = this.props

    if (!window.confirm('Are you sure?\nThis action will destroy data!')) {
      return
    }

    if (
      !window.confirm(
        `Please confirm you *really* want to DROP\n"${predicate.predicate}".\nThis cannot be undone!`,
      )
    ) {
      return
    }

    this.setState({
      errorMsg: '',
      deleting: true,
    })

    try {
      await executeQuery(
        JSON.stringify({ drop_attr: predicate.predicate }),
        'alter',
      )
      onAfterDrop()
    } catch (errorMessage) {
      this.setState({
        errorMsg: `Could not drop predicate: ${errorMessage}`,
      })
    } finally {
      this.setState({ deleting: false })
    }
  }

  render() {
    const { deleting, errorMsg, predicateQuery, updating } = this.state
    const { predicate } = this.props
    const predicateForm = this.predicateForm.current

    const canUpdate =
      predicateForm &&
      getPredicateQuery(predicate) !== predicateQuery &&
      !predicateForm.hasErrors()

    return (
      <div>
        <div className='col-sm-12 mt-2'>
          <SchemaPredicateForm
            createMode={false}
            clickedSubmit={true}
            ref={this.predicateForm}
            predicate={predicate}
            onChangeQuery={(predicateQuery) =>
              this.setState({ predicateQuery })
            }
          />
          {!errorMsg ? null : (
            <div className='alert alert-danger'>{errorMsg}</div>
          )}
          {!predicateQuery ? null : (
            <div className='form-group'>
              <div className='col-sm-12' style={{ color: '#666' }}>
                New schema string:&nbsp;
                <span style={{ fontStyle: 'italic' }}>{predicateQuery}</span>
              </div>
            </div>
          )}
        </div>
        <div
          className='btn-toolbar justify-content-between col-sm-12'
          role='toolbar'
          aria-label='Operations on the selected predicate'
        >
          <Button
            variant='danger'
            onClick={() => this.handleDropPredicate()}
            disabled={updating || deleting}
          >
            {deleting ? 'Dropping...' : 'Drop'}
          </Button>{' '}
          <Button
            variant='primary'
            className='float-right'
            onClick={() => this.handleUpdatePredicate()}
            disabled={!canUpdate || updating || deleting}
          >
            {updating ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </div>
    )
  }
}
