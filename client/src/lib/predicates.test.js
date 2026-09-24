/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { isSystemPredicate, stripNamespace } from './predicates'

describe('stripNamespace', () => {
  it('removes the namespace prefix from a tablet key', () => {
    expect(stripNamespace('0-dgraph.type')).toBe('dgraph.type')
    expect(stripNamespace('123-name')).toBe('name')
  })

  // Dgraph formats the namespace as hex, so namespace 10 is "a-", not "10-".
  it('removes a hexadecimal namespace prefix', () => {
    expect(stripNamespace('a-dgraph.xid')).toBe('dgraph.xid')
    expect(stripNamespace('ff-name')).toBe('name')
    expect(stripNamespace('deadbeef-name')).toBe('name')
  })

  it('leaves a bare predicate name alone', () => {
    expect(stripNamespace('dgraph.type')).toBe('dgraph.type')
    expect(stripNamespace('name')).toBe('name')
  })

  // Only the namespace is stripped: a predicate may itself contain digits and
  // dashes, and those belong to the name.
  it('strips only the leading namespace', () => {
    expect(stripNamespace('0-2-foo')).toBe('2-foo')
    expect(stripNamespace('0-my-predicate')).toBe('my-predicate')
  })

  it('tolerates missing values rather than throwing', () => {
    expect(stripNamespace(undefined)).toBe('')
    expect(stripNamespace(null)).toBe('')
  })
})

describe('isSystemPredicate', () => {
  it('recognises the predicates Dgraph manages', () => {
    for (const name of [
      '0-dgraph.type',
      '0-dgraph.drop.op',
      '0-dgraph.graphql.schema',
      '0-dgraph.graphql.xid',
      '0-dgraph.graphql.p_query',
      '0-dgraph.namespace.id',
      '0-dgraph.namespace.name',
      // ACL predicates, present once ACL is enabled.
      '0-dgraph.xid',
      '0-dgraph.password',
      '0-dgraph.user.group',
      '0-dgraph.acl.rule',
      '0-dgraph.rule.predicate',
      '0-dgraph.rule.permission',
    ]) {
      expect(isSystemPredicate(name)).toBe(true)
    }
  })

  it('leaves user predicates alone', () => {
    for (const name of [
      '0-name',
      '0-location',
      '0-my-predicate',
      // Near misses: the reserved prefix is "dgraph." with the dot.
      '0-dgraph',
      '0-dgraphtype',
      '0-dgraph_type',
      '0-not.dgraph.type',
      '0-mydgraph.type',
    ]) {
      expect(isSystemPredicate(name)).toBe(false)
    }
  })

  // Dgraph's isReservedName lowercases before testing the prefix, so it would
  // reject these too. Matching that keeps the UI from offering a move or a drop
  // that the server is going to refuse.
  it('matches case-insensitively, as Dgraph does', () => {
    expect(isSystemPredicate('0-Dgraph.type')).toBe(true)
    expect(isSystemPredicate('0-DGRAPH.TYPE')).toBe(true)
  })

  // A tenant past namespace 9 gets a hex prefix. Missing these would show a
  // move button and a live Drop button for predicates Dgraph will refuse.
  it('recognises system predicates in a non-root namespace', () => {
    expect(isSystemPredicate('a-dgraph.xid')).toBe(true)
    expect(isSystemPredicate('ff-dgraph.type')).toBe(true)
    expect(isSystemPredicate('a-name')).toBe(false)
  })

  // Reserved covers names Dgraph has not defined: the whole prefix is fenced
  // off, and alter refuses them outright.
  it('treats an undefined reserved name as system', () => {
    expect(isSystemPredicate('0-dgraph.blah')).toBe(true)
    expect(isSystemPredicate('dgraph.acme.rel')).toBe(true)
  })

  it('works on names that carry no namespace', () => {
    expect(isSystemPredicate('dgraph.type')).toBe(true)
    expect(isSystemPredicate('name')).toBe(false)
  })

  it('tolerates missing values rather than throwing', () => {
    expect(isSystemPredicate(undefined)).toBe(false)
    expect(isSystemPredicate(null)).toBe(false)
  })
})
