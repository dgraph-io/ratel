// Copyright 2018 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Dgraph Community License (the "License"); you
// may not use this file except in compliance with the License. You
// may obtain a copy of the License at
//
//     https://github.com/dgraph-io/ratel/blob/master/LICENSE

export function getPredicateQuery(predicate) {
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

    const attrs = [
        type,
        hasIndex ? `@index(${tokenizers})` : "",
        lang,
        upsert,
        predicate.count ? "@count" : "",
        predicate.reverse ? "@reverse" : "",
    ].filter(x => x.length);
    return `<${predicate.predicate}>: ${attrs.join(" ")} .`;
}

export const isUserPredicate = name =>
    [
        "_predicate_",
        "_share_",
        "_share_hash_",
        "dgraph.group.acl",
        "dgraph.password",
        "dgraph.user.group",
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
