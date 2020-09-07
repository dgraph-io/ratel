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

import { Unknown } from "./constants";

const LATEST_VERSION = "v20.07.0";

export function isLatestVersion(ver) {
    return ver === Unknown || ver.indexOf(LATEST_VERSION) === 0;
}

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

export const isUserType = typeName =>
    (typeName || "").indexOf("dgraph.type.") !== 0 &&
    typeName !== "dgraph.graphql";

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

export const isAclPredicate = name =>
    isUserPredicate(name) || name === "dgraph.type";

export function getRawSchema(schema, types = []) {
    const schemaStrings = schema
        .filter(p => isUserPredicate(p.predicate))
        .map(p => getPredicateQuery(p));

    const typeDefs = types.map(t =>
        `
type <${t.name}> {
${t.fields.map(f => `\t${f.name}`).join("\n")}
}`.trim(),
    );
    return [...schemaStrings.sort(), ...typeDefs].join("\n");
}
