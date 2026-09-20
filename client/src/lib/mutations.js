/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Builders for single-triple N-Quad mutations used by inline editing.

export function escapeRdfString(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

// Predicates go inside <...>; reject anything that could break out.
export function isSafePredicate(predicate) {
  return (
    typeof predicate === 'string' &&
    predicate.length > 0 &&
    !/[<>"{}|^`\\\s]/.test(predicate)
  )
}

export function valueToRdfLiteral(value) {
  if (typeof value === 'boolean') {
    return `"${value}"^^<xs:boolean>`
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return `"${value}"^^<xs:int>`
    }
    return `"${value}"^^<xs:float>`
  }
  return `"${escapeRdfString(value)}"`
}

const assertSafe = (uid, predicate) => {
  if (!uid || !/^0x[0-9a-fA-F]+$/.test(String(uid))) {
    throw new Error(`Invalid uid: ${uid}`)
  }
  if (!isSafePredicate(predicate)) {
    throw new Error(`Invalid predicate: ${predicate}`)
  }
}

export function buildSetMutation(uid, predicate, value) {
  assertSafe(uid, predicate)
  return `{
  set {
    <${uid}> <${predicate}> ${valueToRdfLiteral(value)} .
  }
}`
}

// Deletes one value when given, or every value of the predicate when
// value is undefined.
export function buildDeleteMutation(uid, predicate, value) {
  assertSafe(uid, predicate)
  const object = value === undefined ? '*' : valueToRdfLiteral(value)
  return `{
  delete {
    <${uid}> <${predicate}> ${object} .
  }
}`
}

// Coerces the user's input string back to the original value's type so
// edits don't silently change int -> string etc.
export function coerceValue(input, originalValue) {
  if (typeof originalValue === 'boolean') {
    return input === 'true' || input === true
  }
  if (typeof originalValue === 'number') {
    const n = Number(input)
    if (!Number.isFinite(n)) {
      throw new Error(`"${input}" is not a number`)
    }
    return n
  }
  return String(input)
}
