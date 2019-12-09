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

import React from "react";

export default function({ predicates, onFilter }) {
    /*
     * Called when the search bar change event fires. Filters predicates and fires the 'filter' event.
     * @event - input change event
     */
    const handleChange = event => {
        const searchValue = event.target.value;

        const filteredPredicates = predicates.filter(p =>
            p.predicate.toLowerCase().includes(searchValue.toLowerCase()),
        );

        onFilter(filteredPredicates);
    };

    // Render
    return (
        <div className="pb-2 px-2 w-100">
            <input
                className="form-control"
                placeholder="Search predicates by name..."
                onChange={handleChange}
            />
        </div>
    );
}

/*
export default class PredicateSearchBar extends React.Component {
    
    handleChange = event => {
        
    };

    render() {
        return (
            <div className="pb-2 px-2 w-100">
                <input
                    className="form-control"
                    placeholder="Search predicates by name..."
                    onChange={handleChange}
                />
            </div>
        );
    }
}*/
