// Copyright 2017-2019 Dgraph Labs, Inc. and Contributors
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

const peg = require("pegjs");

export function makeMutationParser() {
    return peg.generate(`
        mutation = _ '{' _ blocks:( rdfSet / rdfDel ) * '}' _ {
          return {mutations:blocks};
        }

        rdfSet = 'set' _ '{' _ rdf:rdfTriple * '}' _ { return {set:rdf} }

        rdfDel = 'delete' _ '{' _ rdfTriple * '}' _

        rdfTriple = '<' subject '>' _ '<' predicate '>' _ '<baz>' _ '.' _ { return 1; }

        _ = ([\t ] / "\0a" / "\\n" / "\\r") *

        subject = hexValue / intValue / externalId

        hexValue = '0x' [0-9a-zA-Z]+
        intValue = [0-9]+
        externalId = '_:' [0-9a-zA-Z]+

        predicate = [_a-zA-Z] [_a-zA-Z0-9]+
      `);
}

const main = () => {
    const parser = makeMutationParser();

    console.log("Parser built!");
    console.log(
        "Parse result",
        parser.parse(`
    {
      set {
        <_:foo> <bar> <baz> .
      }
    }
  `),
    );
};

main();
