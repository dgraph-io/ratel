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

import React, { useState } from "react";

import AutosizeGrid from "../AutosizeGrid";

export default function TypesTable({
    types,
    selectedType,
    onChangeSelectedType,
}) {
    const columns = [
        {
            key: "name",
            name: "Type",
            resizable: true,
            sortable: true,
        },
        {
            key: "fieldCount",
            name: "Field Count",
            resizable: true,
            sortable: true,
            width: 150,
        },
    ];

    const [sortColumn, setSortColumn] = useState("name");
    const [sortDirection, setSortDirection] = useState("NONE");

    const handleSort = (sortColumn, sortDirection) => {
        setSortColumn(sortColumn);
        setSortDirection(sortDirection);
    };

    const createRow = (type, index) => {
        return {
            fieldCount: type.fields.length,
            name: type.name,
            index,
            type,
        };
    };

    const rows = types.map(createRow);

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
            onChangeSelectedType(null);
            return;
        }
        onChangeSelectedType(rows[index].type);
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
                        values: [selectedType && selectedType.name],
                    },
                },
            }}
        />
    );
}
