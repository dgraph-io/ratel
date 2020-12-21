// Copyright 2017-2021 Dgraph Labs, Inc. and Contributors
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

import React, { useState } from "react";

import AutosizeGrid from "../AutosizeGrid";
import { isUserPredicate } from "lib/dgraph-syntax";

export default function PredicatesTable({
    hideIndices,
    onChangeSelectedPredicate,
    schema,
    selectedPredicate,
    showCheckboxes,
    types = [],
}) {
    const columns = [
        {
            key: "name",
            name: "Predicate",
            resizable: true,
            sortable: true,
        },
        {
            key: "type",
            name: "Type",
            resizable: true,
            sortable: true,
            formatter: null,
        },
    ];
    if (!hideIndices) {
        columns.push({
            key: "indices",
            name: "Indices",
            resizable: true,
            sortable: true,
        });
    }

    if (showCheckboxes) {
        columns.splice(0, 0, {
            key: "checkbox",
            name: " ",
            width: 32,
            resizable: true,
            sortable: false,
            formatter: cell => (
                <input
                    type="checkbox"
                    checked={cell.value.value}
                    onChange={cell.value.invert}
                />
            ),
        });
    }

    const [sortColumn, setSortColumn] = useState("name");
    const [sortDirection, setSortDirection] = useState("NONE");

    const handleSort = (sortColumn, sortDirection) => {
        setSortColumn(sortColumn);
        setSortDirection(sortDirection);
    };

    const getTypeString = predicate => {
        let type = predicate.type;
        if (predicate.list) {
            type = "[" + type + "]";
        }
        if (predicate.type === "string" && predicate.lang) {
            type += " @lang";
        }
        return type;
    };

    const getBadges = predicate => {
        const badges = [];
        if (predicate.reverse) {
            badges.push({
                title: "Reverse",
                text: "~",
            });
        }
        if (predicate.count) {
            badges.push({
                title: "Count",
                text: "C",
            });
        }
        if (predicate.upsert) {
            badges.push({
                title: "Upsert",
                text: "U",
            });
        }
        return badges;
    };

    const createPredicateRow = (predicate, index) => {
        const badges = getBadges(predicate);

        let tokenizers = "";
        if (predicate.index) {
            predicate.tokenizer.sort();
            tokenizers = predicate.tokenizer.join(", ");
        }

        if (badges.length) {
            const badgesText = badges.map(b => b.title).join(" ");
            const sortkey = `${tokenizers} ${badgesText}`;
            const title = predicate.index
                ? sortkey
                : `Not indexed. ${badgesText}`;
            tokenizers = (
                <div datasortkey={sortkey} title={title}>
                    <span style={{ display: "inline-block" }}>
                        {tokenizers || " "}
                    </span>
                    <div className="schema-badges">
                        {badges.map(b => (
                            <div title={b.title} key={b.title}>
                                {b.text}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return {
            checkbox: predicate.checkbox,
            name: predicate.predicate,
            type: getTypeString(predicate),
            indices: tokenizers,
            index,
            predicate,
        };
    };

    const rows = schema
        .filter(p => isUserPredicate(p.predicate))
        .map(createPredicateRow);

    if (sortDirection !== "NONE") {
        rows.sort((a, b) => {
            const sortDir = sortDirection === "ASC" ? 1 : -1;

            const aValue = React.isValidElement(a[sortColumn])
                ? a[sortColumn].props.datasortkey
                : a[sortColumn];
            const bValue = React.isValidElement(b[sortColumn])
                ? b[sortColumn].props.datasortkey
                : b[sortColumn];

            return aValue > bValue ? sortDir : -sortDir;
        });
    }

    const onRowClicked = index => {
        if (index < 0) {
            onChangeSelectedPredicate(null);
            return;
        }
        onChangeSelectedPredicate(rows[index].predicate);
    };

    return (
        <AutosizeGrid
            key="autosizegrid"
            style={{ flex: 1 }}
            columns={columns}
            rowGetter={idx => idx >= 0 && rows[idx]}
            rowsCount={rows.length}
            onGridSort={handleSort}
            onRowClick={onRowClicked}
            rowSelection={{
                showCheckbox: false,
                selectBy: {
                    keys: {
                        rowKey: "name",
                        values: [
                            selectedPredicate && selectedPredicate.predicate,
                        ],
                    },
                },
            }}
        />
    );
}
