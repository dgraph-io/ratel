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

export function getPredicateTypeString(predicate) {
    let type = predicate.type;
    const lang = type === "string" && predicate.lang ? "@lang" : "";
    if (predicate.list) {
        type = "[" + type + "]";
    }

    let hasIndex = !!predicate.index;
    let tokenizers = "";
    let upsert = "";
    if (hasIndex) {
        tokenizers = predicate.tokenizer.join(", ");
        upsert = predicate.upsert ? "@upsert" : "";
    }

    return [
        type,
        hasIndex ? `@index(${tokenizers})` : "",
        lang,
        upsert,
        predicate.count ? "@count" : "",
        predicate.reverse ? "@reverse" : "",
    ]
        .filter(x => x.length)
        .join(" ");
}

export function getPredicateQuery(predicate) {
    return `<${predicate.predicate}>: ${getPredicateTypeString(predicate)} .`;
}

export const isUserPredicate = name =>
    [
        "_predicate_",
        "_share_",
        "_share_hash_",
        "dgraph.group",
        "dgraph.group.acl",
        "dgraph.password",
        "dgraph.user.group",
        "dgraph.type",
        "dgraph.xid",
    ].indexOf(name) < 0;

export function getRawSchema(schema) {
    schema = schema.filter(p => isUserPredicate(p.predicate));
    const schemaModified = schema.filter(
        p => p.type !== "uid" || p.count || p.reverse || p.list,
    );
    const schemaStandard = schema.filter(
        p => p.type === "uid" && !p.count && !p.reverse && !p.list,
    );
    const schemaStrings = [...schemaModified, ...schemaStandard].map(p =>
        getPredicateQuery(p),
    );
    return schemaStrings.sort().join("\n");
}
