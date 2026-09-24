/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { isSystemPredicate, isSystemTablet, stripNamespace } from './predicates'

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
      'dgraph.type',
      'dgraph.drop.op',
      'dgraph.graphql.schema',
      'dgraph.graphql.xid',
      'dgraph.graphql.p_query',
      'dgraph.namespace.id',
      'dgraph.namespace.name',
      // ACL predicates, present once ACL is enabled.
      'dgraph.xid',
      'dgraph.password',
      'dgraph.user.group',
      'dgraph.acl.rule',
      'dgraph.rule.predicate',
      'dgraph.rule.permission',
    ]) {
      expect(isSystemPredicate(name)).toBe(true)
      expect(isSystemTablet(`0-${name}`)).toBe(true)
    }
  })

  it('leaves user predicates alone', () => {
    for (const name of [
      'name',
      'location',
      'my-predicate',
      // Near misses: the reserved prefix is "dgraph." with the dot.
      'dgraph',
      'dgraphtype',
      'dgraph_type',
      'not.dgraph.type',
      'mydgraph.type',
    ]) {
      expect(isSystemPredicate(name)).toBe(false)
      expect(isSystemTablet(`0-${name}`)).toBe(false)
    }
  })

  // Dgraph's isReservedName lowercases before testing the prefix, so it would
  // reject these too. Matching that keeps the UI from offering a move or a drop
  // that the server is going to refuse.
  it('matches case-insensitively, as Dgraph does', () => {
    expect(isSystemPredicate('Dgraph.type')).toBe(true)
    expect(isSystemPredicate('DGRAPH.TYPE')).toBe(true)
  })

  // Reserved covers names Dgraph has not defined: the whole prefix is fenced
  // off, and alter refuses them outright.
  it('treats an undefined reserved name as system', () => {
    expect(isSystemPredicate('dgraph.blah')).toBe(true)
    expect(isSystemPredicate('dgraph.acme.rel')).toBe(true)
  })

  // A bare name is never namespace-stripped. "a-dgraph.type" is a predicate a
  // user is allowed to create and change, and mistaking it for the reserved
  // "dgraph.type" would disable Update and Drop on it for no reason.
  it('does not strip a namespace from a bare predicate name', () => {
    expect(isSystemPredicate('a-dgraph.type')).toBe(false)
    expect(isSystemPredicate('0-dgraph.type')).toBe(false)
  })

  it('tolerates missing values rather than throwing', () => {
    expect(isSystemPredicate(undefined)).toBe(false)
    expect(isSystemPredicate(null)).toBe(false)
  })
})

describe('isSystemTablet', () => {
  it('recognises namespaced tablet keys', () => {
    expect(isSystemTablet('0-dgraph.type')).toBe(true)
    expect(isSystemTablet('0-name')).toBe(false)
  })

  // A tenant past namespace 9 gets a hex prefix. Missing these would offer a
  // move button for a tablet Dgraph refuses to move.
  it('recognises system tablets in a non-root namespace', () => {
    expect(isSystemTablet('a-dgraph.xid')).toBe(true)
    expect(isSystemTablet('ff-dgraph.type')).toBe(true)
    expect(isSystemTablet('a-name')).toBe(false)
  })

  // The counterpart to the bare-name case: as a tablet key, the user predicate
  // "a-dgraph.type" arrives with its own namespace in front. Stripping only the
  // real namespace leaves "a-dgraph.type", which is not reserved.
  it('leaves a user predicate that looks namespaced alone', () => {
    expect(isSystemTablet('0-a-dgraph.type')).toBe(false)
    expect(isSystemTablet('a-a-dgraph.type')).toBe(false)
  })

  it('tolerates missing values rather than throwing', () => {
    expect(isSystemTablet(undefined)).toBe(false)
    expect(isSystemTablet(null)).toBe(false)
  })
})
