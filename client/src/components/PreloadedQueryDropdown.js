/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton'

import {
  fetchPreloadedQueries,
  selectPreloadedQuery,
} from 'actions/preloadedQueries'

export default function PreloadedQueryDropdown() {
  const dispatch = useDispatch()
  const { enabled, loading, queries } = useSelector(
    (state) => state.preloadedQueries,
  )

  useEffect(() => {
    dispatch(fetchPreloadedQueries())
  }, [dispatch])

  if (!enabled || queries.length === 0) {
    return null
  }

  // Group queries by category
  const categories = queries.reduce((acc, query) => {
    const category = query.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(query)
    return acc
  }, {})

  const handleSelect = (query) => {
    dispatch(selectPreloadedQuery(query))
  }

  return (
    <DropdownButton
      id='preloaded-queries-dropdown'
      className='action actionable'
      title={
        <>
          <i className='fas fa-file-code' /> Templates
        </>
      }
      disabled={loading}
    >
      {Object.entries(categories).map(([category, categoryQueries], idx) => (
        <React.Fragment key={category}>
          {idx > 0 && <Dropdown.Divider />}
          <Dropdown.Header>{category}</Dropdown.Header>
          {categoryQueries.map((query) => (
            <Dropdown.Item
              key={query.name}
              onClick={() => handleSelect(query)}
              title={query.description}
            >
              <i
                className={
                  query.action === 'mutate' ? 'fas fa-edit' : 'fas fa-search'
                }
              />{' '}
              {query.name}
            </Dropdown.Item>
          ))}
        </React.Fragment>
      ))}
    </DropdownButton>
  )
}
