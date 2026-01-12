/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton'

import {
  fetchSavedQueries,
  selectSavedQuery,
  deleteSavedQuery,
  openSaveModal,
} from 'actions/savedQueries'

import './SavedQueriesDropdown.scss'

export default function SavedQueriesDropdown() {
  const dispatch = useDispatch()
  const { enabled, loading, queries, deleting } = useSelector(
    (state) => state.savedQueries,
  )
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    dispatch(fetchSavedQueries())
  }, [dispatch])

  // Don't render if not enabled
  if (!enabled) {
    return null
  }

  // Group queries by category
  const categories = queries.reduce((acc, query) => {
    const category = query.category || 'General'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(query)
    return acc
  }, {})

  const handleSelect = (e, query) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(selectSavedQuery(query))
  }

  const handleEdit = (e, query) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(openSaveModal(query))
  }

  const handleDeleteClick = (e, query) => {
    e.preventDefault()
    e.stopPropagation()
    setConfirmDelete(query.id)
  }

  const handleDeleteConfirm = (e, query) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(deleteSavedQuery(query.id))
    setConfirmDelete(null)
  }

  const handleDeleteCancel = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setConfirmDelete(null)
  }

  const hasQueries = queries.length > 0

  return (
    <DropdownButton
      id='saved-queries-dropdown'
      className='action actionable saved-queries-dropdown'
      title={
        <>
          <i className='fas fa-bookmark' /> Saved
        </>
      }
      disabled={loading}
    >
      {!hasQueries && (
        <Dropdown.Item disabled>
          <em>No saved queries</em>
        </Dropdown.Item>
      )}
      {Object.entries(categories).map(([category, categoryQueries], idx) => (
        <React.Fragment key={category}>
          {idx > 0 && <Dropdown.Divider />}
          <Dropdown.Header>{category}</Dropdown.Header>
          {categoryQueries.map((query) => (
            <Dropdown.Item
              key={query.id}
              className='saved-query-item'
              title={query.description}
              as='div'
            >
              {confirmDelete === query.id ? (
                <div className='delete-confirm'>
                  <span>Delete?</span>
                  <button
                    className='btn-confirm'
                    onClick={(e) => handleDeleteConfirm(e, query)}
                    disabled={deleting === query.id}
                  >
                    Yes
                  </button>
                  <button
                    className='btn-cancel'
                    onClick={handleDeleteCancel}
                  >
                    No
                  </button>
                </div>
              ) : (
                <>
                  <span
                    className='query-name'
                    onClick={(e) => handleSelect(e, query)}
                  >
                    <i
                      className={
                        query.action === 'mutate'
                          ? 'fas fa-edit'
                          : 'fas fa-search'
                      }
                    />{' '}
                    {query.name}
                  </span>
                  <span className='query-actions'>
                    <button
                      className='btn-edit'
                      onClick={(e) => handleEdit(e, query)}
                      title='Edit query'
                    >
                      <i className='fas fa-pencil-alt' />
                    </button>
                    <button
                      className='btn-delete'
                      onClick={(e) => handleDeleteClick(e, query)}
                      title='Delete query'
                    >
                      <i className='fas fa-trash' />
                    </button>
                  </span>
                </>
              )}
            </Dropdown.Item>
          ))}
        </React.Fragment>
      ))}
    </DropdownButton>
  )
}
