/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Attribute operators offered by the filter panel. `needsValue: false` means
// the operator works on the attribute alone (e.g. "exists").
export const FILTER_OPERATORS = [
  ['contains', 'contains', true],
  ['eq', '=', true],
  ['ne', '≠', true],
  ['gt', '>', true],
  ['lt', '<', true],
  ['exists', 'exists', false],
]

export const EMPTY_FILTER = {
  degreeMin: '',
  degreeMax: '',
  attr: '',
  op: 'contains',
  value: '',
}

// Whether a filter spec imposes any constraint at all. An inactive filter
// hides nothing.
export function filterActive(spec) {
  if (!spec) {
    return false
  }
  if (spec.degreeMin !== '' || spec.degreeMax !== '') {
    return true
  }
  if (spec.attr) {
    return spec.op === 'exists' || spec.value !== ''
  }
  return false
}

// Returns the raw attribute values for a node as a flat array (an attribute
// may hold a scalar or a list).
export function attrValues(node, attr) {
  const attrs = node && node.properties && node.properties.attrs
  if (!attrs || !(attr in attrs)) {
    return []
  }
  const val = attrs[attr]
  if (val == null) {
    return []
  }
  return Array.isArray(val) ? val : [val]
}

function matchesAttribute(node, spec) {
  const values = attrValues(node, spec.attr)
  if (spec.op === 'exists') {
    return values.length > 0
  }
  if (spec.value === '') {
    return true
  }

  const needle = String(spec.value).toLowerCase()
  const num = Number(spec.value)

  return values.some((raw) => {
    switch (spec.op) {
      case 'eq':
        return String(raw).toLowerCase() === needle
      case 'ne':
        return String(raw).toLowerCase() !== needle
      case 'gt':
        return Number(raw) > num
      case 'lt':
        return Number(raw) < num
      default:
        return String(raw).toLowerCase().includes(needle)
    }
  })
}

/**
 * Whether a node passes the active filter (true = keep/visible). `degree` is
 * the node's connectivity in the rendered graph.
 */
export function nodeMatchesFilter(node, degree, spec) {
  if (!filterActive(spec)) {
    return true
  }

  if (spec.degreeMin !== '' && degree < Number(spec.degreeMin)) {
    return false
  }
  if (spec.degreeMax !== '' && degree > Number(spec.degreeMax)) {
    return false
  }

  if (spec.attr && (spec.op === 'exists' || spec.value !== '')) {
    if (!matchesAttribute(node, spec)) {
      return false
    }
  }

  return true
}

// Sorted, de-duplicated attribute keys present across the node dataset, for
// populating the filter panel's attribute picker.
export function collectAttributeKeys(nodesDataset) {
  const keys = new Set()
  nodesDataset.forEach((node) => {
    const attrs = node.properties && node.properties.attrs
    if (attrs) {
      Object.keys(attrs).forEach((k) => keys.add(k))
    }
  })
  return Array.from(keys).sort((a, b) => a.localeCompare(b))
}
