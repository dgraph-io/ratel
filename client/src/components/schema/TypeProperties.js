/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'

import AutosizeGrid from 'components/AutosizeGrid'

export default function TypeProperties({
  executeQuery,
  onAfterUpdate,
  onEdit,
  type,
}) {
  const fields = type.fields.slice().sort((a, b) => (a.name < b.name ? -1 : 1))

  const columns = [
    {
      key: 'name',
      name: 'Name',
      resizable: true,
    },
    {
      key: 'type',
      name: 'Type',
      resizable: true,
    },
  ]

  const grid = (
    <AutosizeGrid
      className='datagrid'
      enableCellAutoFocus={false}
      enableCellSelect={false}
      columns={columns}
      rowGetter={(idx) => (idx < 0 ? {} : fields[idx])}
      rowsCount={fields.length}
    />
  )

  return (
    <div className='type-properties'>
      <h3 className='panel-title'>Type: {type.name}</h3>
      <div className='btn-toolbar'>
        <button className='btn btn-primary btn-sm' onClick={onEdit}>
          Change Type
        </button>
      </div>
      <h4 className='panel-title'>Fields</h4>
      {grid}
    </div>
  )
}
