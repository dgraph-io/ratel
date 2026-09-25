/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { setShowSystemPredicates } from 'actions/ui'

import './SystemPredicateToggle.scss'

// Shown on both the cluster and schema views. A switch rather than a checkbox
// or a button: this is a setting that persists across both pages and survives
// a reload, and a switch is the control that says so.
//
// The label is fixed, because the two pages place this differently (a button
// toolbar on one, a heading baseline on the other) and a label that changed
// between "Show" and "Hide" would move its neighbours on every click. The
// count is part of it: hiding rows without saying how many are hidden makes
// the list quietly untrue, which is the failure this exists to prevent.
export default function SystemPredicateToggle({
  count,
  className = '',
  id = 'system-predicate-toggle',
}) {
  const show = useSelector((state) => state.ui.showSystemPredicates)
  const dispatch = useDispatch()

  // Nothing to reveal means nothing to explain; a control that can only ever
  // be a no-op is noise.
  if (!count) {
    return null
  }

  return (
    <div
      className={`custom-control custom-switch system-predicate-toggle ${className}`.trim()}
      title={
        show
          ? 'Hide the predicates Dgraph manages'
          : 'Show the predicates Dgraph manages. They cannot be modified or dropped.'
      }
    >
      <input
        type='checkbox'
        className='custom-control-input'
        id={id}
        checked={show}
        onChange={(e) => dispatch(setShowSystemPredicates(e.target.checked))}
      />
      <label className='custom-control-label' htmlFor={id}>
        System predicates ({count})
      </label>
    </div>
  )
}
