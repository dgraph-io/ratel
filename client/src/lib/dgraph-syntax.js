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
    name !== "_predicate_" && name !== "_share_" && name !== "_share_hash_";

export function getRawSchema(schema) {
    schema = schema.filter(p => isUserPredicate(p.predicate));
    const schemaModified = schema.filter(
        p => p.type !== "uid" || p.count || p.reverse || p.list,
    );
    const schemaStandard = schema.filter(
        p => p.type === "uid" && !p.count && !p.reverse && !p.list,
    );
    return [...schemaModified, ...schemaStandard]
        .map(p => getPredicateQuery(p))
        .join("\n");
}
