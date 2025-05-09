/*
 * SPDX-FileCopyrightText: © Hypermode Inc. <hello@hypermode.com>
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export default function PredicateSearchBar({ predicates, onFilter }) {
    /*
     * Called when the search bar change event fires. Filters predicates and fires the 'filter' event.
     * @event - input change event
     */
    const handleChange = (event) => {
        const searchValue = event.target.value

        const filteredPredicates = predicates.filter((p) =>
            p.predicate.toLowerCase().includes(searchValue.toLowerCase()),
        )

        onFilter(filteredPredicates)
    }

    // Render
    return (
        <div className="pb-2 px-2 w-100">
            <input
                className="form-control"
                placeholder="Search predicates by name..."
                onChange={handleChange}
            />
        </div>
    )
}
