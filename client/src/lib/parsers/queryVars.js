/*
 * SPDX-FileCopyrightText: © 2017-2026 Istari Digital, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// import peg from "pegjs";
//
// export function makeMutationParser() {
//     return peg.generate(`
//       query = _ 'query' _ name:identifier _ '(' _ vars:varDefs _ ')' _ queryBody {
//       		return {vars};
//           }
//
//       identifier = [_a-zA-Z.] [_a-zA-Z0-9.]+
//
//       varDefs = varDef / varDef _ ',' _ varDefs / _
//
//       varDef = name:varName _ ':' _ type:identifier { return {name, type} }
//
//       varName = '$' identifier { return identifier }
//
//       _ = [ \t\n\r\a]*
//       queryBody = (./[ \t\n\r\a])*
//       `);
// }

function replaceAll(s, from, to) {
  while (true) {
    const s2 = s.replace(from, to)
    if (s === s2) {
      return s
    }
    s = s2
  }
}

export function extractVars(query) {
  let q = replaceAll(query, '\n', '')
  q = replaceAll(q, '\r', '')
  q = replaceAll(q, '\t', '')
  q = replaceAll(q, ' ', '')

  const varsBlockMatch = q.match(/query[a-zA-Z0-9._]*\(([^)]+)\)/)
  if (varsBlockMatch?.index !== 0) {
    return []
  }
  const varList = varsBlockMatch[1]
  return [...varList.matchAll(/\$([^:]+):([^,]+)/g)].map((m) => [m[1], m[2]])
}
