/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'

import {
  EMPTY_FILTER,
  FILTER_OPERATORS,
  filterActive,
} from '../lib/graphFilter'

import './GraphFilterPanel.scss'

// Faceted filtering of the rendered graph: hide nodes that fall outside a
// connectivity range or fail an attribute predicate.
export default function GraphFilterPanel({
  attributeKeys,
  filter,
  hiddenCount,
  onChange,
  onClose,
}) {
  const set = (patch) => onChange({ ...filter, ...patch })
  const op = FILTER_OPERATORS.find(([value]) => value === filter.op)
  const opNeedsValue = op ? op[2] : true

  return (
    <div className='graph-filter-panel'>
      <div className='graph-filter-panel__header'>
        <span>Filter</span>
        <button
          type='button'
          className='graph-filter-panel__close'
          onClick={onClose}
          title='Close'
        >
          ×
        </button>
      </div>

      <div className='graph-filter-panel__section'>Connectivity (degree)</div>
      <div className='graph-filter-panel__row'>
        <input
          type='number'
          min='0'
          placeholder='min'
          aria-label='Minimum degree'
          value={filter.degreeMin}
          onChange={(e) => set({ degreeMin: e.target.value })}
        />
        <span className='graph-filter-panel__dash'>–</span>
        <input
          type='number'
          min='0'
          placeholder='max'
          aria-label='Maximum degree'
          value={filter.degreeMax}
          onChange={(e) => set({ degreeMax: e.target.value })}
        />
      </div>

      <div className='graph-filter-panel__section'>Attribute</div>
      <div className='graph-filter-panel__row'>
        <select
          aria-label='Filter attribute'
          value={filter.attr}
          onChange={(e) => set({ attr: e.target.value })}
        >
          <option value=''>(any)</option>
          {attributeKeys.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
        <select
          aria-label='Filter operator'
          value={filter.op}
          onChange={(e) => set({ op: e.target.value })}
        >
          {FILTER_OPERATORS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {opNeedsValue && (
        <div className='graph-filter-panel__row'>
          <input
            type='text'
            placeholder='value'
            aria-label='Filter value'
            disabled={!filter.attr}
            value={filter.value}
            onChange={(e) => set({ value: e.target.value })}
          />
        </div>
      )}

      <div className='graph-filter-panel__footer'>
        <span className='graph-filter-panel__count'>
          {filterActive(filter) ? `${hiddenCount} hidden` : 'No filter applied'}
        </span>
        <button
          type='button'
          className='graph-filter-panel__clear'
          onClick={() => onChange({ ...EMPTY_FILTER })}
          disabled={!filterActive(filter)}
        >
          Clear
        </button>
      </div>
    </div>
  )
}
