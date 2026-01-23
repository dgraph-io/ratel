/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Unknown } from './constants'

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

export const isUserPredicate = (name) =>
  [
    '_predicate_',
    '_share_',
    '_share_hash_',
    'dgraph.group',
    'dgraph.group.acl',
    'dgraph.password',
    'dgraph.user.group',
    'dgraph.type',
    'dgraph.xid',
  ].indexOf(name) < 0

export const isAclPredicate = (name) =>
  isUserPredicate(name) || name === 'dgraph.type'

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
