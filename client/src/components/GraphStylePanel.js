/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'

import { MAX_NODE_SIZE, MIN_NODE_SIZE, updateRule } from '../lib/graphStyles'

import './GraphStylePanel.scss'

// Per-group style overrides (color / node size), Neo4j Bloom style.
// Groups come from the predicates that introduced each node.
export default function GraphStylePanel({
  groups,
  styleRules,
  onChange,
  onClose,
}) {
  const handleColor = (group, color) =>
    onChange(updateRule(styleRules, group, { color }))

  const handleSize = (group, size) =>
    onChange(updateRule(styleRules, group, { size: Number(size) }))

  const handleReset = (group) => {
    const next = { ...styleRules }
    delete next[group]
    onChange(next)
  }

  return (
    <div className='graph-style-panel'>
      <div className='graph-style-panel__header'>
        <span>Graph styles</span>
        <button
          type='button'
          className='graph-style-panel__close'
          onClick={onClose}
          title='Close'
        >
          ×
        </button>
      </div>
      {groups.length === 0 ? (
        <div className='graph-style-panel__empty'>No groups in this graph</div>
      ) : (
        groups.map(({ group, color }) => {
          const rule = styleRules[group] || {}
          return (
            <div className='graph-style-panel__row' key={group}>
              <span className='graph-style-panel__name' title={group}>
                {group}
              </span>
              <input
                type='color'
                aria-label={`Color for ${group}`}
                value={rule.color || color || '#cccccc'}
                onChange={(e) => handleColor(group, e.target.value)}
              />
              <input
                type='range'
                aria-label={`Node size for ${group}`}
                min={MIN_NODE_SIZE}
                max={MAX_NODE_SIZE}
                value={rule.size || 7}
                onChange={(e) => handleSize(group, e.target.value)}
              />
              <button
                type='button'
                className='graph-style-panel__reset'
                onClick={() => handleReset(group)}
                disabled={!styleRules[group]}
                title='Reset to default'
              >
                ↺
              </button>
            </div>
          )
        })
      )}
    </div>
  )
}
