/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Unknown } from './constants'
import { isSystemPredicate } from './predicates'

const LATEST_VERSION = 'v20.11.0'

export function isLatestVersion(ver) {
  return ver === Unknown || ver.indexOf(LATEST_VERSION) === 0
}

// Reformat HNSW tokenizer from Dgraph's format to schema alter format
// Input:  hnsw("maxLevels":"7","metric":"euclidean")
// Output: hnsw(maxLevels:"7", metric:"euclidean")
function formatHnswTokenizer(tokenizer) {
  const match = tokenizer.match(/^hnsw\((.*)\)$/)
  if (!match) {
    return tokenizer
  }
  try {
    const jsonStr = `{${match[1]}}`
    const params = JSON.parse(jsonStr)
    const options = Object.entries(params)
      .map(([key, value]) => `${key}:"${value}"`)
      .join(', ')
    return `hnsw(${options})`
  } catch {
    return tokenizer
  }
}

export function getPredicateTypeString(predicate) {
  let type = predicate.type
  const lang = type === 'string' && predicate.lang ? '@lang' : ''
  if (predicate.list) {
    type = '[' + type + ']'
  }

  // For float32vector, check for tokenizers even if index flag isn't set
  const hasTokenizers = predicate.tokenizer && predicate.tokenizer.length > 0
  const hasIndex =
    !!predicate.index || (predicate.type === 'float32vector' && hasTokenizers)
  let tokenizers = ''
  let upsert = ''
  let unique = ''
  if (hasIndex) {
    // Format HNSW tokenizers to use unquoted keys for Dgraph schema alter
    const formattedTokenizers = predicate.tokenizer.map((tok) =>
      tok.startsWith('hnsw(') ? formatHnswTokenizer(tok) : tok,
    )
    tokenizers = formattedTokenizers.join(', ')
    upsert = predicate.upsert ? '@upsert' : ''
    unique = predicate.unique ? '@unique' : ''
  }

  return [
    type,
    hasIndex ? `@index(${tokenizers})` : '',
    lang,
    upsert,
    unique,
    predicate.count ? '@count' : '',
    predicate.reverse ? '@reverse' : '',
  ]
    .filter((x) => x.length)
    .join(' ')
}

export function getPredicateQuery(predicate) {
  return `<${predicate.predicate}>: ${getPredicateTypeString(predicate)} .`
}

export const isUserType = (typeName) =>
  (typeName || '').indexOf('dgraph.type.') !== 0 &&
  typeName !== 'dgraph.graphql'

// Pre-v1.1 internals. They are not "dgraph."-prefixed, so the prefix test
// cannot reach them, and they only exist on clusters old enough to still carry
// them.
const LEGACY_INTERNAL_PREDICATES = ['_predicate_', '_share_', '_share_hash_']

// This used to be a hardcoded list, which had drifted: it hid four of the
// predicates Dgraph owns and let the rest through as though the user had
// created them, and it named two (dgraph.group, dgraph.group.acl) that no
// longer exist. Testing the prefix instead means predicates added by future
// Dgraph versions are covered the day they appear.
export const isUserPredicate = (name) =>
  !isSystemPredicate(name) && LEGACY_INTERNAL_PREDICATES.indexOf(name) < 0

// Which predicates an ACL rule may name. Deliberately still its own list, and
// deliberately the list isUserPredicate used to carry: whether Dgraph accepts
// a rule naming, say, dgraph.drop.op is not something we have established, so
// the ACL screen keeps the set it has always offered rather than inheriting a
// change meant for the schema view.
const NOT_ACL_RULEABLE = [
  ...LEGACY_INTERNAL_PREDICATES,
  'dgraph.group',
  'dgraph.group.acl',
  'dgraph.password',
  'dgraph.user.group',
  'dgraph.type',
  'dgraph.xid',
]

export const isAclPredicate = (name) =>
  NOT_ACL_RULEABLE.indexOf(name) < 0 || name === 'dgraph.type'

export function getRawSchema(schema, types = []) {
  const schemaStrings =
    (schema &&
      schema
        .filter((p) => isUserPredicate(p.predicate))
        .map((p) => getPredicateQuery(p))) ||
    []

  const typeDefs = types.map((t) =>
    `
type <${t.name}> {
${t.fields.map((f) => `\t${f.name}`).join('\n')}
}`.trim(),
  )
  return [...schemaStrings.sort(), ...typeDefs].join('\n')
}
