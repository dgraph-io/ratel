/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
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
    currentType: null, // Track type changes from form
    cachedIndexSpecs: null, // Cache index_specs for restoration
  }

  componentDidMount() {
    const { predicate } = this.props
    this.setState({
      currentType: predicate.type,
      cachedIndexSpecs: predicate.index_specs,
    })
  }

  componentDidUpdate(prevProps) {
    // Reset when a different predicate is selected
    if (prevProps.predicate?.predicate !== this.props.predicate?.predicate) {
      this.setState({
        currentType: this.props.predicate.type,
        cachedIndexSpecs: this.props.predicate.index_specs,
      })
    }
  }

  handleTypeChange = (newType) => {
    this.setState({ currentType: newType })
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

  renderIndexSpecs() {
    const { currentType, cachedIndexSpecs } = this.state
    if (
      currentType !== 'float32vector' ||
      !cachedIndexSpecs ||
      cachedIndexSpecs.length === 0
    ) {
      return null
    }

    return (
      <div className='col-sm-12 mt-3 mb-3'>
        <h6>Vector Index Options</h6>
        {cachedIndexSpecs.map((spec, idx) => (
          <div key={idx} className='card card-body bg-light p-2'>
            <strong>{spec.name}</strong>
            {spec.options && spec.options.length > 0 && (
              <table className='table-sm table-borderless mt-1 mb-0 table'>
                <tbody>
                  {spec.options.map((opt) => (
                    <tr key={opt.key}>
                      <td style={{ width: '40%', color: '#666' }}>{opt.key}</td>
                      <td>{opt.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
        <small className='text-muted'>
          Changing HNSW indexing options is only supported in the Bulk Edit
          dialog.
        </small>
      </div>
    )
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
            onChangeType={this.handleTypeChange}
          />
          {this.renderIndexSpecs()}
          {this.state.currentType === 'float32vector' &&
            this.props.predicate.type !== 'float32vector' && (
              <div className='alert alert-info'>
                Creating HNSW-based vector indexes is only supported in the Bulk
                Edit dialog.
              </div>
            )}
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
