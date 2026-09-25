/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Dgraph stores a predicate as hex(namespace) + "-" + name, so namespace 10 is
// "a-dgraph.xid", not "10-dgraph.xid". Matching only decimal digits here would
// pass the whole string through for every namespace past 9 and quietly treat
// its system predicates as ordinary ones.
//
// Tablet keys from /state arrive namespaced; predicate names from a `schema {}`
// query arrive bare, so both forms reach this module and a name with no prefix
// has to survive untouched.
const NAMESPACE_PREFIX = /^[0-9a-f]+-/i

export const stripNamespace = (name) =>
  String(name ?? '').replace(NAMESPACE_PREFIX, '')

const isReservedName = (name) => name.toLowerCase().startsWith('dgraph.')

// Dgraph fences off the whole "dgraph." prefix for itself, and nothing under it
// can be changed from Ratel:
//
//   - A reserved name Dgraph has not defined (dgraph.blah) is refused by alter
//     outright, as "reserved as the namespace for dgraph's internal types".
//   - A pre-defined one (dgraph.type, the dgraph.graphql.* set, the ACL set)
//     passes alter only when byte-identical to its initial definition, and can
//     never be dropped: "predicate dgraph.type is pre-defined and is not
//     allowed to be modified" / "... to be dropped".
//
// So the prefix is the right test for whether Ratel should offer an edit, even
// though the tiers differ underneath. It mirrors x.IsReservedPredicate, which
// strips the namespace and compares case-insensitively.
//
// The one thing this cannot see is a predicate space claimed by a plugin
// through x.RegisterReservedNamespace, which Dgraph treats as pre-defined for
// its owner. With no plugin registered — the default — there are none.
//
// Takes a bare predicate name, as a `schema {}` query returns. It deliberately
// does not strip a namespace first: "a-dgraph.type" is a legitimate user
// predicate, and treating it as reserved would disable Update and Drop on
// something the server is perfectly willing to change. Tablet keys are
// namespaced, so the cluster view uses isSystemTablet instead.
export const isSystemPredicate = (name) => isReservedName(String(name ?? ''))

// Takes a tablet key from /state, which is namespaced: "0-dgraph.type", or
// "0-a-dgraph.type" for a user predicate that happens to look namespaced.
export const isSystemTablet = (tabletKey) =>
  isSystemPredicate(stripNamespace(tabletKey))
