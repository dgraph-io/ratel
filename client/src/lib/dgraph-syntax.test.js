/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { isAclPredicate, isUserPredicate } from './dgraph-syntax'

// The full set Dgraph creates, so the assertions below are about all of them
// rather than the handful the old hardcoded list happened to name.
const SYSTEM = [
  'dgraph.type',
  'dgraph.drop.op',
  'dgraph.graphql.schema',
  'dgraph.graphql.xid',
  'dgraph.graphql.p_query',
  'dgraph.namespace.id',
  'dgraph.namespace.name',
  'dgraph.xid',
  'dgraph.password',
  'dgraph.user.group',
  'dgraph.acl.rule',
  'dgraph.rule.predicate',
  'dgraph.rule.permission',
]

describe('isUserPredicate', () => {
  // The list this replaced named only four of the thirteen, so the rest were
  // treated as the user's own — including everything Dgraph has added since.
  it('excludes every predicate Dgraph owns', () => {
    for (const name of SYSTEM) {
      expect(isUserPredicate(name)).toBe(false)
    }
  })

  it('excludes the pre-v1.1 internals, which carry no dgraph. prefix', () => {
    for (const name of ['_predicate_', '_share_', '_share_hash_']) {
      expect(isUserPredicate(name)).toBe(false)
    }
  })

  it('includes ordinary predicates', () => {
    for (const name of ['name', 'location', 'my-predicate', 'dgraphtype']) {
      expect(isUserPredicate(name)).toBe(true)
    }
  })

  // The reason for the change: a name Dgraph has not shipped yet is still
  // reserved, and a list cannot know about it.
  it('excludes reserved names this version has never seen', () => {
    expect(isUserPredicate('dgraph.something.new')).toBe(false)
  })
})

// This governs which predicates an ACL rule may name, and which reserved ones
// Dgraph accepts there is not something we have established. So it keeps the
// exact set it offered before isUserPredicate changed underneath it.
describe('isAclPredicate', () => {
  it('still offers user predicates and dgraph.type', () => {
    for (const name of ['name', 'location', 'dgraph.type']) {
      expect(isAclPredicate(name)).toBe(true)
    }
  })

  it('still withholds the ACL predicates themselves', () => {
    for (const name of ['dgraph.password', 'dgraph.user.group', 'dgraph.xid']) {
      expect(isAclPredicate(name)).toBe(false)
    }
  })

  // Unchanged rather than correct: these were offered before, and narrowing
  // the ACL screen is not what this change is for.
  it('still offers the reserved predicates it always did', () => {
    for (const name of ['dgraph.drop.op', 'dgraph.graphql.schema']) {
      expect(isAclPredicate(name)).toBe(true)
    }
  })
})
