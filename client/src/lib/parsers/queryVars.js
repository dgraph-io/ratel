// Copyright 2020 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
        let s2 = s.replace(from, to);
        if (s === s2) {
            return s;
        }
        s = s2;
    }
}

export function extractVars(query) {
    let q = replaceAll(query, "\n", "");
    q = replaceAll(q, "\r", "");
    q = replaceAll(q, "\t", "");
    q = replaceAll(q, " ", "");

    const varsBlockMatch = q.match(/query[a-zA-Z0-9._]*\(([^)]+)\)/);
    if (varsBlockMatch?.index !== 0) {
        return [];
    }
    const varList = varsBlockMatch[1];
    return [...varList.matchAll(/\$([^:]+):([^,]+)/g)].map(m => [m[1], m[2]]);
}
