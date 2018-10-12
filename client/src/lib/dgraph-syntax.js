export function getPredicateQuery(predicate) {
    let type = predicate.type;
    const lang = type === "string" && predicate.lang ? " @lang" : "";
    if (predicate.list) {
        type = "[" + type + "]";
    }

    let hasIndex = !!predicate.index;
    let tokenizers = "";
    let upsert = "";
    if (hasIndex) {
        tokenizers = predicate.tokenizer.join(", ");
        upsert = predicate.upsert ? " @upsert" : "";
    }

    return `${predicate.predicate}: ${type}${
        hasIndex ? ` @index(${tokenizers})` : ""
    }${lang}${upsert}${predicate.count ? " @count" : ""} ${
        predicate.reverse ? " @reverse" : ""
    } .`;
}
