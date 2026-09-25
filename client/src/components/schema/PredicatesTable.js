/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react'

import { isUserPredicate } from 'lib/dgraph-syntax'
import { isSystemPredicate } from 'lib/predicates'
import AutosizeGrid from '../AutosizeGrid'

const SYSTEM_PREDICATE_TITLE =
  "Dgraph's own predicate. It cannot be modified or dropped."

export default function PredicatesTable({
  hideIndices,
  onChangeSelectedPredicate,
  schema,
  selectedPredicate,
  showCheckboxes,
  // Off unless a caller asks for it, so the type editor keeps offering only
  // the predicates a user can put in a type of their own.
  showSystemPredicates = false,
  types = [],
}) {
  const columns = [
    {
      key: 'name',
      name: 'Predicate',
      resizable: true,
      sortable: true,
      // Some of Dgraph's own predicates show up in this list and are
      // indistinguishable from the user's, although nothing here can change
      // them. The cell's value is the predicate name, so the tag can be
      // derived without touching the row data that sorting and selection use.
      formatter: (cell) =>
        isSystemPredicate(cell.value) ? (
          <span
            className='predicate-name system'
            title={SYSTEM_PREDICATE_TITLE}
          >
            <i
              className='fas fa-lock'
              role='img'
              aria-label='Managed by Dgraph'
            />
            {cell.value}
          </span>
        ) : (
          <span className='predicate-name'>{cell.value}</span>
        ),
    },
    {
      key: 'type',
      name: 'Type',
      resizable: true,
      sortable: true,
      formatter: null,
    },
  ]
  if (!hideIndices) {
    columns.push({
      key: 'indices',
      name: 'Indices',
      resizable: true,
      sortable: true,
    })
  }

  if (showCheckboxes) {
    columns.splice(0, 0, {
      key: 'checkbox',
      name: ' ',
      width: 32,
      resizable: true,
      sortable: false,
      formatter: (cell) => (
        <input
          type='checkbox'
          checked={cell.value.value}
          onChange={cell.value.invert}
        />
      ),
    })
  }

  const [sortColumn, setSortColumn] = useState('name')
  const [sortDirection, setSortDirection] = useState('NONE')

  const handleSort = (sortColumn, sortDirection) => {
    setSortColumn(sortColumn)
    setSortDirection(sortDirection)
  }

  const getTypeString = (predicate) => {
    let type = predicate.type
    if (predicate.list) {
      type = '[' + type + ']'
    }
    if (predicate.type === 'string' && predicate.lang) {
      type += ' @lang'
    }
    return type
  }

  const getBadges = (predicate) => {
    const badges = []
    if (predicate.reverse) {
      badges.push({
        title: 'Reverse',
        text: '~',
      })
    }
    if (predicate.count) {
      badges.push({
        title: 'Count',
        text: 'C',
      })
    }
    if (predicate.upsert) {
      badges.push({
        title: 'Upsert',
        text: 'U',
      })
    }
    return badges
  }

  const formatIndexSpecs = (indexSpecs) => {
    // Just show index names in the table column (e.g., "hnsw")
    // Full details are shown in the Properties pane
    return indexSpecs.map((spec) => spec.name).join(', ')
  }

  const createPredicateRow = (predicate, index) => {
    const badges = getBadges(predicate)

    let tokenizers = ''
    // Show tokenizers if indexed, or if float32vector type with index_specs/tokenizers
    const hasIndexSpecs =
      predicate.index_specs && predicate.index_specs.length > 0
    const hasTokenizers = predicate.tokenizer && predicate.tokenizer.length > 0
    if (
      predicate.index ||
      (predicate.type === 'float32vector' && (hasIndexSpecs || hasTokenizers))
    ) {
      if (hasIndexSpecs) {
        // Use structured index_specs when available (float32vector)
        tokenizers = formatIndexSpecs(predicate.index_specs)
      } else {
        predicate.tokenizer.sort()
        tokenizers = predicate.tokenizer.join(', ')
      }
    }

    if (badges.length) {
      const badgesText = badges.map((b) => b.title).join(' ')
      const sortkey = `${tokenizers} ${badgesText}`
      const hasIndex =
        predicate.index ||
        (predicate.type === 'float32vector' && (hasIndexSpecs || hasTokenizers))
      const title = hasIndex ? sortkey : `Not indexed. ${badgesText}`
      tokenizers = (
        <div datasortkey={sortkey} title={title}>
          <span style={{ display: 'inline-block' }}>{tokenizers || ' '}</span>
          <div className='schema-badges'>
            {badges.map((b) => (
              <div title={b.title} key={b.title}>
                {b.text}
              </div>
            ))}
          </div>
        </div>
      )
    }

    return {
      checkbox: predicate.checkbox,
      name: predicate.predicate,
      type: getTypeString(predicate),
      indices: tokenizers,
      index,
      predicate,
    }
  }

  // The preference reveals what Dgraph owns, not everything isUserPredicate
  // excludes. The pre-v1.1 internals stay hidden either way: they carry no
  // "dgraph." prefix, so nothing downstream recognises them as system, and a
  // selected one would offer a live Update and Drop for a predicate that
  // cannot be either.
  const rows = schema
    .filter(
      (p) =>
        isUserPredicate(p.predicate) ||
        (showSystemPredicates && isSystemPredicate(p.predicate)),
    )
    .map(createPredicateRow)

  if (sortDirection !== 'NONE') {
    rows.sort((a, b) => {
      const sortDir = sortDirection === 'ASC' ? 1 : -1

      const aValue = React.isValidElement(a[sortColumn])
        ? a[sortColumn].props.datasortkey
        : a[sortColumn]
      const bValue = React.isValidElement(b[sortColumn])
        ? b[sortColumn].props.datasortkey
        : b[sortColumn]

      return aValue > bValue ? sortDir : -sortDir
    })
  }

  const onRowClicked = (index) => {
    if (index < 0) {
      onChangeSelectedPredicate(null)
      return
    }
    onChangeSelectedPredicate(rows[index].predicate)
  }

  return (
    <AutosizeGrid
      key='autosizegrid'
      style={{ flex: 1 }}
      columns={columns}
      rowGetter={(idx) => idx >= 0 && rows[idx]}
      rowsCount={rows.length}
      onGridSort={handleSort}
      onRowClick={onRowClicked}
      rowSelection={{
        showCheckbox: false,
        selectBy: {
          keys: {
            rowKey: 'name',
            values: [selectedPredicate && selectedPredicate.predicate],
          },
        },
      }}
    />
  )
}
