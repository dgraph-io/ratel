/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const flattenValue = (row, key, value) => {
  if (value === null || value === undefined) {
    row[key] = ''
    return
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      row[key] = ''
    } else if (value.some(isPlainObject)) {
      // Arrays of objects are kept as JSON, not exploded into rows.
      row[key] = JSON.stringify(value)
    } else {
      row[key] = value.join('; ')
    }
    return
  }
  if (isPlainObject(value)) {
    Object.entries(value).forEach(([childKey, childValue]) =>
      flattenValue(row, `${key}.${childKey}`, childValue),
    )
    return
  }
  row[key] = value
}

// Flattens a Dgraph query response ({ block: [obj, ...], ... }) into an
// array of flat row objects with dot-notation keys for nested objects.
export function flattenRows(responseData) {
  if (!isPlainObject(responseData)) {
    return []
  }
  const blocks = Object.entries(responseData).filter(([, value]) =>
    Array.isArray(value),
  )
  const multiBlock = blocks.length > 1

  const rows = []
  blocks.forEach(([blockName, items]) => {
    items.forEach((item) => {
      if (!isPlainObject(item)) {
        return
      }
      const row = {}
      if (multiBlock) {
        row.__block = blockName
      }
      Object.entries(item).forEach(([key, value]) =>
        flattenValue(row, key, value),
      )
      rows.push(row)
    })
  })
  return rows
}

const escapeField = (value) => {
  const str = value === null || value === undefined ? '' : String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// Serializes flat row objects into an RFC-4180 CSV string. The header is
// the union of all row keys, in first-seen order.
export function toCSV(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return ''
  }
  const headers = []
  rows.forEach((row) =>
    Object.keys(row).forEach((key) => {
      if (!headers.includes(key)) {
        headers.push(key)
      }
    }),
  )
  const lines = [headers.map(escapeField).join(',')]
  rows.forEach((row) =>
    lines.push(headers.map((header) => escapeField(row[header])).join(',')),
  )
  return lines.join('\r\n')
}

// Builds a CSV from a Dgraph query response and triggers a browser
// download. No-op when there is nothing to export.
export function downloadCSV(responseData, filename) {
  const csv = toCSV(flattenRows(responseData))
  if (!csv) {
    return
  }
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
