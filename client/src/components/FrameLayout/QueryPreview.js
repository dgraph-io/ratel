import React from "react";
import { collapseQuery } from "lib/helpers";

export default function QueryPreview({
    action,
    hasError,
    onSelectQuery,
    query,
}) {
    return (
        <div className="query-row" onClick={() => onSelectQuery(query, action)}>
            <i
                className={
                    action === "query"
                        ? "fa fa-search query-icon"
                        : "far fa-edit query-icon"
                }
            />
            {!hasError ? null : (
                <i
                    className="extra-icon fas fa-circle"
                    style={{ color: "#fff" }}
                />
            )}
            {!hasError ? null : (
                <i className="extra-icon fas fa-times-circle" />
            )}{" "}
            <span className="preview">{collapseQuery(query)}</span>
        </div>
    );
}
