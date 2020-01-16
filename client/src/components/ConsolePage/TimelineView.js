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
import { Card, Form } from "react-bootstrap";
import Highlight from "react-highlight";

import "./TimelineView.scss";

export default function({ results }) {
    const [sortOrder, setSortOrder] = useState(1);
    const [compact, setCompact] = useState(true);

    let counter = 0;

    /*
     * Parses the result object and only shows records with the date field
     * @param results - result object to parse
     */
    const parseResults = results => {
        const data =
            results && results.response && results.response.data
                ? results.response.data
                : {};
        const parsedResults = [];

        for (var queryKey in data) {
            if (data[queryKey] instanceof Array) {
                parsedResults.push(...data[queryKey].filter(r => r.date));
            }
        }

        return parsedResults.sort(
            (a, b) => (new Date(a.date) - new Date(b.date)) * sortOrder,
        );
    };

    /*
     * Returns odd or even class based on the internal counter
     */
    const getOddOrEvenClass = () => (counter % 2 === 0 ? "even" : "odd");

    const renderInstructions = () => (
        <div className="text-muted text-center py-4">
            Your objects must contain a predicate or alias named 'date' to use
            the timeline display.
        </div>
    );

    /*
     * Renders the sort order selector
     */
    const renderSortOrderSelector = () => (
        <div className="sort-order-selector p-2">
            <Form.Control
                as="select"
                defaultValue={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
            >
                <option value={1}>Date: Ascending</option>
                <option value={-1}>Date: Descending</option>
            </Form.Control>
        </div>
    );

    /*
     * Renders a timeline object
     */
    const renderItem = obj => (
        <div
            key={counter++}
            className={
                "section " +
                getOddOrEvenClass() +
                (compact ? " compact" : " pb-4")
            }
        >
            <div className="marker" />
            <Card>
                <Card.Header className={compact ? "px-2 py-1" : ""}>
                    {new Date(obj.date).toLocaleString()}
                </Card.Header>
                <Card.Body className={compact ? "px-2 py-1" : ""}>
                    <Highlight>{JSON.stringify(obj, null, 2)}</Highlight>
                </Card.Body>
            </Card>
        </div>
    );

    // Render function starts here
    const timelineObjects = parseResults(results);

    return (
        <div>
            <div className="d-flex">
                {renderSortOrderSelector()}

                <div className="align-self-center pl-1">
                    <Form.Check
                        label="Compact Mode"
                        checked={compact}
                        onChange={e => setCompact(e.target.checked)}
                    />
                </div>
            </div>

            {timelineObjects.length === 0 && renderInstructions()}

            <div className="timeline pb-4">
                {timelineObjects.map(renderItem)}
            </div>
        </div>
    );
}
